import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch all employee certificates (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: certificates, error } = await supabaseAdmin
      .from('employee_certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employee certificates:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch employee certificates' 
      }, { status: 500 });
    }

    // Format the certificates for display
    const formattedCertificates = certificates?.map(cert => ({
      id: cert.id,
      user_id: cert.user_id,
      employee_name: cert.employee_name,
      employee_id: cert.employee_id,
      department: cert.department,
      branch: cert.branch,
      certificate_number: cert.certificate_number,
      issue_date: new Date(cert.issue_date).toLocaleDateString('en-GB'),
      company_name: cert.company_name,
      digital_signature: cert.digital_signature,
      is_active: cert.is_active,
      created_at: cert.created_at,
      updated_at: cert.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      certificates: formattedCertificates
    });

  } catch (error) {
    console.error('Error in GET /api/admin/employee-certificates:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
