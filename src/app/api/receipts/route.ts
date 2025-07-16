import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('receipts')
      .select(`
        id,
        application_id,
        retailer_id,
        employee_id,
        receipt_number,
        service_name,
        service_fee,
        processing_fee,
        total_amount,
        approval_date,
        receipt_data,
        created_at,
        retailer:users!receipts_retailer_id_fkey (
          id,
          name,
          email
        ),
        employee:users!receipts_employee_id_fkey (
          id,
          name,
          email
        ),
        application:applications!receipts_application_id_fkey (
          id,
          status,
          form_data,
          customer_name,
          customer_email,
          customer_phone
        )
      `)
      .order('approval_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter based on user role
    if (session.user.role === UserRole.RETAILER) {
      query = query.eq('retailer_id', session.user.id);
    }
    // Employees and admins can see all receipts

    const { data: receipts, error } = await query;

    if (error) {
      console.error('Error fetching receipts:', error);
      return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
    }

    return NextResponse.json({ receipts });

  } catch (error) {
    console.error('Receipts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get receipt count for pagination
export async function HEAD(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse(null, { status: 401 });
    }

    let query = supabaseAdmin
      .from('receipts')
      .select('id', { count: 'exact', head: true });

    // Filter based on user role
    if (session.user.role === UserRole.RETAILER) {
      query = query.eq('retailer_id', session.user.id);
    }

    const { count, error } = await query;

    if (error) {
      return new NextResponse(null, { status: 500 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': count?.toString() || '0'
      }
    });

  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
