import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET /api/admin/data-stats - Get database statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Get counts for various tables
    const stats = {
      applications: 0,
      notifications: 0,
      queries: 0,
      transactions: 0,
      login_advertisements: 0,
      advertisements: 0,
      documents: 0
    };

    // Count applications
    const { count: applicationsCount } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true });
    stats.applications = applicationsCount || 0;

    // Count notifications
    const { count: notificationsCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });
    stats.notifications = notificationsCount || 0;

    // Count queries
    const { count: queriesCount } = await supabaseAdmin
      .from('queries')
      .select('*', { count: 'exact', head: true });
    stats.queries = queriesCount || 0;

    // Count transactions
    const { count: transactionsCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    stats.transactions = transactionsCount || 0;

    // Count login advertisements
    const { count: loginAdsCount } = await supabaseAdmin
      .from('login_advertisements')
      .select('*', { count: 'exact', head: true });
    stats.login_advertisements = loginAdsCount || 0;

    // Count advertisements
    const { count: adsCount } = await supabaseAdmin
      .from('advertisements')
      .select('*', { count: 'exact', head: true });
    stats.advertisements = adsCount || 0;

    // Estimate documents (from applications)
    const { data: applicationsWithDocs } = await supabaseAdmin
      .from('applications')
      .select('documents');
    
    let documentsCount = 0;
    if (applicationsWithDocs) {
      documentsCount = applicationsWithDocs.reduce((total, app) => {
        return total + (app.documents ? app.documents.length : 0);
      }, 0);
    }
    stats.documents = documentsCount;

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching data stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
