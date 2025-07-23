import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useApi } from './useApi';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

export function useRazorpay() {
  const { data: session } = useSession();
  const { addMoney, verifyPayment } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const checkPaymentStatus = useCallback(async (
    paymentId: string,
    orderId: string,
    onSuccess?: (data: any) => void,
    onError?: (error: string) => void
  ) => {
    try {
      // Check status multiple times with delays
      for (let attempt = 0; attempt < 5; attempt++) {
        const statusResponse = await fetch(`/api/payment/status?payment_id=${paymentId}&order_id=${orderId}`);
        const statusData = await statusResponse.json();

        if (statusData.success) {
          const { payment, transaction, wallet } = statusData.data;

          // If payment is captured and transaction exists
          if (payment?.status === 'captured' && transaction?.status === 'COMPLETED') {
            setLoading(false);
            onSuccess?.({
              transaction,
              wallet,
              payment
            });
            return;
          }

          // If payment is captured but no transaction, try to sync
          if (payment?.status === 'captured' && !transaction) {
            const syncResponse = await fetch('/api/payment/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payment_id: paymentId, order_id: orderId })
            });

            const syncData = await syncResponse.json();
            if (syncData.success) {
              setLoading(false);
              onSuccess?.(syncData.data);
              return;
            }
          }
        }

        // Wait before next attempt (exponential backoff)
        if (attempt < 4) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      // If all attempts failed
      const errorMessage = 'Payment status could not be confirmed. Please contact support.';
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);

    } catch (error) {
      const errorMessage = 'Failed to verify payment status';
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  }, []);

  const initiatePayment = useCallback(async (
    amount: number,
    onSuccess?: (data: any) => void,
    onError?: (error: string) => void
  ) => {
    if (!session) {
      const error = 'Please login to continue';
      setError(error);
      onError?.(error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create order
      const orderResponse = await addMoney(amount);
      
      if (!orderResponse?.success) {
        throw new Error(orderResponse?.error || 'Failed to create payment order');
      }

      const orderData = orderResponse as any;
      const { id: order_id, amount: orderAmount, currency } = orderData.order;
      const key = orderData.key_id;
      
      if (!key) {
        throw new Error('Razorpay key not found. Please check environment variables.');
      }

      // Razorpay options
      const options: RazorpayOptions = {
        key,
        amount: orderAmount,
        currency,
        name: 'Vignaharta Janseva',
        description: 'Wallet Top-up',
        order_id,
        handler: async (response: any) => {
          try {
            // First, try to verify payment
            const verificationResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: orderAmount,
            });

            if (verificationResponse?.success) {
              setLoading(false);
              onSuccess?.(verificationResponse.data);
            } else {
              // If verification fails, try to check payment status
              await checkPaymentStatus(response.razorpay_payment_id, response.razorpay_order_id, onSuccess, onError);
            }
          } catch (err) {
            // Try to check payment status as fallback
            await checkPaymentStatus(response.razorpay_payment_id, response.razorpay_order_id, onSuccess, onError);
          }
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
          contact: session.user.phone || '',
        },
        theme: {
          color: '#4F46E5', // Indigo color
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError?.('Payment cancelled');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  }, [session, addMoney, verifyPayment, loadRazorpayScript]);

  return {
    loading,
    error,
    initiatePayment,
  };
}
