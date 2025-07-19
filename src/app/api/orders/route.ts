import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔄 Fetching orders for user:', session.user.id, 'Role:', session.user.role);

    // Get orders first
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (session.user.role === UserRole.RETAILER) {
      console.log('🛍️ Filtering orders for retailer:', session.user.id);
      ordersQuery = ordersQuery.eq('user_id', session.user.id);
    } else {
      console.log('👨‍💼 Admin/Employee - showing all orders');
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    console.log('📊 Query result - Orders found:', orders?.length || 0);
    if (ordersError) {
      console.error('❌ Database error:', ordersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        total: 0
      });
    }

    // Get unique product IDs and user IDs
    const productIds = [...new Set(orders.map(order => order.product_id))];
    const userIds = [...new Set(orders.map(order => order.user_id))];

    // Fetch products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, image_url')
      .in('id', productIds);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
    }

    // Fetch users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    }

    // Create lookup maps
    const productMap = new Map(products?.map(p => [p.id, p]) || []);
    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    // Format orders with joined data
    const formattedOrders = orders.map(order => {
      const product = productMap.get(order.product_id);
      const user = userMap.get(order.user_id);

      return {
        id: order.id,
        user_id: order.user_id,
        product_id: order.product_id,
        product_name: product?.name || 'Unknown Product',
        product_image_url: product?.image_url || '',
        quantity: order.quantity || 1,
        amount: parseFloat(order.amount),
        delivery_charges: parseFloat(order.delivery_charges || '0'),
        payment_method: order.payment_method,
        status: order.status,
        customer_details: order.customer_details,
        transaction_id: order.transaction_id,
        tracking_number: order.tracking_number,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at,
        created_at: order.created_at,
        updated_at: order.updated_at,
        user_name: user?.name || 'Unknown User',
        user_email: user?.email || '',
        // Include full product and user objects for compatibility
        products: product,
        users: user
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, payment_method, amount, delivery_charges, customer_details } = await request.json();

    // Validate required fields
    if (!product_id || !payment_method || !amount || !customer_details) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ 
        error: 'Product not found or inactive' 
      }, { status: 404 });
    }

    // Check stock availability
    if (product.stock_quantity !== null && product.stock_quantity <= 0) {
      return NextResponse.json({ 
        error: 'Product is out of stock' 
      }, { status: 400 });
    }

    let walletTransaction = null;

    // Handle wallet payment
    if (payment_method === 'WALLET') {
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ 
          error: 'Wallet not found' 
        }, { status: 404 });
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        return NextResponse.json({ 
          error: 'Insufficient wallet balance' 
        }, { status: 400 });
      }

      // Deduct amount from wallet
      const { error: updateWalletError } = await supabaseAdmin
        .from('wallets')
        .update({ 
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateWalletError) {
        console.error('Error updating wallet:', updateWalletError);
        return NextResponse.json({ 
          error: 'Failed to process wallet payment' 
        }, { status: 500 });
      }

      // Create wallet transaction record
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: session.user.id,
          wallet_id: wallet.id,
          type: 'DEBIT',
          amount: amount,
          status: 'COMPLETED',
          description: `Product purchase: ${product.name}`,
          reference: `ORDER_${Date.now()}`,
          metadata: {
            product_id: product_id,
            product_name: product.name,
            payment_method: 'WALLET'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Don't fail the order if transaction logging fails
      } else {
        walletTransaction = transaction;
      }
    }

    // Create order record
    const orderData = {
      user_id: session.user.id,
      product_id: product_id,
      quantity: 1, // Default quantity
      amount: amount,
      delivery_charges: delivery_charges || 0,
      payment_method: payment_method,
      status: payment_method === 'WALLET' ? 'CONFIRMED' : 'PENDING',
      customer_details: customer_details,
      transaction_id: walletTransaction?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      
      // If wallet payment was processed, we need to refund
      if (payment_method === 'WALLET' && walletTransaction) {
        // Refund the wallet
        await supabaseAdmin
          .from('wallets')
          .update({ 
            balance: supabaseAdmin.sql`balance + ${amount}`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);
      }
      
      return NextResponse.json({ 
        error: 'Failed to create order' 
      }, { status: 500 });
    }

    // Update product stock if applicable
    if (product.stock_quantity !== null) {
      await supabaseAdmin
        .from('products')
        .update({ 
          stock_quantity: product.stock_quantity - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id);
    }

    // Real-time notifications will be handled by Supabase real-time
    console.log('📢 Order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order.id,
        status: order.status,
        amount: order.amount,
        payment_method: order.payment_method
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}


