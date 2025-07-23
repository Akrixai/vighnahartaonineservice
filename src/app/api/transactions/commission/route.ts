import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Get commission transactions for the current user
export async function GET(request: NextRequest) {
  console.log('🔥 COMMISSION API CALLED - NEW VERSION');
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get commission transactions for the user
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        status,
        description,
        reference,
        metadata,
        created_at,
        updated_at,
        processed_by
      `)
      .eq('user_id', session.user.id)
      .eq('type', 'COMMISSION')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching commission transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch commission transactions' }, { status: 500 });
    }

    console.log('Commission transactions fetched successfully:', transactions?.length || 0);

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('type', 'COMMISSION');

    if (countError) {
      console.error('Error counting commission transactions:', countError);
    }

    // Calculate total commission earned
    const { data: totalData, error: totalError } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('user_id', session.user.id)
      .eq('type', 'COMMISSION')
      .eq('status', 'COMPLETED');

    const totalCommission = totalData?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        summary: {
          totalCommissionEarned: totalCommission,
          totalTransactions: count || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in commission transactions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
