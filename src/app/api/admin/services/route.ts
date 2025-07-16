import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';
import { notifyUsersAboutNewScheme } from '@/lib/whatsapp-new';
import { sendBulkWhatsAppNotifications } from '@/lib/whatsapp-meta-api';
import { sendNewServiceNotifications } from '@/lib/email-service';

// GET - Fetch all services (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: services, error } = await supabaseAdmin
      .from('schemes')
      .select(`
        *,
        created_by_user:users!schemes_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      services: services || [] 
    });

  } catch (error) {
    console.error('Error in services GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new service (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      is_free,
      category,
      documents,
      processing_time_days,
      commission_rate,
      dynamic_fields,
      required_documents,
      image_url
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ 
        error: 'Service name is required' 
      }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ 
        error: 'Price cannot be negative' 
      }, { status: 400 });
    }

    if (commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({
        error: 'Commission rate must be between 0 and 100'
      }, { status: 400 });
    }

    // Verify the user exists in the database
    const { data: userExists, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userExists) {
      console.error('❌ User verification failed:', userError);
      return NextResponse.json({
        error: 'User not found in database',
        details: userError?.message
      }, { status: 400 });
    }

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .insert({
        name,
        description,
        price: is_free ? 0 : price,
        is_free: is_free || false,
        category,
        documents: documents || [],
        processing_time_days: processing_time_days || 7,
        commission_rate: commission_rate || 0,
        dynamic_fields: dynamic_fields || [],
        required_documents: required_documents || [],
        image_url: image_url || null,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating service:', error);
      return NextResponse.json({
        error: 'Failed to create service',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Service created successfully:', service);

    // Trigger WhatsApp notifications for new service using Meta API
    try {
      console.log('📱 Triggering WhatsApp notifications using Meta API...');

      // Get all active retailers and employees with phone numbers
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, role')
        .in('role', ['RETAILER', 'EMPLOYEE'])
        .eq('is_active', true)
        .not('phone', 'is', null)
        .neq('phone', '');

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      if (users && users.length > 0) {
        const recipients = users.map(user => ({
          phone: user.phone,
          name: user.name,
          id: user.id
        }));

        // Send WhatsApp notifications using Meta API
        const result = await sendBulkWhatsAppNotifications(
          recipients,
          service.name,
          service.description || 'New service available on our portal'
        );

        // Log notification results to database
        for (const notificationResult of result.results) {
          await supabaseAdmin
            .from('whatsapp_notifications')
            .insert({
              scheme_id: service.id,
              recipient_phone: notificationResult.phone,
              recipient_type: users.find(u => u.id === notificationResult.recipientId)?.role?.toLowerCase() || 'unknown',
              recipient_id: notificationResult.recipientId,
              message_content: `New service: ${service.name}`,
              status: notificationResult.success ? 'sent' : 'failed',
              message_id: notificationResult.messageId,
              error_message: notificationResult.error,
              sent_at: notificationResult.success ? new Date().toISOString() : null
            });
        }

        console.log(`✅ WhatsApp notifications completed: ${result.successful} sent, ${result.failed} failed`);
      } else {
        console.log('ℹ️ No users found for WhatsApp notifications');
      }
    } catch (notificationError) {
      console.error('❌ Error triggering WhatsApp notifications:', notificationError);
      // Don't fail the service creation if notifications fail
    }

    // Trigger Email notifications for new service
    try {
      console.log('📧 Triggering email notifications...');
      await sendNewServiceNotifications(service.id, service.name, service.description);
      console.log('✅ Email notifications triggered successfully');
    } catch (emailError) {
      console.error('❌ Error triggering email notifications:', emailError);
      // Don't fail the service creation if email notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Error in services POST:', error);

    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Detailed error:', errorMessage);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}
