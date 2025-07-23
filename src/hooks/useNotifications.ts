'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import { showPopupNotification } from '@/components/NotificationManager';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  data: any;
  target_roles: string[];
  target_users: string[];
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to map notification types
const getNotificationType = (type: string): 'success' | 'error' | 'info' | 'warning' => {
  switch (type) {
    case 'APPLICATION_APPROVED':
    case 'PAYMENT_RECEIVED':
      return 'success';
    case 'APPLICATION_REJECTED':
      return 'error';
    case 'APPLICATION_SUBMITTED':
      return 'info';
    default:
      return 'info';
  }
};

export function useNotifications(userRole?: string, userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
        }
      }
    } catch (error) {
      // console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds?: string[], markAllRead = false) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_all_read: markAllRead
        }),
      });

      if (response.ok) {
        // Remove notifications from the list when marked as read
        if (markAllRead) {
          setNotifications([]);
          setUnreadCount(0);
          // Show toast notification
          if (typeof window !== 'undefined') {
            const { showToast } = await import('@/lib/toast');
            showToast.success('All notifications marked as read');
          }
        } else if (notificationIds) {
          setNotifications(prev =>
            prev.filter(notification => !notificationIds.includes(notification.id))
          );
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
          // Show toast notification
          if (typeof window !== 'undefined') {
            const { showToast } = await import('@/lib/toast');
            showToast.success('Notifications marked as read');
          }
        }

        // Refresh notifications to get updated list
        await fetchNotifications();
      }
    } catch (error) {
      // if (process.env.NODE_ENV === 'development') {
      //   console.error('Error marking notifications as read:', error);
      // }
    }
  };

  useEffect(() => {
    if (userRole && userId) {
      fetchNotifications();

      // Set up real-time subscription for new notifications
      // Subscribe to notifications for both role-based and user-specific notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            // Check if this notification is for the current user
            const isForUser =
              (newNotification.target_roles && newNotification.target_roles.includes(userRole)) ||
              (newNotification.target_users && newNotification.target_users.includes(userId));

            if (isForUser) {
              // Add to notifications list
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);

              // Show popup notification
              showPopupNotification({
                title: newNotification.title,
                message: newNotification.message,
                type: getNotificationType(newNotification.type),
                duration: 5000,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userRole, userId]);

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove notification from the list
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Show toast notification
        if (typeof window !== 'undefined') {
          const { showToast } = await import('@/lib/toast');
          showToast.success('Notification deleted successfully');
        }

        // Refresh notifications to get updated list
        await fetchNotifications();
      }
    } catch (error) {
      // console.error('Error deleting notification:', error);
      if (typeof window !== 'undefined') {
        const { showToast } = await import('@/lib/toast');
        showToast.error('Failed to delete notification');
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
}
