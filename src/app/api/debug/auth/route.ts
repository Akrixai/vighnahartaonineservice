import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

// Debug endpoint to test authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 Debug Auth - Testing credentials for:', email);

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

    console.log('🔍 Database query result:', {
      userFound: !!user,
      error: error?.message,
      userRole: user?.role,
      isActive: user?.is_active
    });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: email
      }, { status: 404 });
    }

    if (!user.is_active) {
      console.log('❌ User account is inactive');
      return NextResponse.json({
        success: false,
        error: 'User account is inactive'
      }, { status: 401 });
    }

    // Test password
    console.log('🔑 Testing password...');
    console.log('🔑 Password from request:', password);
    console.log('🔑 Hash from database:', user.password_hash);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔑 Password valid:', isPasswordValid);

    // Additional debug: test with known working hash
    const testHash = '$2b$12$pvj1HbLX957dFUxFPRhqeecrKMoQIAp7k46HVvBur6o8xx.9UZi4q';
    const testValid = await bcrypt.compare(password, testHash);
    console.log('🔑 Test with known hash:', testValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return NextResponse.json({
        success: false,
        error: 'Invalid password'
      }, { status: 401 });
    }

    console.log('✅ Authentication successful');
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
    console.error('💥 Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
