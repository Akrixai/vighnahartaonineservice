'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

interface Receipt {
  id: string;
  application_id: string;
  receipt_number: string;
  service_name: string;
  service_fee: number;
  processing_fee: number;
  total_amount: number;
  approval_date: string;
  created_at: string;
  retailer: {
    id: string;
    name: string;
    email: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
  application: {
    id: string;
    status: string;
    form_data: any;
  };
}

export function useRealTimeReceipts() {
  const { data: session } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/receipts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }

      const data = await response.json();
      setReceipts(data.receipts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user) return;

    // Initial fetch
    fetchReceipts();

    // Set up real-time subscription
    const channel = supabase
      .channel('receipts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: session.user.role === 'RETAILER' ? `retailer_id=eq.${session.user.id}` : undefined
        },
        (payload) => {
          console.log('Receipt change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New receipt created - refresh the list
            fetchReceipts();
          } else if (payload.eventType === 'UPDATE') {
            // Receipt updated - refresh the list
            fetchReceipts();
          } else if (payload.eventType === 'DELETE') {
            // Receipt deleted - remove from list
            setReceipts(prev => prev.filter(receipt => receipt.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  return {
    receipts,
    loading,
    error,
    refetch: fetchReceipts
  };
}
