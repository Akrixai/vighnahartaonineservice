import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/schemes/[id] - Get scheme details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const schemeId = resolvedParams.id;

    const { data: scheme, error } = await supabaseAdmin
      .from('schemes')
      .select(`
        id,
        name,
        description,
        price,
        category,
        is_free,
        is_active,
        processing_time_days,
        commission_rate,
        dynamic_fields,
        image_url,
        external_url,
        created_at,
        updated_at
      `)
      .eq('id', schemeId)
      .eq('is_active', true)
      .single();

    if (error || !scheme) {
      console.error('Error fetching scheme:', error);
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scheme
    });

  } catch (error) {
    console.error('Error in schemes GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
