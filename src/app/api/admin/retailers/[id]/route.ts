import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// PATCH - Update retailer (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const retailerId = params.id;
    const { is_active } = await request.json();

    // Check if retailer exists
    const { data: existingRetailer, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', retailerId)
      .eq('role', 'RETAILER')
      .single();

    if (fetchError || !existingRetailer) {
      return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
    }

    const updateData: {
      updated_at: string;
      is_active?: boolean;
      admin_notes?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const { data: updatedRetailer, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', retailerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating retailer:', error);
      return NextResponse.json({ error: 'Failed to update retailer' }, { status: 500 });
    }

    return NextResponse.json(updatedRetailer);

  } catch (error) {
    console.error('Error in retailer PATCH:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete retailer (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const retailerId = params.id;

    // Check if retailer exists
    const { data: existingRetailer, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', retailerId)
      .eq('role', 'RETAILER')
      .single();

    if (fetchError || !existingRetailer) {
      return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
    }

    // Delete retailer (this will cascade delete related records due to foreign key constraints)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', retailerId);

    if (error) {
      console.error('Error deleting retailer:', error);
      return NextResponse.json({ error: 'Failed to delete retailer' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Retailer deleted successfully' });

  } catch (error) {
    console.error('Error in retailer DELETE:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
