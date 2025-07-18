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
      console.error('Error fetching notifications:', error);
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
        // Update local state
        setNotifications(prev => 
          prev.map(notification => {
            if (markAllRead || (notificationIds && notificationIds.includes(notification.id))) {
              return { ...notification, is_read: true };
            }
            return notification;
          })
        );
        setUnreadCount(prev => markAllRead ? 0 : Math.max(0, prev - (notificationIds?.length || 0)));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    if (userRole && userId) {
      fetchNotifications();

      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `target_roles.cs.{${userRole}}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            
            // Add to notifications list
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show popup notification instead of toast
            showPopupNotification({
              title: newNotification.title,
              message: newNotification.message,
              type: getNotificationType(newNotification.type),
              duration: 5000,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userRole, userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refresh: fetchNotifications
  };
}
