'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import { showToast } from '@/lib/toast';

interface WhatsAppTestButtonProps {
  schemeId: string;
  schemeTitle: string;
}

export default function WhatsAppTestButton({ schemeId, schemeTitle }: WhatsAppTestButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (!session || session.user.role !== UserRole.ADMIN) {
    return null;
  }

  const handleTestNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/notify-scheme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          schemeId,
          schemeTitle,
          schemeDescription: `Test notification for ${schemeTitle}`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('WhatsApp notifications sent successfully!');
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

  return (
    <Button
      onClick={handleTestNotifications}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
          Sending...
        </>
      ) : (
        <>
          📱 Test WhatsApp
        </>
      )}
    </Button>
  );
}
