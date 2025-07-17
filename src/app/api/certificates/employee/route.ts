import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.EMPLOYEE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employee_name, employee_id, department, branch } = await request.json();

    if (!employee_name) {
      return NextResponse.json({
        error: 'Employee name is required'
      }, { status: 400 });
    }

    // Get employee's creation date from users table
    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', session.user.id)
      .single();

    if (employeeError || !employeeData) {
      return NextResponse.json({
        error: 'Employee data not found'
      }, { status: 404 });
    }

    // Use employee's creation date as issue date
    const employeeCreationDate = new Date(employeeData.created_at);
    const issueDate = employeeCreationDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if certificate already exists for this employee
    const { data: existingCert, error: checkError } = await supabaseAdmin
      .from('employee_certificates')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (existingCert && !checkError) {
      // Return existing certificate
      return NextResponse.json({
        success: true,
        certificate: {
          id: existingCert.id,
          employee_name: existingCert.employee_name,
          employee_id: existingCert.employee_id,
          department: existingCert.department,
          branch: existingCert.branch,
          certificate_number: existingCert.certificate_number,
          issue_date: new Date(existingCert.issue_date).toLocaleDateString('en-GB'),
          company_name: 'Vignaharta Janseva',
          digital_signature: existingCert.digital_signature
        }
      });
    }

    // Generate unique certificate number with VJS-EMP prefix
    const year = employeeCreationDate.getFullYear();

    // Generate unique certificate number with retry mechanism
    let certificateNumber = '';
    let certificate = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!certificate && attempts < maxAttempts) {
      attempts++;

      // Generate unique sequence number by getting all certificates for the year
      const { data: existingCerts } = await supabaseAdmin
        .from('employee_certificates')
        .select('certificate_number')
        .like('certificate_number', `VJS-EMP-${year}-%`)
        .order('certificate_number', { ascending: false });

      let sequenceNumber = 1;
      if (existingCerts && existingCerts.length > 0) {
        // Extract all sequence numbers and find the highest one
        const sequenceNumbers = existingCerts
          .map(cert => {
            const parts = cert.certificate_number.split('-');
            return parseInt(parts[3]) || 0;
          })
          .filter(num => !isNaN(num));

        if (sequenceNumbers.length > 0) {
          sequenceNumber = Math.max(...sequenceNumbers) + 1;
        }
      }

      certificateNumber = `VJS-EMP-${year}-${String(sequenceNumber).padStart(5, '0')}`;

      // Generate digital signature (unique hash)
      const digitalSignature = `VJS-EMP-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Create certificate record
      const certificateData = {
        user_id: session.user.id,
        employee_name: employee_name,
        employee_id: employee_id || null,
        department: department || null,
        branch: branch || null,
        certificate_number: certificateNumber,
        issue_date: issueDate, // Use employee creation date
        company_name: 'Vignaharta Janseva',
        digital_signature: digitalSignature,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const { data: insertedCert, error: createError } = await supabaseAdmin
          .from('employee_certificates')
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
          console.error('Error creating employee certificate after max attempts:', error);
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
        employee_name: certificate.employee_name,
        employee_id: certificate.employee_id,
        department: certificate.department,
        branch: certificate.branch,
        certificate_number: certificate.certificate_number,
        issue_date: new Date(certificate.issue_date).toLocaleDateString('en-GB'),
        company_name: certificate.company_name,
        digital_signature: certificate.digital_signature
      }
    });

  } catch (error) {
    console.error('Error generating employee certificate:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET - Fetch employee certificate
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.EMPLOYEE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing certificate
    const { data: certificate, error } = await supabaseAdmin
      .from('employee_certificates')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (error || !certificate) {
      return NextResponse.json({ 
        success: false,
        error: 'No certificate found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        employee_name: certificate.employee_name,
        employee_id: certificate.employee_id,
        department: certificate.department,
        branch: certificate.branch,
        certificate_number: certificate.certificate_number,
        issue_date: new Date(certificate.issue_date).toLocaleDateString('en-GB'),
        company_name: certificate.company_name,
        digital_signature: certificate.digital_signature
      }
    });

  } catch (error) {
    console.error('Error fetching employee certificate:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
