import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// POST - Process refund (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { original_transaction_id, amount, reason } = await request.json();

    if (!original_transaction_id || !amount || !reason) {
      return NextResponse.json({ 
        error: 'Original transaction ID, amount, and reason are required' 
      }, { status: 400 });
    }

    // Get the original transaction
    const { data: originalTransaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', original_transaction_id)
      .single();

    if (fetchError || !originalTransaction) {
      return NextResponse.json({ error: 'Original transaction not found' }, { status: 404 });
    }

    if (originalTransaction.type !== 'SCHEME_PAYMENT' || originalTransaction.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Only completed scheme payments can be refunded' 
      }, { status: 400 });
    }

    if (amount > originalTransaction.amount) {
      return NextResponse.json({ 
        error: 'Refund amount cannot exceed original transaction amount' 
      }, { status: 400 });
    }

    // Create refund transaction
    const { data: refundTransaction, error: refundError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: originalTransaction.user_id,
        wallet_id: originalTransaction.wallet_id,
        type: 'REFUND',
        amount: amount,
        status: 'PENDING',
        description: `Refund for transaction ${original_transaction_id}: ${reason}`,
        reference: `REFUND-${original_transaction_id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (refundError) {
      console.error('Error creating refund transaction:', refundError);
      return NextResponse.json({ error: 'Failed to create refund transaction' }, { status: 500 });
    }

    return NextResponse.json(refundTransaction);

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
