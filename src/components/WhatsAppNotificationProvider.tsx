'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';

export default function WhatsAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Only log for admin users - actual processing happens server-side
    if (session?.user?.role === UserRole.ADMIN) {
      console.log('✅ WhatsApp notifications enabled for admin user');
    }
  }, [session]);

  return <>{children}</>;
}
