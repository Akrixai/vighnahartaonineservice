import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      full_name,
      father_name,
      mother_name,
      date_of_birth,
      gender,
      mobile_number,
      email,
      address,
      city,
      state,
      pincode,
      aadhaar_number,
      service_type,
      purpose,
      remarks,
      documents,
      retailer_id
    } = await request.json();

    // Validate required fields
    if (!full_name || !father_name || !date_of_birth || !gender || !mobile_number || !address || !city || !state || !pincode || !service_type) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate mobile number
    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return NextResponse.json({ 
        error: 'Invalid mobile number. Must be 10 digits.' 
      }, { status: 400 });
    }

    // Validate PIN code
    if (!/^[0-9]{6}$/.test(pincode)) {
      return NextResponse.json({ 
        error: 'Invalid PIN code. Must be 6 digits.' 
      }, { status: 400 });
    }

    // Validate Aadhaar number for update/linking services
    if (service_type !== 'new_aadhaar' && (!aadhaar_number || !/^[0-9]{12}$/.test(aadhaar_number))) {
      return NextResponse.json({ 
        error: 'Invalid Aadhaar number. Must be 12 digits for update/linking services.' 
      }, { status: 400 });
    }

    // Validate documents
    if (!documents || documents.length === 0) {
      return NextResponse.json({ 
        error: 'At least one document must be uploaded' 
      }, { status: 400 });
    }

    // Determine service price based on type
    let servicePrice = 0;
    let serviceName = '';
    
    switch (service_type) {
      case 'new_aadhaar':
        servicePrice = 0; // Free for new Aadhaar
        serviceName = 'New Aadhaar Card Application';
        break;
      case 'update_aadhaar':
        servicePrice = 50; // ₹50 for updates
        serviceName = 'Aadhaar Update Service';
        break;
      case 'mobile_linking':
        servicePrice = 25; // ₹25 for mobile linking
        serviceName = 'Aadhaar Mobile Linking';
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid service type' 
        }, { status: 400 });
    }

    // Get or create Aadhaar scheme
    const { data: aadhaarScheme, error: schemeError } = await supabaseAdmin
      .from('schemes')
      .select('id')
      .eq('name', 'Aadhaar Card Application')
      .eq('is_active', true)
      .single();

    if (schemeError || !aadhaarScheme) {
      // Create a generic Aadhaar scheme if it doesn't exist
      const { data: newScheme, error: createSchemeError } = await supabaseAdmin
        .from('schemes')
        .insert({
          name: 'Aadhaar Card Application',
          description: 'Aadhaar card application and update services',
          price: 0,
          is_free: true,
          category: 'Identity Documents',
          documents: ['photo', 'address_proof', 'identity_proof'],
          processing_time_days: 15,
          commission_rate: 0
        })
        .select('id')
        .single();

      if (createSchemeError) {
        console.error('Error creating Aadhaar scheme:', createSchemeError);
        return NextResponse.json({
          error: 'Failed to create service scheme'
        }, { status: 500 });
      }
      aadhaarScheme = newScheme;
    }

    // Create application record
    const applicationData = {
      user_id: retailer_id,
      scheme_id: aadhaarScheme.id,
      form_data: {
        service_name: serviceName,
        service_type: 'aadhaar_verification',
        aadhaar_service_type: service_type,
        full_name,
        father_name,
        mother_name,
        date_of_birth,
        gender,
        mobile_number,
        email,
        address,
        city,
        state,
        pincode,
        aadhaar_number,
        purpose,
        remarks
      },
      documents,
      status: 'PENDING',
      amount: servicePrice,
      customer_name: full_name,
      customer_phone: mobile_number,
      customer_email: email || null,
      customer_address: `${address}, ${city}, ${state} - ${pincode}`
    };

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ 
        error: 'Failed to create application' 
      }, { status: 500 });
    }

    // If there's a service fee, deduct from wallet
    if (servicePrice > 0) {
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', retailer_id)
        .single();

      if (walletError || !wallet) {
        // Rollback application creation
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', application.id);
        
        return NextResponse.json({ 
          error: 'Wallet not found' 
        }, { status: 400 });
      }

      if (wallet.balance < servicePrice) {
        // Rollback application creation
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', application.id);
        
        return NextResponse.json({ 
          error: 'Insufficient wallet balance' 
        }, { status: 400 });
      }

      // Deduct amount from wallet
      const { error: updateWalletError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: wallet.balance - servicePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateWalletError) {
        console.error('Error updating wallet:', updateWalletError);
        // Rollback application creation
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', application.id);
        
        return NextResponse.json({ 
          error: 'Failed to process payment' 
        }, { status: 500 });
      }

      // Create transaction record
      await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: retailer_id,
          wallet_id: wallet.id,
          type: 'SCHEME_PAYMENT',
          amount: servicePrice,
          status: 'COMPLETED',
          description: `Payment for ${serviceName}`,
          reference: application.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      message: 'Aadhaar verification application submitted successfully',
      application_id: application.id,
      amount_charged: servicePrice
    });

  } catch (error) {
    console.error('Error processing Aadhaar verification application:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
