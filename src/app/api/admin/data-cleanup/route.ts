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
        // Delete applications with status APPROVED or REJECTED and their related data
        const appDays = Math.max(customDays || 180, 1); // Default 6 months, minimum 1 day
        const appCutoff = getCutoffDate(appDays);

        // Get old application IDs
        const { data: oldAppIds } = await supabaseAdmin
              .from('applications')
              .select('id')
              .lt('created_at', appCutoff)
          .in('status', ['APPROVED', 'REJECTED']);
        const appIds = oldAppIds?.map(app => app.id) || [];

        if (appIds.length > 0) {
          // Delete related transactions
          await supabaseAdmin
            .from('transactions')
            .delete()
            .in('reference', appIds.map(id => `APP_${id}`));

          // Delete related documents
          await supabaseAdmin
            .from('documents')
            .delete()
            .in('application_id', appIds);

          // Delete related notifications
          await supabaseAdmin
            .from('notifications')
            .delete()
            .contains('data', { application_id: appIds });
        }

        // Then delete the applications
        const { data: oldApps, error: deleteAppsError } = await supabaseAdmin
          .from('applications')
          .delete()
          .in('id', appIds)
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

      case 'old-documents':
        // Delete old document records AND the actual files from storage
        const documentDays = Math.max(customDays || 90, 1); // Default 3 months, minimum 1 day
        const documentCutoff = getCutoffDate(documentDays);

        // First get the documents with their file URLs
        const { data: documentsToDelete, error: fetchDocumentsError } = await supabaseAdmin
          .from('documents')
          .select('id, file_url')
          .lt('created_at', documentCutoff);

        if (fetchDocumentsError) {
          throw new Error(`Failed to fetch old documents: ${fetchDocumentsError.message}`);
        }

        const documentIds = documentsToDelete?.map(doc => doc.id) || [];

        if (documentIds.length > 0) {
          // Delete files from storage bucket
          for (const document of documentsToDelete || []) {
            if (document.file_url) {
              try {
                // Extract file path from URL
                const url = new URL(document.file_url);
                const pathParts = url.pathname.split('/');
                const filePath = pathParts.slice(-2).join('/'); // Get folder/filename

                // Delete from storage
                const { error: storageError } = await supabaseAdmin.storage
                  .from('documents')
                  .remove([filePath]);

                if (storageError) {
                  console.error(`Failed to delete file ${filePath} from storage:`, storageError);
                }
              } catch (urlError) {
                console.error(`Invalid file URL for document ${document.id}:`, urlError);
              }
            }
          }

          // Delete document records from database
          const { data: oldDocuments, error: deleteDocumentsError } = await supabaseAdmin
            .from('documents')
            .delete()
            .in('id', documentIds)
            .select('id');

          if (deleteDocumentsError) {
            throw new Error(`Failed to delete old documents: ${deleteDocumentsError.message}`);
          }

          deletedCount = oldDocuments?.length || 0;
        }

        spaceFreed = `~${Math.round(deletedCount * 2)}MB`;
        break;

      case 'service-receipts':
        // Delete old service receipts
        const serviceReceiptDays = Math.max(customDays || 180, 1); // Default 6 months, minimum 1 day
        const serviceReceiptCutoff = getCutoffDate(serviceReceiptDays);

        const { data: oldServiceReceipts, error: deleteServiceReceiptsError } = await supabaseAdmin
          .from('receipts')
          .delete()
          .lt('created_at', serviceReceiptCutoff)
          .select('id');

        if (deleteServiceReceiptsError) {
          throw new Error(`Failed to delete old service receipts: ${deleteServiceReceiptsError.message}`);
        }

        deletedCount = oldServiceReceipts?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.5)}MB`;
        break;

      case 'order-receipts':
        // Delete old order records (which serve as order receipts)
        const orderReceiptDays = Math.max(customDays || 180, 1); // Default 6 months, minimum 1 day
        const orderReceiptCutoff = getCutoffDate(orderReceiptDays);

        // Only delete completed or cancelled orders to preserve active orders
        const { data: oldOrders, error: deleteOrdersError } = await supabaseAdmin
          .from('orders')
          .delete()
          .lt('created_at', orderReceiptCutoff)
          .in('status', ['DELIVERED', 'CANCELLED'])
          .select('id');

        if (deleteOrdersError) {
          throw new Error(`Failed to delete old order receipts: ${deleteOrdersError.message}`);
        }

        deletedCount = oldOrders?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 0.3)}MB`;
        break;

      case 'inactive-users':
        // Delete inactive users (not logged in for specified days) - ADMIN only
        const userDays = Math.max(customDays || 365, 30); // Default 1 year, minimum 30 days
        const userCutoff = getCutoffDate(userDays);

        // Only delete RETAILER users who haven't been active
        const { data: inactiveUsers, error: deleteUsersError } = await supabaseAdmin
          .from('users')
          .select('id')
          .lt('updated_at', userCutoff)
          .eq('role', 'RETAILER')
          .eq('is_active', false);
        const userIds = inactiveUsers?.map(u => u.id) || [];

        if (userIds.length > 0) {
          // Delete user applications and cascade related data
          const { data: userApps } = await supabaseAdmin
            .from('applications')
            .select('id')
            .in('user_id', userIds);
          const userAppIds = userApps?.map(app => app.id) || [];

          if (userAppIds.length > 0) {
            // Delete related transactions
            await supabaseAdmin
              .from('transactions')
              .delete()
              .in('reference', userAppIds.map(id => `APP_${id}`));

            // Delete related documents
            await supabaseAdmin
              .from('documents')
              .delete()
              .in('application_id', userAppIds);

            // Delete related notifications
            await supabaseAdmin
              .from('notifications')
              .delete()
              .contains('data', { application_id: userAppIds });
          }

          // Delete applications
          await supabaseAdmin
            .from('applications')
            .delete()
            .in('id', userAppIds);

          // Delete wallets
          await supabaseAdmin
            .from('wallets')
            .delete()
            .in('user_id', userIds);

          // Delete transactions
          await supabaseAdmin
            .from('transactions')
            .delete()
            .in('user_id', userIds);

          // Delete documents
          await supabaseAdmin
            .from('documents')
            .delete()
            .in('user_id', userIds);

          // Delete notifications
          await supabaseAdmin
            .from('notifications')
            .delete()
            .contains('data', { user_id: userIds });
        }

        // Delete users
        const { data: deletedUsers, error: deleteUsersFinalError } = await supabaseAdmin
          .from('users')
          .delete()
          .in('id', userIds)
          .select('id');

        if (deleteUsersFinalError) {
          throw new Error(`Failed to delete inactive users: ${deleteUsersFinalError.message}`);
        }

        deletedCount = deletedUsers?.length || 0;
        spaceFreed = `~${Math.round(deletedCount * 1)}MB`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Log the cleanup action for audit purposes
    if (process.env.NODE_ENV === 'development') {
      console.log(`Admin ${session.user.id} performed data cleanup: ${taskId}, deleted ${deletedCount} records`);
    }

    return NextResponse.json({
      success: true,
      taskId,
      deletedCount,
      spaceFreed,
      message: `Successfully cleaned up ${deletedCount} records`
    });

  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error during data cleanup:', error);
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
