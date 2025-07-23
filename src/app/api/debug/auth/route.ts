import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Debug endpoint to test authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Security: Never log credentials in production
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Debug Auth - Testing credentials for:', email);
    }

    // Check if user exists
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        password_hash,
        is_active,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        occupation,
        employee_id,
        department,
        created_at
      `)
      .eq('email', email)
      .single();

    // Security: Never log user data in production
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Database query result:', {
        userFound: !!user,
        error: error?.message,
        userRole: user?.role,
        isActive: user?.is_active
      });
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Database error:', error);
      }
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found');
      }
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: email
      }, { status: 404 });
    }

    if (!user.is_active) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User account is inactive');
      }
      return NextResponse.json({
        success: false,
        error: 'User account is inactive'
      }, { status: 401 });
    }

    // Test password - NEVER LOG PASSWORDS OR HASHES IN PRODUCTION
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Testing password...');
      console.log('🔑 Password length:', password.length);
      console.log('🔑 Hash exists:', !!user.password_hash);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Password valid:', isPasswordValid);
    }

    if (!isPasswordValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invalid password');
      }
      return NextResponse.json({
        success: false,
        error: 'Invalid password'
      }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Authentication successful');
    }
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        employeeId: user.employee_id,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Debug auth error:', error);
    }
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
