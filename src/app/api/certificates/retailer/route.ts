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

    const { retailer_name, retailer_id } = await request.json();

    if (!retailer_name || !retailer_id) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Get retailer's creation date from users table
    const { data: retailerData, error: retailerError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', retailer_id)
      .single();

    if (retailerError || !retailerData) {
      return NextResponse.json({
        error: 'Retailer data not found'
      }, { status: 404 });
    }

    // Use retailer's creation date as issue date
    const retailerCreationDate = new Date(retailerData.created_at);
    const issueDate = retailerCreationDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if certificate already exists for this retailer
    const { data: existingCert, error: checkError } = await supabaseAdmin
      .from('retailer_certificates')
      .select('*')
      .eq('user_id', retailer_id)
      .eq('is_active', true)
      .single();

    if (existingCert && !checkError) {
      // Return existing certificate
      return NextResponse.json({
        success: true,
        certificate: {
          id: existingCert.id,
          retailer_name: existingCert.retailer_name,
          certificate_number: existingCert.certificate_number,
          issue_date: new Date(existingCert.issue_date).toLocaleDateString('en-GB'),
          company_name: 'Vignaharta Janseva',
          digital_signature: existingCert.digital_signature
        }
      });
    }

    // Generate unique certificate number with VJS prefix
    const year = retailerCreationDate.getFullYear();
    
    // Generate unique sequence number
    const { data: lastCert } = await supabaseAdmin
      .from('retailer_certificates')
      .select('certificate_number')
      .like('certificate_number', `VJS-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sequenceNumber = 1;
    if (lastCert) {
      const lastSequence = parseInt(lastCert.certificate_number.split('-')[2]) || 0;
      sequenceNumber = lastSequence + 1;
    }

    const certificateNumber = `VJS-${year}-${String(sequenceNumber).padStart(5, '0')}`;

    // Generate digital signature (unique hash)
    const digitalSignature = `VJS-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Create certificate record
    const certificateData = {
      user_id: retailer_id,
      retailer_name: retailer_name,
      certificate_number: certificateNumber,
      issue_date: issueDate, // Use retailer creation date
      company_name: 'Vignaharta Janseva',
      digital_signature: digitalSignature,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: certificate, error: createError } = await supabaseAdmin
      .from('retailer_certificates')
      .insert(certificateData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating certificate:', createError);
      return NextResponse.json({ 
        error: 'Failed to create certificate' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        retailer_name: certificate.retailer_name,
        certificate_number: certificate.certificate_number,
        issue_date: new Date(certificate.issue_date).toLocaleDateString('en-GB'),
        company_name: certificate.company_name,
        digital_signature: certificate.digital_signature
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
