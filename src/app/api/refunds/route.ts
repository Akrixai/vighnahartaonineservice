import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET /api/refunds - Get refunds for current user or all refunds for admin/employee
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('refunds')
      .select(`
        *,
        user:users!refunds_user_id_fkey(id, name, email, phone),
        application:applications(id, scheme_id, customer_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter based on user role
    if (session.user.role === UserRole.RETAILER) {
      query = query.eq('user_id', session.user.id);
    }
    // Admin and employees can see all refunds

    if (status) {
      query = query.eq('status', status);
    }

    const { data: refunds, error } = await query;

    if (error) {
      console.error('Error fetching refunds:', error);
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    return NextResponse.json(refunds);

  } catch (error) {
    console.error('Error in GET /api/refunds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/refunds - Create new refund request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized - Retailer access required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      application_id,
      amount,
      reason,
      description,
      documents,
      contact_number,
      qr_screenshot_url
    } = body;

    if (!amount || !reason) {
      return NextResponse.json({
        error: 'Amount and reason are required'
      }, { status: 400 });
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return NextResponse.json({
        error: 'Amount must be greater than 0'
      }, { status: 400 });
    }

    const { data: refund, error } = await supabaseAdmin
      .from('refunds')
      .insert({
        user_id: session.user.id,
        application_id: application_id || null,
        amount: parseFloat(amount),
        reason,
        description: description || null,
        documents: documents || [],
        contact_number: contact_number || null,
        qr_screenshot_url: qr_screenshot_url || null,
        status: 'PENDING'
      })
      .select(`
        *,
        user:users!refunds_user_id_fkey(id, name, email, phone),
        application:applications(id, scheme_id, customer_name)
      `)
      .single();

    if (error) {
      console.error('Error creating refund:', error);
      return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
    }

    // Create notification for admin/employees
    await supabaseAdmin
      .from('notifications')
      .insert({
        title: 'New Refund Request',
        message: `Retailer ${session.user.name} has submitted a refund request for ₹${amount}`,
        type: 'REFUND_SUBMITTED',
        data: { refund_id: refund.id, amount, reason },
        target_roles: ['ADMIN', 'EMPLOYEE'],
        created_by: session.user.id
      });

    return NextResponse.json({
      success: true,
      refund,
      message: 'Refund request submitted successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/refunds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
