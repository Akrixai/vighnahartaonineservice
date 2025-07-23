'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, CheckCircle, AlertCircle, Info, Clock, User, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'APPLICATION_SUBMITTED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'REFUND_SUBMITTED' | 'REFUND_APPROVED' | 'REFUND_REJECTED' | 'SCHEME_ADDED' | 'GENERAL';
  data?: any;
  target_roles?: string[];
  target_users?: string[];
  is_read: boolean;
  created_at: string;
  created_by?: string;
}

interface PopupNotificationsProps {
  className?: string;
}

export default function PopupNotifications({ className = '' }: PopupNotificationsProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  // Fetch notifications - optimized for free tier
  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/notifications?unread_only=true&limit=5');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);

        // Show popup for new notifications
        if (data.length > 0 && !currentNotification) {
          setCurrentNotification(data[0]);
          setShowPopup(true);
        }
      }
    } catch (error) {
      // Reduced error logging for production
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
      }
    } catch (error) {
      // All console.log and console.error statements removed
    }
  };

  // Handle notification action
  const handleNotificationAction = async (notification: Notification, action: 'read' | 'dismiss') => {
    if (action === 'read' || action === 'dismiss') {
      await markAsRead(notification.id);
    }
    
    // Close current popup and show next if available
    setShowPopup(false);
    setCurrentNotification(null);
    
    // Show next notification after a delay
    setTimeout(() => {
      const remainingNotifications = notifications.filter(n => n.id !== notification.id);
      if (remainingNotifications.length > 0) {
        setCurrentNotification(remainingNotifications[0]);
        setShowPopup(true);
      }
    }, 500);
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'APPLICATION_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'APPLICATION_REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'REFUND_SUBMITTED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'REFUND_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REFUND_REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'SCHEME_ADDED':
        return <Bell className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPLICATION_APPROVED':
      case 'REFUND_APPROVED':
        return 'border-green-200 bg-green-50';
      case 'APPLICATION_REJECTED':
      case 'REFUND_REJECTED':
        return 'border-red-200 bg-red-50';
      case 'APPLICATION_SUBMITTED':
      case 'REFUND_SUBMITTED':
        return 'border-yellow-200 bg-yellow-50';
      case 'SCHEME_ADDED':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('popup-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `target_roles.cs.{${session.user.role}},target_users.cs.{${session.user.id}}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        
        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show popup if no current notification is showing
        if (!showPopup) {
          setCurrentNotification(newNotification);
          setShowPopup(true);
        }
        
        // Also show toast for immediate feedback
        showToast.info(newNotification.title, {
          description: newNotification.message
        });
      })
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, session?.user?.role, showPopup]);

  // Auto-refresh notifications every 60 seconds - reduced for free tier
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (!showPopup || !currentNotification) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300 ${className}`}>
      <Card className={`w-96 shadow-2xl border-2 ${getNotificationColor(currentNotification.type)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getNotificationIcon(currentNotification.type)}
              <h3 className="font-semibold text-gray-900 text-sm">
                {currentNotification.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNotificationAction(currentNotification, 'dismiss')}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            {currentNotification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(currentNotification.created_at).toLocaleString()}
            </span>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNotificationAction(currentNotification, 'dismiss')}
                className="text-xs"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleNotificationAction(currentNotification, 'read')}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                Mark as Read
              </Button>
            </div>
          </div>
          
          {notifications.length > 1 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {notifications.length - 1} more notification{notifications.length > 2 ? 's' : ''} pending
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
