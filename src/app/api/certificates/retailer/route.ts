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

    // Get retailer's creation date and location from users table
    const { data: retailerData, error: retailerError } = await supabaseAdmin
      .from('users')
      .select('created_at, city, state, address')
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

    // Use city as branch, fallback to state if city not available
    const branch = retailerData.city || retailerData.state || 'Main Branch';

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
          branch: existingCert.branch,
          certificate_number: existingCert.certificate_number,
          issue_date: new Date(existingCert.issue_date).toLocaleDateString('en-GB'),
          company_name: 'Vignaharta Janseva',
          digital_signature: existingCert.digital_signature
        }
      });
    }

    // Generate unique certificate number with VJS prefix
    const year = retailerCreationDate.getFullYear();

    // Generate unique certificate number with retry mechanism
    let certificateNumber = '';
    let certificate = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!certificate && attempts < maxAttempts) {
      attempts++;

      // Generate unique sequence number by getting all certificates for the year
      const { data: existingCerts } = await supabaseAdmin
        .from('retailer_certificates')
        .select('certificate_number')
        .like('certificate_number', `VJS-${year}-%`)
        .order('certificate_number', { ascending: false });

      let sequenceNumber = 1;
      if (existingCerts && existingCerts.length > 0) {
        // Extract all sequence numbers and find the highest one
        const sequenceNumbers = existingCerts
          .map(cert => {
            const parts = cert.certificate_number.split('-');
            return parseInt(parts[2]) || 0;
          })
          .filter(num => !isNaN(num));

        if (sequenceNumbers.length > 0) {
          sequenceNumber = Math.max(...sequenceNumbers) + 1;
        }
      }

      // Add timestamp component to ensure uniqueness in concurrent requests
      const timestamp = Date.now().toString().slice(-4);
      certificateNumber = `VJS-${year}-${String(sequenceNumber).padStart(5, '0')}`;

      // Generate digital signature (unique hash)
      const digitalSignature = `VJS-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Create certificate record
      const certificateData = {
        user_id: retailer_id,
        retailer_name: retailer_name,
        branch: branch, // Use city from user registration
        certificate_number: certificateNumber,
        issue_date: issueDate, // Use retailer creation date
        company_name: 'Vignaharta Janseva',
        digital_signature: digitalSignature,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const { data: insertedCert, error: createError } = await supabaseAdmin
          .from('retailer_certificates')
          .insert(certificateData)
          .select()
          .single();

        if (createError) {
          // If it's a duplicate key error, try again with a different number
          if (createError.code === '23505' && createError.message.includes('certificate_number')) {
            console.log(`Certificate number ${certificateNumber} already exists, retrying... (attempt ${attempts})`);
            // Add small delay to avoid rapid retries
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          } else {
            throw createError;
          }
        }

        certificate = insertedCert;
      } catch (error) {
        if (attempts >= maxAttempts) {
          console.error('Error creating retailer certificate after max attempts:', error);
          return NextResponse.json({
            error: 'Failed to create certificate after multiple attempts'
          }, { status: 500 });
        }
      }
    }

    if (!certificate) {
      return NextResponse.json({
        error: 'Failed to generate unique certificate number'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        retailer_name: certificate.retailer_name,
        branch: certificate.branch,
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
