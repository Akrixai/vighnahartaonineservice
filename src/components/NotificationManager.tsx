'use client';

import React, { useState, useCallback } from 'react';
import PopupNotification from './PopupNotification';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface NotificationManagerProps {
  children: React.ReactNode;
}

// Global notification manager instance
let notificationManager: {
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
} | null = null;

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Set global reference
  React.useEffect(() => {
    notificationManager = { addNotification };
    return () => {
      notificationManager = null;
    };
  }, [addNotification]);

  return (
    <>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-0 right-0 z-[9999] p-4 space-y-3 pointer-events-none">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto"
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 9999 - index 
            }}
          >
            <PopupNotification
              {...notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// Export function to show notifications globally
export const showPopupNotification = (notification: Omit<NotificationData, 'id'>) => {
  if (notificationManager) {
    notificationManager.addNotification(notification);
  }
};

export default NotificationManager;
