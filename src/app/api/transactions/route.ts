import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/transactions - Get user's transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        id,
        user_id,
        wallet_id,
        type,
        amount,
        status,
        description,
        reference,
        metadata,
        created_at,
        updated_at,
        processed_by,
        users!transactions_user_id_fkey (
          id,
          name,
          email,
          phone
        ),
        wallets!transactions_wallet_id_fkey (
          id,
          balance
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (session.user.role === 'RETAILER') {
      query = query.eq('user_id', session.user.id);
      console.log('Filtering transactions for retailer:', session.user.id);
    }
    // Admin and Employee can see all transactions

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transactions, error, count } = await query;

    console.log('Transactions query result:', {
      user_role: session.user.role,
      user_id: session.user.id,
      transactions_count: transactions?.length || 0,
      error: error
    });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, description, reference } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
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

    // Validate transaction based on type
    const transactionAmount = parseFloat(amount.toString());
    
    if (type === 'WITHDRAWAL' || type === 'SCHEME_PAYMENT') {
      const currentBalance = parseFloat(wallet.balance.toString());
      if (currentBalance < transactionAmount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }
    }

    // Validate transaction type against enum
    const validTypes = ['DEPOSIT', 'WITHDRAWAL', 'SCHEME_PAYMENT', 'REFUND', 'COMMISSION'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    // Create transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: session.user.id,
        wallet_id: wallet.id,
        type,
        amount: transactionAmount,
        status: type === 'DEPOSIT' ? 'PENDING' : 'COMPLETED',
        description,
        reference
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Update wallet balance if transaction is completed
    if (transaction.status === 'COMPLETED') {
      const currentBalance = typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
      let newBalance = currentBalance;

      if (type === 'DEPOSIT' || type === 'REFUND' || type === 'COMMISSION') {
        newBalance += transactionAmount;
      } else if (type === 'WITHDRAWAL' || type === 'SCHEME_PAYMENT') {
        newBalance -= transactionAmount;
      }

      // Ensure balance doesn't go negative
      if (newBalance < 0) {
        return NextResponse.json({
          error: 'Transaction would result in negative balance'
        }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        return NextResponse.json({
          error: 'Failed to update wallet balance'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
