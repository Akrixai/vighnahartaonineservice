import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/wallet - Get user's wallet
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: wallet, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching wallet for user:', session.user.id, error);
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }

    if (!wallet) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: session.user.id,
          balance: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: newWallet
      });
    }

    // Ensure balance is properly formatted as number
    const formattedWallet = {
      ...wallet,
      balance: typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance
    };

    console.log('Wallet fetched for user:', session.user.id, 'Balance:', formattedWallet.balance);

    return NextResponse.json({
      success: true,
      data: formattedWallet
    });

  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallet - Create wallet request for approval
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, description, reference, bank_details } = body;

    if (!amount || !type) {
      return NextResponse.json(
        { error: 'Amount and type are required' },
        { status: 400 }
      );
    }

    // Determine wallet request type
    let requestType: 'TOPUP' | 'WITHDRAWAL';
    if (type === 'DEPOSIT' || type === 'REFUND' || type === 'WALLET_TOPUP') {
      requestType = 'TOPUP';
    } else if (type === 'WITHDRAWAL' || type === 'SCHEME_PAYMENT') {
      requestType = 'WITHDRAWAL';

      // Check if user has sufficient balance for withdrawal
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      if (parseFloat(wallet.balance) < parseFloat(amount)) {
        return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Create wallet request for admin approval
    const { data: walletRequest, error: requestError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: session.user.id,
        type: requestType,
        amount: parseFloat(amount),
        payment_method: requestType === 'WITHDRAWAL' ? 'BANK_TRANSFER' : 'MANUAL',
        transaction_reference: reference || `${type}_${Date.now()}`,
        description: description || `${requestType} request via ${type}`,
        metadata: {
          original_type: type,
          bank_details: bank_details || null,
          created_via: 'api'
        },
        status: 'PENDING'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating wallet request:', requestError);
      return NextResponse.json({ error: 'Failed to create wallet request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${requestType} request submitted successfully. Waiting for admin approval.`,
      data: {
        request_id: walletRequest.id,
        type: requestType,
        amount: amount,
        status: 'PENDING'
      }
    });

  } catch (error) {
    console.error('Wallet request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
