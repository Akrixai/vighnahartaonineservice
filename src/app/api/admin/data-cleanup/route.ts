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

    const { taskId, customDays } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Ensure minimum 1 day for data retention
    if (customDays && customDays < 1) {
      return NextResponse.json({ error: 'Minimum deletion period is 1 day' }, { status: 400 });
    }

    let deletedCount = 0;
    let spaceFreed = '0MB';

    // Calculate cutoff date based on custom days or defaults
    const getCutoffDate = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return cutoff.toISOString();
    };

    switch (taskId) {
      case 'old-applications':
        // Delete applications with status REJECTED or COMPLETED
        const appDays = Math.max(customDays || 180, 1); // Default 6 months, minimum 1 day
        const appCutoff = getCutoffDate(appDays);

        const { data: oldApps, error: deleteAppsError } = await supabaseAdmin
          .from('applications')
          .delete()
          .lt('created_at', appCutoff)
          .in('status', ['REJECTED', 'COMPLETED'])
          .select('id');

        if (deleteAppsError) {
          throw new Error(`Failed to delete old applications: ${deleteAppsError.message}`);
        }

        deletedCount = oldApps?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.5)}MB`;
        break;

      case 'notifications':
        // Delete old notifications
        const notificationDays = Math.max(customDays || 30, 1); // Default 30 days, minimum 1 day
        const notificationCutoff = getCutoffDate(notificationDays);

        const { data: oldNotifications, error: deleteNotificationsError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .lt('created_at', notificationCutoff)
          .select('id');

        if (deleteNotificationsError) {
          throw new Error(`Failed to delete old notifications: ${deleteNotificationsError.message}`);
        }

        deletedCount = oldNotifications?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.01)}MB`;
        break;

      case 'resolved-queries':
        // Delete resolved queries
        const queryDays = Math.max(customDays || 90, 1); // Default 3 months, minimum 1 day
        const queryCutoff = getCutoffDate(queryDays);

        const { data: oldQueries, error: deleteQueriesError } = await supabaseAdmin
          .from('queries')
          .delete()
          .lt('created_at', queryCutoff)
          .in('status', ['RESOLVED', 'CLOSED'])
          .select('id');

        if (deleteQueriesError) {
          throw new Error(`Failed to delete resolved queries: ${deleteQueriesError.message}`);
        }

        deletedCount = oldQueries?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.02)}MB`;
        break;

      case 'old-transactions':
        // Delete transaction logs older than specified days
        // For financial compliance, we keep a minimum retention period
        const transactionDays = Math.max(customDays || 365, 1); // Default 1 year, minimum 1 day
        const transactionCutoff = getCutoffDate(transactionDays);

        const { data: oldTransactions, error: deleteTransactionsError } = await supabaseAdmin
          .from('transactions')
          .delete()
          .lt('created_at', transactionCutoff)
          .select('id');

        if (deleteTransactionsError) {
          throw new Error(`Failed to delete old transactions: ${deleteTransactionsError.message}`);
        }

        deletedCount = oldTransactions?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.1)}MB`;
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
