'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertCircle, Info, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface ScreenNotificationsProps {
  className?: string;
}

export default function ScreenNotifications({ className = '' }: ScreenNotificationsProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'APPLICATION_APPROVED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'APPLICATION_REJECTED':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'REFUND_SUBMITTED':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'REFUND_APPROVED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'REFUND_REJECTED':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'SCHEME_ADDED':
        return <Bell className="w-6 h-6 text-purple-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return 'border-blue-200 bg-blue-50';
      case 'APPLICATION_APPROVED':
        return 'border-green-200 bg-green-50';
      case 'APPLICATION_REJECTED':
        return 'border-red-200 bg-red-50';
      case 'REFUND_SUBMITTED':
        return 'border-yellow-200 bg-yellow-50';
      case 'REFUND_APPROVED':
        return 'border-green-200 bg-green-50';
      case 'REFUND_REJECTED':
        return 'border-red-200 bg-red-50';
      case 'SCHEME_ADDED':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleNotificationAction = async (notification: Notification, action: 'dismiss' | 'mark_read') => {
    if (action === 'dismiss') {
      setCurrentNotification(null);
      // Show next notification if any
      const nextNotification = notifications.find(n => n.id !== notification.id && !n.is_read);
      if (nextNotification) {
        setTimeout(() => setCurrentNotification(nextNotification), 500);
      }
    } else if (action === 'mark_read') {
      try {
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_ids: [notification.id]
          })
        });

        if (response.ok) {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          setCurrentNotification(null);
          
          // Show next notification if any
          const nextNotification = notifications.find(n => n.id !== notification.id && !n.is_read);
          if (nextNotification) {
            setTimeout(() => setCurrentNotification(nextNotification), 500);
          }
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  useEffect(() => {
    if (!session?.user?.id || !session?.user?.role) return;

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('screen-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('New notification received:', payload);
        const newNotification = payload.new as Notification;
        
        // Check if this notification is for the current user
        const isForUser =
          (newNotification.target_roles && newNotification.target_roles.includes(session.user.role)) ||
          (newNotification.target_users && newNotification.target_users.includes(session.user.id));

        if (isForUser) {
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show popup if no current notification is showing
          if (!currentNotification) {
            setCurrentNotification(newNotification);
          }
          
          // Also show toast for immediate feedback
          showToast.info(newNotification.title, {
            description: newNotification.message
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, session?.user?.role, currentNotification]);

  if (!currentNotification) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 400, scale: 0.8 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.4 
        }}
        className={`fixed top-4 right-4 z-50 ${className}`}
      >
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
            
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {currentNotification.message}
            </p>
            
            {/* Additional data display */}
            {currentNotification.data && Object.keys(currentNotification.data).length > 0 && (
              <div className="mb-3 p-2 bg-white/50 rounded border text-xs">
                {currentNotification.data.scheme_name && (
                  <p className="text-gray-600"><strong>Service:</strong> {currentNotification.data.scheme_name}</p>
                )}
                {currentNotification.data.customer_name && (
                  <p className="text-gray-600"><strong>Customer:</strong> {currentNotification.data.customer_name}</p>
                )}
                {currentNotification.data.amount && (
                  <p className="text-gray-600"><strong>Amount:</strong> ₹{currentNotification.data.amount}</p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{new Date(currentNotification.created_at).toLocaleString()}</span>
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>System</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handleNotificationAction(currentNotification, 'mark_read')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2"
              >
                Mark as Read
              </Button>
              <Button
                onClick={() => handleNotificationAction(currentNotification, 'dismiss')}
                variant="outline"
                className="flex-1 text-xs py-2"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
