import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch wallet requests with manual join
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('wallet_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Fetch pending transactions (for backward compatibility)
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (requestsError && transactionsError) {
      return NextResponse.json({
        error: 'Failed to fetch wallet data'
      }, { status: 500 });
    }

    // Get all unique user IDs
    const allUserIds = [
      ...(requests || []).map(r => r.user_id),
      ...(transactions || []).map(t => t.user_id)
    ];
    const uniqueUserIds = [...new Set(allUserIds)];

    // Fetch user data
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone')
      .in('id', uniqueUserIds);

    if (usersError) {
      // console.error('Error fetching users:', usersError);
    }

    // Create user lookup map
    const userMap = new Map();
    (users || []).forEach(user => {
      userMap.set(user.id, user);
    });

    // Combine and format the data
    const allRequests = [
      ...(requests || []).map(req => ({
        ...req,
        users: userMap.get(req.user_id) || { id: req.user_id, name: 'Unknown', email: 'Unknown', phone: null }
      })),
      ...(transactions || []).map(tx => ({
        id: tx.id,
        user_id: tx.user_id,
        type: tx.type === 'DEPOSIT' ? 'TOPUP' : 'WITHDRAWAL',
        amount: Math.abs(parseFloat(tx.amount)).toString(),
        status: tx.status,
        payment_method: tx.type === 'DEPOSIT' ? 'UPI' : 'BANK_TRANSFER',
        transaction_reference: tx.reference || `TX_${tx.id}`,
        description: tx.description || `${tx.type} transaction`,
        metadata: {
          original_transaction: true,
          transaction_id: tx.id,
          original_type: tx.type
        },
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        users: userMap.get(tx.user_id) || { id: tx.user_id, name: 'Unknown', email: 'Unknown', phone: null }
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      requests: allRequests
    });

  } catch (error) {
    // console.error('Error in wallet requests API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { request_id, action, rejection_reason, is_transaction } = await request.json();

    if (!request_id || !action) {
      return NextResponse.json({
        error: 'Request ID and action are required'
      }, { status: 400 });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Must be APPROVE or REJECT'
      }, { status: 400 });
    }

    // Handle direct transaction approval
    if (is_transaction) {
      // Get the transaction details
      const { data: transaction, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', request_id)
        .single();

      if (txError || !transaction) {
        return NextResponse.json({
          error: 'Transaction not found'
        }, { status: 404 });
      }

      if (action === 'APPROVE') {
        // Update transaction status to COMPLETED
        const { error: updateError } = await supabaseAdmin
          .from('transactions')
          .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString()
          })
          .eq('id', request_id);

        if (updateError) {
          // console.error('Error updating transaction:', updateError);
          return NextResponse.json({
            error: 'Failed to update transaction'
          }, { status: 500 });
        }

        // Update wallet balance
        const { data: wallet, error: walletError } = await supabaseAdmin
          .from('wallets')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .single();

        if (walletError || !wallet) {
          return NextResponse.json({
            error: 'Wallet not found'
          }, { status: 404 });
        }

        const currentBalance = typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
        const transactionAmount = parseFloat(transaction.amount);
        const newBalance = currentBalance + transactionAmount;

        const { error: balanceError } = await supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', transaction.user_id);

        if (balanceError) {
          // console.error('Error updating wallet balance:', balanceError);
          return NextResponse.json({
            error: 'Failed to update wallet balance'
          }, { status: 500 });
        }

      } else {
        // Reject transaction
        const { error: rejectError } = await supabaseAdmin
          .from('transactions')
          .update({
            status: 'FAILED',
            description: rejection_reason || 'Transaction rejected by admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', request_id);

        if (rejectError) {
          // console.error('Error rejecting transaction:', rejectError);
          return NextResponse.json({
            error: 'Failed to reject transaction'
          }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        message: action === 'APPROVE'
          ? 'Transaction approved and wallet updated successfully'
          : 'Transaction rejected successfully'
      });
    }

    // Handle wallet request approval (existing logic)
    const { data, error: processError } = await supabaseAdmin
      .rpc('process_wallet_request', {
        request_id: request_id,
        action: action,
        processor_id: session.user.id,
        rejection_reason: rejection_reason || null
      });

    if (processError) {
      // console.error('Error processing wallet request:', processError);
      return NextResponse.json({
        error: processError.message || 'Failed to process wallet request'
      }, { status: 500 });
    }

    // Parse the result from the function
    const result = data;
    if (result && !result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to process wallet request'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result?.message || (action === 'APPROVE'
        ? 'Wallet request approved and balance updated successfully'
        : 'Wallet request rejected successfully')
    });

  } catch (error) {
    // console.error('Error in wallet approval API:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
