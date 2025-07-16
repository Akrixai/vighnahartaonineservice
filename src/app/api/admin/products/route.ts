import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Fetch all products (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      products: products || [] 
    });

  } catch (error) {
    console.error('Error in products GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      category,
      features,
      stock_quantity,
      image_url
    } = body;

    // Validation
    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Name and price are required' 
      }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ 
        error: 'Price cannot be negative' 
      }, { status: 400 });
    }

    if (stock_quantity < 0) {
      return NextResponse.json({ 
        error: 'Stock quantity cannot be negative' 
      }, { status: 400 });
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        description,
        price,
        category,
        features: features || [],
        stock_quantity: stock_quantity || 0,
        image_url,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product created successfully',
      product 
    });

  } catch (error) {
    console.error('Error in products POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
