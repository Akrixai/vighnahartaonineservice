import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import bcrypt from 'bcryptjs';

// Simple validation functions
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string) => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// PUT - Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await request.json();

    console.log('Updating user:', userId, 'with data:', body);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from modifying their own role or status
    if (existingUser.id === session.user.id && (body.role || body.is_active === false)) {
      return NextResponse.json({ 
        error: 'Cannot modify your own role or deactivate your own account' 
      }, { status: 400 });
    }

    // Validation
    if (body.email && !validateEmail(body.email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    if (body.phone && !validatePhone(body.phone)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format' 
      }, { status: 400 });
    }

    if (body.password && body.password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    if (body.role) {
      const validRoles = ['ADMIN', 'EMPLOYEE', 'RETAILER'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ 
          error: 'Invalid role' 
        }, { status: 400 });
      }
    }

    // Check if email is already taken by another user
    if (body.email && body.email !== existingUser.email) {
      const { data: emailUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', body.email)
        .neq('id', userId)
        .single();

      if (emailUser) {
        return NextResponse.json({ 
          error: 'Email is already taken by another user' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Hash password if provided
    if (body.password) {
      updateData.password_hash = await bcrypt.hash(body.password, 12);
      delete updateData.password;
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        address,
        city,
        state,
        pincode,
        employee_id,
        department,
        branch,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating user:', error);
      }
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user 
    });

  } catch (error) {
    console.error('Error in user PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (existingUser.id === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    // Check if user has applications or transactions
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if ((applications && applications.length > 0) || (transactions && transactions.length > 0)) {
      return NextResponse.json({ 
        error: 'Cannot delete user with existing applications or transactions. Deactivate the account instead.' 
      }, { status: 400 });
    }

    // Delete user's wallet first
    await supabaseAdmin
      .from('wallets')
      .delete()
      .eq('user_id', userId);

    // Delete user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });

  } catch (error) {
    console.error('Error in user DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
