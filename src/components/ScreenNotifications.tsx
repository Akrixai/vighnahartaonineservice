'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [hovered, setHovered] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);
  const shownNotificationIds = useRef<Set<string>>(new Set());

  // Mark notification as read in backend
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
    } catch (err) {
      // Reduced error logging for production
    }
  };

  // Show notification only once, mark as read
  const showNotification = async (notification: Notification) => {
    if (!shownNotificationIds.current.has(notification.id)) {
      shownNotificationIds.current.add(notification.id);
      setNotifications(prev => [notification, ...prev]);
      setCurrentNotification(notification);
      showToast.info(notification.title, { description: notification.message });
      await markNotificationAsRead(notification.id);
    } else {
      // Reduced error logging for production
    }
  };

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
        // Reduced error logging for production
      }
    }
  };

  // Approve, Reject, Review handlers
  const handleApprove = async (notification: Notification) => {
    if (!notification.data?.application_id) return;
    try {
      const response = await fetch(`/api/applications/${notification.data.application_id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved from popup' })
      });
      if (response.ok) {
        showToast.success('Application approved!');
        await markNotificationAsRead(notification.id);
        setCurrentNotification(null);
      } else {
        showToast.error('Failed to approve application');
      }
    } catch (error) {
      showToast.error('Error approving application');
    }
  };

  const handleReject = async (notification: Notification) => {
    if (!notification.data?.application_id) return;
    try {
      const response = await fetch(`/api/applications/${notification.data.application_id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Rejected from popup', refund: true })
      });
      if (response.ok) {
        showToast.success('Application rejected and refunded!');
        await markNotificationAsRead(notification.id);
        setCurrentNotification(null);
      } else {
        showToast.error('Failed to reject application');
      }
    } catch (error) {
      showToast.error('Error rejecting application');
    }
  };

  const handleReview = (notification: Notification) => {
    if (!notification.data?.application_id) return;
    window.open(`/dashboard/admin/applications?highlight=${notification.data.application_id}`, '_blank');
  };

  // Auto-dismiss after 8s unless hovered
  useEffect(() => {
    if (currentNotification && !hovered) {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      autoDismissRef.current = setTimeout(() => {
        setCurrentNotification(null);
      }, 8000);
    }
    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [currentNotification, hovered]);

  // Fallback polling for notifications if real-time fails - reduced frequency for free tier
  useEffect(() => {
    if (!session?.user?.id || !session?.user?.role) return;
    let pollingInterval: NodeJS.Timeout | null = null;
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?unread_only=true&limit=3');
        const result = await response.json();
        if (result.notifications && result.notifications.length > 0) {
          const newNotif = result.notifications[0];
          showNotification(newNotif);
        }
      } catch (err) {
        // Reduced error logging for production
      }
    };
    // Increased interval from 10s to 30s to reduce API calls
    pollingInterval = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [session?.user?.id, session?.user?.role]);

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
        const newNotification = payload.new as Notification;
        showNotification(newNotification);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, session?.user?.role]);

  if (!currentNotification) {
    return null;
  }

  // Modern color scheme
  const borderColor =
    currentNotification.type === 'APPLICATION_SUBMITTED' ? 'border-blue-500' :
    currentNotification.type === 'APPLICATION_APPROVED' ? 'border-green-500' :
    currentNotification.type === 'APPLICATION_REJECTED' ? 'border-red-500' :
    'border-gray-400';
  const shadowColor =
    currentNotification.type === 'APPLICATION_SUBMITTED' ? 'shadow-blue-200' :
    currentNotification.type === 'APPLICATION_APPROVED' ? 'shadow-green-200' :
    currentNotification.type === 'APPLICATION_REJECTED' ? 'shadow-red-200' :
    'shadow-gray-200';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
        className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full ${className}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          className={`rounded-2xl bg-white border-4 ${borderColor} ${shadowColor} shadow-2xl p-0 overflow-hidden animate-in slide-in-from-bottom duration-300`}
          style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(currentNotification.type)}
              <h3 className="font-bold text-lg text-gray-900 tracking-tight">
                {currentNotification.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentNotification(null)}
              className="h-7 w-7 p-0 hover:bg-gray-200 rounded-full"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="px-5 py-3">
            <p className="text-base text-gray-700 mb-2 leading-relaxed">
              {currentNotification.message}
            </p>
            {currentNotification.data && Object.keys(currentNotification.data).length > 0 && (
              <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                {currentNotification.data.scheme_name && (
                  <p className="text-blue-900"><strong>Service:</strong> {currentNotification.data.scheme_name}</p>
                )}
                {currentNotification.data.customer_name && (
                  <p className="text-blue-900"><strong>Customer:</strong> {currentNotification.data.customer_name}</p>
                )}
                {currentNotification.data.amount && (
                  <p className="text-blue-900"><strong>Amount:</strong> ₹{currentNotification.data.amount}</p>
                )}
              </div>
            )}
            {(currentNotification.type && currentNotification.type.toUpperCase().includes('APPLICATION')) && (
              <div className="flex space-x-2 mb-2 mt-2">
                <Button
                  onClick={() => handleApprove(currentNotification)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs py-2 font-bold shadow-md rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-1 inline" /> Approve
                </Button>
                <Button
                  onClick={() => handleReject(currentNotification)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs py-2 font-bold shadow-md rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 mr-1 inline" /> Reject & Refund
                </Button>
                <Button
                  onClick={() => handleReview(currentNotification)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs py-2 font-bold shadow-md rounded-lg"
                >
                  <Info className="w-4 h-4 mr-1 inline" /> Review
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>{new Date(currentNotification.created_at).toLocaleString()}</span>
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>System</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
