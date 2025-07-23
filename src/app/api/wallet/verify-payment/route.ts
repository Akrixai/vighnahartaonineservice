import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount 
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Check if payment was already processed by webhook
    const { data: existingTransaction } = await supabaseAdmin
      .from('transactions')
      .select('id, status, amount')
      .eq('reference', razorpay_payment_id)
      .single();

    if (existingTransaction) {
      if (existingTransaction.status === 'COMPLETED') {
        // Get updated wallet balance
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('balance')
          .eq('user_id', session.user.id)
          .single();

        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          data: {
            transaction: existingTransaction,
            wallet: { balance: wallet?.balance || 0 }
          }
        });
      } else {
        return NextResponse.json({
          error: 'Payment processing failed'
        }, { status: 400 });
      }
    }

    // Verify signature
    const body_string = razorpay_order_id + '|' + razorpay_payment_id;
    const expected_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest('hex');

    if (expected_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Convert amount from paise to rupees
    const amountInRupees = amount / 100;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: session.user.id,
        wallet_id: wallet.id,
        type: 'DEPOSIT',
        amount: amountInRupees,
        status: 'COMPLETED',
        description: 'Wallet top-up via Razorpay (manual verification)',
        reference: razorpay_payment_id,
        metadata: {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          processed_via: 'manual_verification',
          processed_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (transactionError) {
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
    }

    // Update wallet balance - ensure proper number handling
    const currentBalance = typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
    const newBalance = currentBalance + amountInRupees;
    
    const { data: updatedWallet, error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and wallet updated successfully',
      data: {
        transaction,
        wallet: updatedWallet
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
