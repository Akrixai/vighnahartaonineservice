import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Check if pending registration already exists
    const { data: existingPending } = await supabaseAdmin
      .from('pending_registrations')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existingPending) {
      if (existingPending.status === 'pending') {
        return NextResponse.json(
          { error: 'Registration request already submitted and pending approval' },
          { status: 400 }
        );
      } else if (existingPending.status === 'rejected') {
        // Allow resubmission if previously rejected
        await supabaseAdmin
          .from('pending_registrations')
          .delete()
          .eq('email', email);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create pending registration instead of direct user creation
    const { data: pendingRegistration, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .insert({
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        password_hash: hashedPassword,
        role,
        status: 'pending'
      })
      .select()
      .single();

    if (pendingError) {
      console.error('Error creating pending registration:', pendingError);
      return NextResponse.json(
        { error: 'Failed to submit registration request' },
        { status: 500 }
      );
    }

    // Wallet will be created after approval

    // Send approval request notifications
    try {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Sending approval request notifications for ${name} (${email})`);
      }

      // Send admin notification for approval
      const adminMessage = `🆕 New ${role} Registration Request\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone || 'Not provided'}\n🏠 Address: ${address || 'Not provided'}\n🏙️ City: ${city || 'Not provided'}\n🏛️ State: ${state || 'Not provided'}\n📮 PIN: ${pincode || 'Not provided'}\n\n⏳ Status: Pending Approval\n\n🔍 Please review and approve/reject this registration request in the admin dashboard.`;
      await sendWhatsAppMessage('7499116527', adminMessage);

      // Get all employees to notify them as well
      const { data: employees } = await supabaseAdmin
        .from('users')
        .select('phone')
        .eq('role', 'EMPLOYEE')
        .eq('is_active', true);

      if (employees && employees.length > 0) {
        for (const employee of employees) {
          if (employee.phone) {
            const employeeMessage = `🆕 New ${role} Registration Request\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone || 'Not provided'}\n🏙️ City: ${city || 'Not provided'}\n\n⏳ Pending admin approval\n\n📋 Please check admin dashboard for details.`;
            await sendWhatsAppMessage(employee.phone, employeeMessage);
          }
        }
      }

      console.log('✅ Approval request notifications sent successfully');
    } catch (notificationError) {
      console.error('❌ Error sending approval request notifications:', notificationError);
      // Don't fail registration if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Registration request submitted successfully. Please wait for admin approval.',
      registration: {
        id: pendingRegistration.id,
        name: pendingRegistration.name,
        email: pendingRegistration.email,
        status: pendingRegistration.status,
        created_at: pendingRegistration.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
