import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// PATCH - Update refund status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const refundId = params.id;
    const { status } = await request.json();

    if (!status || !['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    // Get the refund transaction
    const { data: refundTransaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', refundId)
      .eq('type', 'REFUND')
      .single();

    if (fetchError || !refundTransaction) {
      return NextResponse.json({ error: 'Refund transaction not found' }, { status: 404 });
    }

    // Update refund status
    const { data: updatedRefund, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', refundId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating refund status:', updateError);
      return NextResponse.json({ error: 'Failed to update refund status' }, { status: 500 });
    }

    // If refund is completed, update the user's wallet balance
    if (status === 'COMPLETED') {
      const { error: walletError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: supabaseAdmin.raw(`balance + ${refundTransaction.amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundTransaction.wallet_id);

      if (walletError) {
        console.error('Error updating wallet balance:', walletError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json(updatedRefund);

  } catch (error) {
    console.error('Error updating refund:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
