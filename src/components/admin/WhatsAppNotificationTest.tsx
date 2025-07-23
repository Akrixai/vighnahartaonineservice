'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import { showToast } from '@/lib/toast';

interface WhatsAppNotificationTestProps {
  schemeId?: string;
  schemeTitle?: string;
}

export default function WhatsAppNotificationTest({ schemeId, schemeTitle }: WhatsAppNotificationTestProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  if (!session || session.user.role !== UserRole.ADMIN) {
    return null;
  }

  const handleSendNotifications = async () => {
    if (!schemeId) {
      showToast.error('No scheme selected');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/notify-scheme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schemeId }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('WhatsApp notifications sent successfully!');
        // Fetch logs after sending
        await fetchLogs();
      } else {
        showToast.error(data.error || 'Failed to send notifications');
      }
    } catch (error) {
      console.error('Error sending WhatsApp notifications:', error);
      showToast.error('Failed to send notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!schemeId) return;

    try {
      const response = await fetch(`/api/whatsapp/notify-scheme?schemeId=${schemeId}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    }
  };

  React.useEffect(() => {
    if (schemeId) {
      fetchLogs();
    }
  }, [schemeId]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📱</span>
          <span>WhatsApp Notifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schemeTitle && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Scheme:</strong> {schemeTitle}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Notifications will be sent to all active retailers and employees with valid phone numbers.
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={handleSendNotifications}
            disabled={isLoading || !schemeId}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                📤 Send WhatsApp Notifications
              </>
            )}
          </Button>

          <Button
            onClick={fetchLogs}
            variant="outline"
            disabled={!schemeId}
          >
            🔄 Refresh Logs
          </Button>
        </div>

        {/* Notification Logs */}
        {logs.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Notification Logs</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={log.id || index}
                  className={`p-3 rounded-lg border text-sm ${
                    log.status === 'sent'
                      ? 'bg-green-50 border-green-200'
                      : log.status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {log.recipient_type.toUpperCase()} - {log.recipient_phone}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Status: <span className="font-medium">{log.status}</span>
                      </p>
                      {log.sent_at && (
                        <p className="text-xs text-gray-500">
                          Sent: {new Date(log.sent_at).toLocaleString()}
                        </p>
                      )}
                      {log.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {log.error_message}
                        </p>
                      )}
                    </div>
                    <div className="text-lg">
                      {log.status === 'sent' ? '✅' : log.status === 'failed' ? '❌' : '⏳'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">📋 How it works:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Notifications are sent to all active retailers and employees</li>
            <li>• Users must have valid phone numbers in their profiles</li>
            <li>• Admin number ({process.env.ADMIN_WHATSAPP_NUMBER || 'Not configured'}) receives a summary</li>
            <li>• In development, messages are logged to console</li>
            <li>• For production, integrate with WhatsApp Business API</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
