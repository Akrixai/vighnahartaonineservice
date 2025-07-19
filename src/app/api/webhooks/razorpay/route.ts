import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Razorpay webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('❌ Missing Razorpay signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Missing Razorpay webhook secret');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    console.log('📱 Razorpay webhook received:', event.event, event.payload?.payment?.entity?.id);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity, event.payload.payment.entity);
        break;
      
      default:
        console.log(`ℹ️ Unhandled Razorpay event: ${event.event}`);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('❌ Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    console.log('💰 Processing payment captured:', payment.id);

    // Extract user info from payment notes
    const userId = payment.notes?.user_id;
    if (!userId) {
      console.error('❌ No user ID found in payment notes');
      return;
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet not found for user:', userId);
      return;
    }

    // Convert amount from paise to rupees
    const amountInRupees = payment.amount / 100;

    // Update wallet balance
    const newBalance = parseFloat(wallet.balance.toString()) + amountInRupees;
    
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Failed to update wallet balance:', updateError);
      return;
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'DEPOSIT',
        amount: amountInRupees,
        status: 'COMPLETED',
        description: 'Wallet top-up via Razorpay',
        reference: payment.id,
        metadata: {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          method: payment.method,
          captured_at: payment.captured_at
        }
      });

    if (transactionError) {
      console.error('❌ Failed to create transaction record:', transactionError);
      return;
    }

    console.log('✅ Payment captured successfully processed for user:', userId);

  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.log('❌ Processing payment failed:', payment.id);

    const userId = payment.notes?.user_id;
    if (!userId) {
      console.error('❌ No user ID found in payment notes');
      return;
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet not found for user:', userId);
      return;
    }

    // Create failed transaction record
    const amountInRupees = payment.amount / 100;
    
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'DEPOSIT',
        amount: amountInRupees,
        status: 'FAILED',
        description: `Failed wallet top-up: ${payment.error_description || 'Payment failed'}`,
        reference: payment.id,
        metadata: {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          error_code: payment.error_code,
          error_description: payment.error_description,
          failed_at: payment.created_at
        }
      });

    if (transactionError) {
      console.error('❌ Failed to create failed transaction record:', transactionError);
      return;
    }

    console.log('✅ Payment failure recorded for user:', userId);

  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
}

async function handleOrderPaid(order: any, payment: any) {
  try {
    console.log('📦 Processing order paid:', order.id);
    
    // This is a backup handler in case payment.captured is not received
    // Check if we already processed this payment
    const { data: existingTransaction } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('reference', payment.id)
      .eq('status', 'COMPLETED')
      .single();

    if (existingTransaction) {
      console.log('ℹ️ Payment already processed:', payment.id);
      return;
    }

    // Process the payment if not already done
    await handlePaymentCaptured(payment);

  } catch (error) {
    console.error('❌ Error handling order paid:', error);
  }
}

// GET method for webhook verification (if needed by Razorpay)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Razorpay webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
