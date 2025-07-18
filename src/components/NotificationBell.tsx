'use client';

import { useState } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTime } from '@/lib/utils';

interface NotificationBellProps {
  userRole?: string;
  userId?: string;
}

export default function NotificationBell({ userRole, userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead } = useNotifications(userRole, userId);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead([notificationId]);
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead([], true);
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return 'border-blue-200 bg-blue-50';
      case 'APPLICATION_APPROVED':
        return 'border-green-200 bg-green-50';
      case 'APPLICATION_REJECTED':
        return 'border-red-200 bg-red-50';
      case 'PAYMENT_RECEIVED':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
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
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-2xl border-2 border-red-200 z-50 max-h-96 overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-200 bg-gradient-to-r from-red-500 to-red-600">
            <h3 className="font-bold text-white flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-white hover:bg-white/20 border border-white/30"
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
                <p className="text-red-600 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-red-300" />
                <p className="text-red-600 font-medium text-lg">No notifications yet</p>
                <p className="text-red-400 text-sm mt-1">You'll see new updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-red-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-red-100/50 transition-all duration-200 ${
                      !notification.is_read
                        ? 'bg-gradient-to-r from-red-100 to-orange-100 border-l-4 border-l-red-500 shadow-sm'
                        : 'bg-white/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-2xl bg-white rounded-full p-2 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-red-800">
                              {notification.title}
                            </p>
                            <p className="text-sm text-red-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-red-400 mt-2 font-medium">
                              {formatDateTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 ml-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Additional data display */}
                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 text-xs">
                            {notification.data.scheme_name && (
                              <p className="text-red-700"><strong className="text-red-800">Service:</strong> {notification.data.scheme_name}</p>
                            )}
                            {notification.data.customer_name && (
                              <p className="text-red-700 mt-1"><strong className="text-red-800">Customer:</strong> {notification.data.customer_name}</p>
                            )}
                            {notification.data.amount && (
                              <p className="text-red-700 mt-1"><strong className="text-red-800">Amount:</strong> ₹{notification.data.amount}</p>
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
