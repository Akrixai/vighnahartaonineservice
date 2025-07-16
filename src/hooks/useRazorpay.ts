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
      console.log('Order response:', orderResponse);
      
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
          console.log('Razorpay payment response:', response);
          try {
            // Verify payment
            const verificationResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: orderAmount,
            });
            
            console.log('Verification response:', verificationResponse);

            if (verificationResponse?.success) {
              setLoading(false);
              onSuccess?.(verificationResponse.data);
            } else {
              throw new Error(verificationResponse?.error || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
            setError(errorMessage);
            setLoading(false);
            onError?.(errorMessage);
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
      console.error('Payment initiation error:', err);
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
