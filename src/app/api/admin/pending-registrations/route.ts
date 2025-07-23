import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeRetailerEmail, sendWelcomeEmployeeEmail } from '@/lib/email-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-meta-api';

// GET - Fetch all pending registrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data: registrations, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending registrations:', error);
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      registrations: registrations || []
    });

  } catch (error) {
    console.error('Error in GET /api/admin/pending-registrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Approve or reject a registration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { registrationId, action, rejectionReason } = await request.json();

    if (!registrationId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get the pending registration
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Registration not found or already processed' }, { status: 404 });
    }

    if (action === 'approve') {
      // Create the user account
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          address: registration.address,
          city: registration.city,
          state: registration.state,
          pincode: registration.pincode,
          password_hash: registration.password_hash,
          role: registration.role,
          is_active: true,
          created_by: session.user.id
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      // Create wallet for the user
      const { error: walletError } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: 0
        });

      if (walletError) {
        console.error('Error creating wallet:', walletError);
        // Don't fail approval if wallet creation fails
      }

      // Update registration status
      const { error: updateError } = await supabaseAdmin
        .from('pending_registrations')
        .update({
          status: 'approved',
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateError) {
        console.error('Error updating registration status:', updateError);
      }

      // Send approval notifications
      try {
        // Send welcome email
        if (registration.role === UserRole.RETAILER) {
          await sendWelcomeRetailerEmail(registration.name, registration.email, 'Please login with your registered password');
        } else if (registration.role === UserRole.EMPLOYEE) {
          await sendWelcomeEmployeeEmail(registration.name, registration.email, 'Please login with your registered password');
        }

        // Send WhatsApp notification to user
        if (registration.phone) {
          const userMessage = `🎉 Registration Approved!\n\n👋 Hello ${registration.name},\n\nYour ${registration.role} account has been approved and activated!\n\n📧 Email: ${registration.email}\n🔑 You can now login to access your dashboard.\n\n🚀 Login: http://localhost:3000/login?role=${registration.role.toLowerCase()}\n\n🌟 Welcome to विघ्नहर्ता जनसेवा!`;
          await sendWhatsAppMessage(registration.phone, userMessage);
        }

        // Send admin notification
        const adminMessage = `✅ Registration Approved\n\n👤 Name: ${registration.name}\n📧 Email: ${registration.email}\n📱 Phone: ${registration.phone || 'Not provided'}\n🏙️ City: ${registration.city || 'Not provided'}\n\n✅ Account activated successfully!\n\nApproved by: ${session.user.name}`;
        await sendWhatsAppMessage('9764664021', adminMessage);

      } catch (notificationError) {
        console.error('Error sending approval notifications:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Registration approved successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } else if (action === 'reject') {
      // Update registration status to rejected
      const { error: updateError } = await supabaseAdmin
        .from('pending_registrations')
        .update({
          status: 'rejected',
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: rejectionReason || 'No reason provided',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateError) {
        console.error('Error updating registration status:', updateError);
        return NextResponse.json({ error: 'Failed to reject registration' }, { status: 500 });
      }

      // Send rejection notification
      try {
        if (registration.phone) {
          const userMessage = `❌ Registration Rejected\n\n👋 Hello ${registration.name},\n\nWe regret to inform you that your ${registration.role} registration has been rejected.\n\n📧 Email: ${registration.email}\n\nReason: ${rejectionReason || 'Please contact support for more details'}\n\n📞 Contact support: support@vignahartajanseva.gov.in\n\nYou can reapply after addressing the issues.`;
          await sendWhatsAppMessage(registration.phone, userMessage);
        }

        // Send admin notification
        const adminMessage = `❌ Registration Rejected\n\n👤 Name: ${registration.name}\n📧 Email: ${registration.email}\n📱 Phone: ${registration.phone || 'Not provided'}\n\nReason: ${rejectionReason || 'No reason provided'}\n\nRejected by: ${session.user.name}`;
        await sendWhatsAppMessage('7499116527', adminMessage);

      } catch (notificationError) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error sending rejection notifications:', notificationError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Registration rejected successfully'
      });
    }

  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in POST /api/admin/pending-registrations:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a registration record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('pending_registrations')
      .delete()
      .eq('id', registrationId);

    if (error) {
      console.error('Error deleting registration:', error);
      return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/pending-registrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
