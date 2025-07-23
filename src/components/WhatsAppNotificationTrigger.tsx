'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function WhatsAppNotificationTrigger() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only initialize for admin users
    if (session?.user?.role === 'ADMIN' && process.env.NODE_ENV === 'development') {
      // All console.log statements removed
    }
  }, [session]);

  // This component doesn't render anything visible
  return null;
}
