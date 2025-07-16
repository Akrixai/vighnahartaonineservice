import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Fetch single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    // First get the order
    let orderQuery = supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        amount,
        delivery_charges,
        payment_method,
        status,
        customer_details,
        transaction_id,
        tracking_number,
        shipped_at,
        delivered_at,
        created_at,
        updated_at
      `)
      .eq('id', orderId)
      .single();

    // Filter based on user role
    if (session.user.role === UserRole.RETAILER) {
      orderQuery = orderQuery.eq('user_id', session.user.id);
    }
    // Admin and Employee can see all orders

    const { data: order, error: orderError } = await orderQuery;

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Fetch product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('id', order.product_id)
      .single();

    if (productError) {
      console.error('❌ Error fetching product:', productError);
    }

    // Fetch user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', order.user_id)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
    }

    // Format order for frontend
    const formattedOrder = {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id,
      product_name: product?.name || 'Unknown Product',
      product_image_url: product?.image_url || '',
      quantity: order.quantity,
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

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    console.error('Error in order API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and employees can update order status
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const { status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({
        error: 'Order ID and status are required'
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Invalid status'
      }, { status: 400 });
    }

    // Update order status
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !order) {
      console.error('Error updating order:', error);
      return NextResponse.json({
        success: false,
        error: 'Order not found or failed to update'
      }, { status: 404 });
    }

    // Real-time notifications will be handled by Supabase real-time
    console.log('📢 Order status updated successfully:', order.id);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
