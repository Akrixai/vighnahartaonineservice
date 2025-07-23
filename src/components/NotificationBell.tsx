'use client';

import { useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTime } from '@/lib/utils';

interface NotificationBellProps {
  userRole?: string;
  userId?: string;
}

export default function NotificationBell({ userRole, userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, deleteNotification } = useNotifications(userRole, userId);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead([notificationId]);
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead([], true);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return '📋';
      case 'APPLICATION_APPROVED':
        return '✅';
      case 'APPLICATION_REJECTED':
        return '❌';
      case 'PAYMENT_RECEIVED':
        return '💰';
      default:
        return '🔔';
    }
  };



  if (!userRole || (userRole !== 'ADMIN' && userRole !== 'EMPLOYEE')) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-400 bg-gradient-to-r from-red-500 to-red-600">
            <h3 className="font-bold text-black flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-black hover:bg-white/20 border border-white/30"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1 text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-3"></div>
                <p className="text-gray-700 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-700 font-medium text-lg">No notifications yet</p>
                <p className="text-gray-500 text-sm mt-1">You'll see new updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-red-800 transition-all duration-200 ${
                      !notification.is_read
                        ? 'bg-gray-900 border-l-4 border-l-red-500 shadow-sm'
                        : 'bg-black'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-2xl bg-black rounded-full p-2 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-black">
                              {notification.title}
                            </p>
                            <p className="text-sm text-black mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-700 mt-2 font-medium">
                              {formatDateTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-black rounded-full"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Additional data display */}
                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="mt-3 p-3 bg-black rounded-lg border border-black text-xs">
                            {notification.data.scheme_name && (
                              <p className="text-black"><strong className="text-black">Service:</strong> {notification.data.scheme_name}</p>
                            )}
                            {notification.data.customer_name && (
                              <p className="text-black mt-1"><strong className="text-black">Customer:</strong> {notification.data.customer_name}</p>
                            )}
                            {notification.data.amount && (
                              <p className="text-black mt-1"><strong className="text-black">Amount:</strong> ₹{notification.data.amount}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-600"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
