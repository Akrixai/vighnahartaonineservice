import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/applications - Get applications
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
      .from('applications')
      .select(`
        id,
        user_id,
        scheme_id,
        form_data,
        documents,
        status,
        amount,
        notes,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        created_at,
        updated_at,
        processed_at,
        approved_by,
        rejected_by,
        schemes (
          id,
          name,
          description,
          price,
          category
        ),
        users!applications_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (session.user.role === 'RETAILER') {
      query = query.eq('user_id', session.user.id);
    }
    // Admin and Employee can see all applications

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      scheme_id,
      form_data,
      documents,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      amount
    } = body;

    if (!scheme_id || !customer_name || !customer_phone || !customer_address) {
      return NextResponse.json(
        { error: 'Scheme ID, customer name, phone, and address are required' },
        { status: 400 }
      );
    }

    // Get scheme details
    const { data: scheme, error: schemeError } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', scheme_id)
      .eq('is_active', true)
      .single();

    if (schemeError || !scheme) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    // Check if user has sufficient balance (if scheme is not free)
    if (!scheme.is_free && scheme.price > 0) {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', session.user.id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet error:', walletError);
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createWalletError } = await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: session.user.id,
            balance: 0
          })
          .select('id, balance')
          .single();

        if (createWalletError || !newWallet) {
          console.error('Error creating wallet:', createWalletError);
          return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
        }

        // Check balance again with new wallet
        if (newWallet.balance < scheme.price) {
          return NextResponse.json(
            { error: 'Insufficient wallet balance' },
            { status: 400 }
          );
        }
      } else {
        const currentBalance = parseFloat(wallet.balance.toString());
        if (currentBalance < scheme.price) {
          return NextResponse.json(
            { error: 'Insufficient wallet balance' },
            { status: 400 }
          );
        }
      }

      // Deduct amount from wallet
      const { error: deductError } = await supabaseAdmin
        .from('wallets')
        .update({ balance: currentBalance - scheme.price })
        .eq('user_id', session.user.id);

      if (deductError) {
        console.error('Error deducting from wallet:', deductError);
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
      }

      // Create transaction record
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: session.user.id,
          wallet_id: wallet.id,
          type: 'SCHEME_PAYMENT',
          amount: -scheme.price,
          status: 'COMPLETED',
          description: `Payment for ${scheme.name}`,
          reference: `scheme_${scheme_id}`
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Don't fail the application, just log the error
      }
    }

    // Create application
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: session.user.id,
        scheme_id,
        form_data: form_data || {},
        documents: documents || [],
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        amount: amount || (scheme.is_free ? 0 : scheme.price),
        status: 'PENDING'
      })
      .select(`
        id,
        form_data,
        documents,
        status,
        amount,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        created_at,
        schemes (
          id,
          name,
          description,
          price,
          category
        )
      `)
      .single();

    if (applicationError) {
      console.error('Error creating application:', applicationError);
      console.error('Application data that failed:', {
        user_id: session.user.id,
        scheme_id,
        form_data: form_data || {},
        documents: documents || [],
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        amount: amount || (scheme.is_free ? 0 : scheme.price)
      });
      return NextResponse.json({
        error: 'Failed to create application',
        details: applicationError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
