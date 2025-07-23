import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET /api/wallet-requests - Get wallet requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('wallet_requests_view')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (session.user.role === 'RETAILER') {
      query = query.eq('user_id', session.user.id);
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching wallet requests:', error);
      return NextResponse.json({ error: 'Failed to fetch wallet requests' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('wallet_requests')
      .select('*', { count: 'exact', head: true });

    if (session.user.role === 'RETAILER') {
      countQuery = countQuery.eq('user_id', session.user.id);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status.toUpperCase());
    }

    const { count } = await countQuery;

    return NextResponse.json({
      requests: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in wallet requests API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallet-requests - Create new wallet request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      amount,
      payment_method,
      transaction_reference,
      screenshot_url,
      description,
      metadata
    } = body;

    // Validate required fields
    if (!type || !amount || !payment_method) {
      return NextResponse.json({
        error: 'Type, amount, and payment method are required'
      }, { status: 400 });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({
        error: 'Amount must be a positive number'
      }, { status: 400 });
    }

    // Validate type
    if (!['TOPUP', 'WITHDRAWAL'].includes(type.toUpperCase())) {
      return NextResponse.json({
        error: 'Invalid request type'
      }, { status: 400 });
    }

    // For withdrawal, check if user has sufficient balance
    if (type.toUpperCase() === 'WITHDRAWAL') {
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      if (!wallet || wallet.balance < numAmount) {
        return NextResponse.json({
          error: 'Insufficient wallet balance'
        }, { status: 400 });
      }
    }

    // Create wallet request
    const { data: walletRequest, error: requestError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: session.user.id,
        type: type.toUpperCase(),
        amount: numAmount,
        payment_method,
        transaction_reference: transaction_reference || `${type.toUpperCase()}_${Date.now()}`,
        screenshot_url,
        description: description || `${type} request`,
        metadata: metadata || {},
        status: 'PENDING'
      })
      .select(`
        id,
        type,
        amount,
        status,
        payment_method,
        transaction_reference,
        created_at
      `)
      .single();

    if (requestError) {
      console.error('Error creating wallet request:', requestError);
      return NextResponse.json({
        error: 'Failed to create wallet request'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet request created successfully',
      request: walletRequest
    });

  } catch (error) {
    console.error('Error creating wallet request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/wallet-requests - Process wallet request (Admin/Employee only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { request_id, action, rejection_reason } = body;

    // Validate required fields
    if (!request_id || !action) {
      return NextResponse.json({
        error: 'Request ID and action are required'
      }, { status: 400 });
    }

    // Validate action
    if (!['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
      return NextResponse.json({
        error: 'Invalid action. Must be APPROVE or REJECT'
      }, { status: 400 });
    }

    // If rejecting, rejection reason is required
    if (action.toUpperCase() === 'REJECT' && !rejection_reason) {
      return NextResponse.json({
        error: 'Rejection reason is required when rejecting a request'
      }, { status: 400 });
    }

    // Call the database function to process the request
    const { data: result, error: processError } = await supabaseAdmin
      .rpc('process_wallet_request', {
        request_id,
        action: action.toUpperCase(),
        processor_id: session.user.id,
        rejection_reason: rejection_reason || null
      });

    if (processError) {
      console.error('Error processing wallet request:', processError);
      return NextResponse.json({
        error: 'Failed to process wallet request'
      }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to process request'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error processing wallet request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
