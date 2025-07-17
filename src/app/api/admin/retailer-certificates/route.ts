import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Fetch all retailer certificates for admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: certificates, error } = await supabaseAdmin
      .from('retailer_certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching retailer certificates:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch retailer certificates' 
      }, { status: 500 });
    }

    // Format the certificates for display
    const formattedCertificates = certificates?.map(cert => ({
      id: cert.id,
      user_id: cert.user_id,
      retailer_name: cert.retailer_name,
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
    console.error('Error in GET /api/admin/retailer-certificates:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Create or update retailer certificate status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { certificateId, action } = await request.json();

    if (!certificateId || !action) {
      return NextResponse.json({ 
        error: 'Certificate ID and action are required' 
      }, { status: 400 });
    }

    if (action === 'deactivate') {
      const { error } = await supabaseAdmin
        .from('retailer_certificates')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) {
        console.error('Error deactivating certificate:', error);
        return NextResponse.json({ 
          error: 'Failed to deactivate certificate' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Certificate deactivated successfully'
      });
    }

    if (action === 'activate') {
      const { error } = await supabaseAdmin
        .from('retailer_certificates')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) {
        console.error('Error activating certificate:', error);
        return NextResponse.json({ 
          error: 'Failed to activate certificate' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Certificate activated successfully'
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/admin/retailer-certificates:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete a retailer certificate
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('id');

    if (!certificateId) {
      return NextResponse.json({ 
        error: 'Certificate ID is required' 
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('retailer_certificates')
      .delete()
      .eq('id', certificateId);

    if (error) {
      console.error('Error deleting retailer certificate:', error);
      return NextResponse.json({ 
        error: 'Failed to delete certificate' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/retailer-certificates:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
