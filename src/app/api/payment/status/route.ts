import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');

    if (!paymentId && !orderId) {
      return NextResponse.json({ 
        error: 'Payment ID or Order ID is required' 
      }, { status: 400 });
    }

    let paymentStatus = null;
    let orderStatus = null;

    // Check payment status from Razorpay
    if (paymentId) {
      try {
        const payment = await razorpay.payments.fetch(paymentId);
        paymentStatus = {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          captured: payment.captured,
          created_at: payment.created_at,
          error_code: payment.error_code,
          error_description: payment.error_description
        };
      } catch (error) {
        console.error('Error fetching payment from Razorpay:', error);
      }
    }

    // Check order status from Razorpay
    if (orderId) {
      try {
        const order = await razorpay.orders.fetch(orderId);
        orderStatus = {
          id: order.id,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
          created_at: order.created_at,
          payments: order.payments || []
        };
      } catch (error) {
        console.error('Error fetching order from Razorpay:', error);
      }
    }

    // Check transaction status in our database
    let transactionStatus = null;
    const reference = paymentId || orderId;
    
    if (reference) {
      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('reference', reference)
        .eq('user_id', session.user.id)
        .single();

      if (transaction) {
        transactionStatus = {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          created_at: transaction.created_at,
          metadata: transaction.metadata
        };
      }
    }

    // Get current wallet balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        payment: paymentStatus,
        order: orderStatus,
        transaction: transactionStatus,
        wallet: {
          balance: wallet?.balance || 0
        }
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ 
      error: 'Failed to check payment status' 
    }, { status: 500 });
  }
}

// POST method to manually sync payment status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payment_id, order_id } = await request.json();

    if (!payment_id) {
      return NextResponse.json({ 
        error: 'Payment ID is required' 
      }, { status: 400 });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(payment_id);

    if (payment.status === 'captured') {
      // Check if already processed
      const { data: existingTransaction } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('reference', payment_id)
        .eq('user_id', session.user.id)
        .single();

      if (existingTransaction) {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          data: { transaction: existingTransaction }
        });
      }

      // Process the payment manually
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', session.user.id)
        .single();

      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      const amountInRupees = payment.amount / 100;
      const newBalance = parseFloat(wallet.balance.toString()) + amountInRupees;

      // Update wallet balance
      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', session.user.id);

      // Create transaction record
      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: session.user.id,
          wallet_id: wallet.id,
          type: 'DEPOSIT',
          amount: amountInRupees,
          status: 'COMPLETED',
          description: 'Wallet top-up via Razorpay (manual sync)',
          reference: payment_id,
          metadata: {
            razorpay_payment_id: payment_id,
            razorpay_order_id: order_id,
            processed_via: 'manual_sync',
            synced_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        message: 'Payment synced successfully',
        data: {
          transaction,
          wallet: { balance: newBalance }
        }
      });

    } else {
      return NextResponse.json({
        success: false,
        message: `Payment status: ${payment.status}`,
        data: { payment_status: payment.status }
      });
    }

  } catch (error) {
    console.error('Error syncing payment:', error);
    return NextResponse.json({ 
      error: 'Failed to sync payment' 
    }, { status: 500 });
  }
}
