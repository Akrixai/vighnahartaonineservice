import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Fetch free services for employees (includes external URL services)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.EMPLOYEE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For employees, show both free services and external URL services
    const { data: freeServices, error } = await supabaseAdmin
      .from('schemes')
      .select('id, name, description, category, external_url, is_active, created_at, updated_at')
      .eq('is_active', true)
      .or('is_free.eq.true,external_url.not.is.null') // Free services OR services with external URL
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching free services:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch free services' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      freeServices: freeServices || []
    });

  } catch (error) {
    console.error('Error in GET /api/employee/free-services:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
