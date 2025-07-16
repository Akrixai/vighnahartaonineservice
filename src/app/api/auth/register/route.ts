import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';
import { validateEmail, validatePhone } from '@/lib/utils';
import { sendWelcomeRetailerEmail, sendWelcomeEmployeeEmail } from '@/lib/email-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-meta-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      role = UserRole.RETAILER
    } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Only allow retailer registration through this endpoint
    if (role !== UserRole.RETAILER) {
      return NextResponse.json(
        { error: 'Only retailer registration is allowed through this endpoint' },
        { status: 400 }
      );
    }

    // Validate required fields for retailers
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required for retailers' },
        { status: 400 }
      );
    }

    if (!address || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Address, city, state, and pincode are required for retailers' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit PIN code' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        password_hash: hashedPassword,
        role
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create wallet for the user
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: user.id,
        balance: 0
      })
      .select()
      .single();

    if (walletError) {
      console.error('Error creating wallet:', walletError);
      // Don't fail user creation, just log the error
    }

    // Send welcome notifications
    try {
      console.log(`📧 Sending welcome notifications to ${name} (${email})`);

      // Send welcome email
      if (role === UserRole.RETAILER) {
        await sendWelcomeRetailerEmail(name, email, password);
      } else if (role === UserRole.EMPLOYEE) {
        await sendWelcomeEmployeeEmail(name, email, password);
      }

      // Send WhatsApp notification if phone number is provided
      if (phone) {
        const welcomeMessage = `🎉 Welcome to विघ्नहर्ता जनसेवा!\n\nHello ${name}!\n\nYour ${role.toLowerCase()} account has been successfully created.\n\n📧 Email: ${email}\n🔐 Password: ${password}\n\n⚠️ Please change your password after first login.\n\n🚀 Login: http://localhost:3000/login?role=${role.toLowerCase()}\n\nThank you for joining us!`;

        await sendWhatsAppMessage(phone, welcomeMessage);
        console.log(`📱 WhatsApp welcome message sent to ${phone}`);
      }

      // Send admin notification
      const adminMessage = `🆕 New ${role} Registration\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone || 'Not provided'}\n🏠 Address: ${address || 'Not provided'}\n🏙️ City: ${city || 'Not provided'}\n\n✅ Account created successfully!`;
      await sendWhatsAppMessage('9764664021', adminMessage);

      console.log('✅ Welcome notifications sent successfully');
    } catch (notificationError) {
      console.error('❌ Error sending welcome notifications:', notificationError);
      // Don't fail registration if notifications fail
    }

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
