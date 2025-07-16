'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FileText, CheckCircle } from 'lucide-react';

export default function ReceiptNotifications() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user || session.user.role === 'RETAILER') return;

    // Set up real-time subscription for new receipts (for employees/admins)
    const channel = supabase
      .channel('receipt-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'receipts'
        },
        async (payload) => {
          console.log('New receipt generated:', payload);
          
          try {
            // Fetch receipt details with retailer info
            const { data: receipt, error } = await supabase
              .from('receipts')
              .select(`
                receipt_number,
                service_name,
                total_amount,
                retailer:users!receipts_retailer_id_fkey (
                  name,
                  email
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching receipt details:', error);
              return;
            }

            // Show notification to employee/admin
            toast.success(
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Receipt Generated!</p>
                  <p className="text-sm text-gray-600">
                    {receipt.service_name} - {receipt.retailer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Receipt #{receipt.receipt_number}
                  </p>
                </div>
              </div>,
              {
                duration: 6000,
                style: {
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534'
                }
              }
            );
          } catch (error) {
            console.error('Error processing receipt notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // For retailers - show notification when they receive a new receipt
  useEffect(() => {
    if (!session?.user || session.user.role !== 'RETAILER') return;

    const channel = supabase
      .channel('retailer-receipt-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'receipts',
          filter: `retailer_id=eq.${session.user.id}`
        },
        async (payload) => {
          console.log('New receipt received:', payload);
          
          try {
            // Fetch receipt details
            const { data: receipt, error } = await supabase
              .from('receipts')
              .select(`
                receipt_number,
                service_name,
                total_amount
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching receipt details:', error);
              return;
            }

            // Show notification to retailer
            toast.success(
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">Service Approved!</p>
                  <p className="text-sm text-gray-600">
                    Your {receipt.service_name} application has been approved
                  </p>
                  <p className="text-xs text-gray-500">
                    Receipt #{receipt.receipt_number} is ready for download
                  </p>
                </div>
              </div>,
              {
                duration: 8000,
                style: {
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1e40af'
                }
              }
            );
          } catch (error) {
            console.error('Error processing retailer receipt notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  return null; // This component doesn't render anything visible
}
