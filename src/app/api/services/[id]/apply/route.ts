import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// POST - Apply for a service (Retailer only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceId = params.id;
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      form_data,
      documents,
      retailer_id
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone) {
      return NextResponse.json({
        error: 'Customer name and phone are required'
      }, { status: 400 });
    }

    // Validate phone number
    if (!/^[0-9]{10}$/.test(customer_phone)) {
      return NextResponse.json({
        error: 'Invalid mobile number. Must be 10 digits.'
      }, { status: 400 });
    }

    // Get service details from schemes table (both government and other services)
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({
        error: 'Service not found'
      }, { status: 404 });
    }

    // Check if service is active
    if (!service.is_active) {
      return NextResponse.json({
        error: 'This service is currently not available'
      }, { status: 400 });
    }

    // Use retailer_id from request or session user id
    const userId = retailer_id || session.user.id;

    // Get retailer's wallet for payment processing
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({
        error: 'Wallet not found. Please contact support.'
      }, { status: 404 });
    }

    const servicePrice = service.is_free ? 0 : parseFloat(service.price);

    // Check wallet balance if service is not free (but don't deduct yet - deduction happens after approval)
    if (!service.is_free && wallet.balance < servicePrice) {
      return NextResponse.json({
        error: `Insufficient wallet balance. Required: ₹${servicePrice}, Available: ₹${wallet.balance}`
      }, { status: 400 });
    }

    // Create application record similar to Aadhaar verification
    const applicationData = {
      user_id: userId,
      scheme_id: serviceId,
      form_data: {
        service_name: service.name,
        service_type: service.category || 'government_service',
        service_category: service.category,
        processing_time: service.processing_time_days,
        commission_rate: service.commission_rate,
        ...form_data
      },
      documents: documents || [],
      status: 'PENDING',
      amount: servicePrice,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      customer_address,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating application with data:', applicationData);

    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert(applicationData)
      .select(`
        id,
        form_data,
        documents,
        status,
        amount,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        created_at,
        schemes (
          id,
          name,
          description,
          price,
          category
        )
      `)
      .single();

    if (applicationError) {
      console.error('Error creating application:', applicationError);
      console.error('Application data that failed:', applicationData);
      return NextResponse.json({
        error: 'Failed to create application',
        details: applicationError.message
      }, { status: 500 });
    }

    console.log('Application created successfully:', application.id);

    // Note: Payment processing will happen after admin approval
    // Wallet deduction is moved to the approval process

    // Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'SCHEME_PAYMENT',
        amount: servicePrice,
        status: 'COMPLETED',
        description: `Payment for ${service.name}`,
        reference: application.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `${service.name} application submitted successfully`,
      application_id: application.id,
      amount_charged: servicePrice,
      status: 'PENDING'
    });

  } catch (error) {
    console.error('Error processing service application:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
