import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
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

// GET - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // First get users
    let userQuery = supabaseAdmin
      .from('users')
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
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role && role !== 'ALL') {
      userQuery = userQuery.eq('role', role);
    }

    const { data: users, error } = await userQuery;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get wallets for these users
    const userIds = users?.map(user => user.id) || [];
    let wallets: any[] = [];

    if (userIds.length > 0) {
      const { data: walletsData } = await supabaseAdmin
        .from('wallets')
        .select('id, user_id, balance')
        .in('user_id', userIds);

      wallets = walletsData || [];
    }

    // Transform users to include wallet info
    const transformedUsers = users?.map(user => ({
      ...user,
      wallet: wallets.find(wallet => wallet.user_id === user.id) || null
    })) || [];

    return NextResponse.json({ 
      success: true, 
      users: transformedUsers
    });

  } catch (error) {
    console.error('Error in users GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      role,
      employee_id,
      department,
      branch,
      address,
      city,
      state,
      pincode
    } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        error: 'Name, email, password, and role are required' 
      }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format' 
      }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    const validRoles = ['ADMIN', 'EMPLOYEE', 'RETAILER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role' 
      }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData: any = {
      name,
      email,
      phone: phone || null,
      password_hash: hashedPassword,
      role,
      created_by: session.user.id
    };

    // Add role-specific fields
    if (role === 'EMPLOYEE' || role === 'ADMIN') {
      if (employee_id) userData.employee_id = employee_id;
      if (department) userData.department = department;
      if (branch) userData.branch = branch;
    }

    if (role === 'RETAILER') {
      if (address) userData.address = address;
      if (city) userData.city = city;
      if (state) userData.state = state;
      if (pincode) userData.pincode = pincode;
      if (branch) userData.branch = branch;
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ 
        error: 'Failed to create user' 
      }, { status: 500 });
    }

    // Create wallet for the user
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: user.id,
        balance: 0
      });

    if (walletError) {
      console.error('Error creating wallet:', walletError);
      // Don't fail user creation, just log the error
    }

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
