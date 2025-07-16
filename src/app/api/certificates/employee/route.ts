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

    const { employee_name, employee_id, department } = await request.json();

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
          certificate_number: existingCert.certificate_number,
          issue_date: new Date(existingCert.issue_date).toLocaleDateString('en-GB'),
          company_name: 'Vignaharta Janseva',
          digital_signature: existingCert.digital_signature
        }
      });
    }

    // Generate unique certificate number with VJS-EMP prefix
    const year = employeeCreationDate.getFullYear();
    
    // Generate unique sequence number
    const { data: lastCert } = await supabaseAdmin
      .from('employee_certificates')
      .select('certificate_number')
      .like('certificate_number', `VJS-EMP-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sequenceNumber = 1;
    if (lastCert) {
      const lastSequence = parseInt(lastCert.certificate_number.split('-')[3]) || 0;
      sequenceNumber = lastSequence + 1;
    }

    const certificateNumber = `VJS-EMP-${year}-${String(sequenceNumber).padStart(5, '0')}`;

    // Generate digital signature (unique hash)
    const digitalSignature = `VJS-EMP-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Create certificate record
    const certificateData = {
      user_id: session.user.id,
      employee_name: employee_name,
      employee_id: employee_id || null,
      department: department || null,
      certificate_number: certificateNumber,
      issue_date: issueDate, // Use employee creation date
      company_name: 'Vignaharta Janseva',
      digital_signature: digitalSignature,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: certificate, error: createError } = await supabaseAdmin
      .from('employee_certificates')
      .insert(certificateData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating employee certificate:', createError);
      return NextResponse.json({ 
        error: 'Failed to create certificate' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        employee_name: certificate.employee_name,
        employee_id: certificate.employee_id,
        department: certificate.department,
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
