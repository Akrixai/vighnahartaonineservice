import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch active free services for retailers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For retailers, only show free services without external URLs
    // External URL services are only visible to admins and employees
    const { data: freeServices, error } = await supabaseAdmin
      .from('schemes')
      .select('id, name, description, category, external_url, is_active, created_at, updated_at')
      .eq('is_active', true)
      .eq('is_free', true) // Only free services
      .is('external_url', null) // Exclude services with external URLs
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
    console.error('Error in GET /api/free-services:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
