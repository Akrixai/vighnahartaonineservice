'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';

export default function WhatsAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // All console.log statements removed
  }, [session]);

  return <>{children}</>;
}
