import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// POST /api/admin/data-cleanup - Perform data cleanup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    let deletedCount = 0;
    let spaceFreed = '0MB';

    switch (taskId) {
      case 'old-applications':
        // Delete applications older than 6 months with status REJECTED or COMPLETED
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: oldApps, error: deleteAppsError } = await supabaseAdmin
          .from('applications')
          .delete()
          .lt('created_at', sixMonthsAgo.toISOString())
          .in('status', ['REJECTED', 'COMPLETED'])
          .select('id');

        if (deleteAppsError) {
          throw new Error(`Failed to delete old applications: ${deleteAppsError.message}`);
        }
        
        deletedCount = oldApps?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.5)}MB`;
        break;

      case 'notifications':
        // Delete notifications older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: oldNotifications, error: deleteNotificationsError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())
          .select('id');

        if (deleteNotificationsError) {
          throw new Error(`Failed to delete old notifications: ${deleteNotificationsError.message}`);
        }
        
        deletedCount = oldNotifications?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.01)}MB`;
        break;

      case 'resolved-queries':
        // Delete resolved queries older than 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const { data: oldQueries, error: deleteQueriesError } = await supabaseAdmin
          .from('queries')
          .delete()
          .lt('created_at', threeMonthsAgo.toISOString())
          .in('status', ['RESOLVED', 'CLOSED'])
          .select('id');

        if (deleteQueriesError) {
          throw new Error(`Failed to delete resolved queries: ${deleteQueriesError.message}`);
        }
        
        deletedCount = oldQueries?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.02)}MB`;
        break;

      case 'old-transactions':
        // Archive (soft delete) transaction logs older than 1 year
        // We don't actually delete financial records, just mark them as archived
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const { data: oldTransactions, error: archiveTransactionsError } = await supabaseAdmin
          .from('transactions')
          .update({ metadata: { archived: true, archived_at: new Date().toISOString() } })
          .lt('created_at', oneYearAgo.toISOString())
          .is('metadata->archived', null)
          .select('id');

        if (archiveTransactionsError) {
          throw new Error(`Failed to archive old transactions: ${archiveTransactionsError.message}`);
        }
        
        deletedCount = oldTransactions?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.1)}MB`;
        break;

      case 'expired-ads':
        // Delete expired and inactive advertisements
        const today = new Date().toISOString().split('T')[0];
        
        const { data: expiredAds, error: deleteAdsError } = await supabaseAdmin
          .from('advertisements')
          .delete()
          .lt('end_date', today)
          .eq('is_active', false)
          .select('id');

        if (deleteAdsError) {
          throw new Error(`Failed to delete expired advertisements: ${deleteAdsError.message}`);
        }
        
        // Also delete expired login advertisements
        const { data: expiredLoginAds, error: deleteLoginAdsError } = await supabaseAdmin
          .from('login_advertisements')
          .delete()
          .lt('end_date', today)
          .eq('is_active', false)
          .select('id');

        if (deleteLoginAdsError) {
          throw new Error(`Failed to delete expired login advertisements: ${deleteLoginAdsError.message}`);
        }
        
        deletedCount = (expiredAds?.length || 0) + (expiredLoginAds?.length || 0);
        spaceFreed = `~${Math.round(deletedCount * 2)}MB`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Log the cleanup action
    console.log(`Admin ${session.user.id} performed data cleanup: ${taskId}, deleted ${deletedCount} records`);

    return NextResponse.json({
      success: true,
      taskId,
      deletedCount,
      spaceFreed,
      message: `Successfully cleaned up ${deletedCount} records`
    });

  } catch (error) {
    console.error('Error during data cleanup:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
