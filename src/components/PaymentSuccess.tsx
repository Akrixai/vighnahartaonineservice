'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface PaymentSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  transactionId?: string;
  walletBalance?: number;
}

export default function PaymentSuccess({ 
  isOpen, 
  onClose, 
  amount, 
  transactionId, 
  walletBalance 
}: PaymentSuccessProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onClose();
    }
  }, [isOpen, countdown, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Payment Successful!</CardTitle>
              <CardDescription className="text-green-100">
                Your wallet has been updated
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Amount Added</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(amount)}</p>
            </div>
            
            {walletBalance !== undefined && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">New Wallet Balance</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(walletBalance)}</p>
              </div>
            )}
            
            {transactionId && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="text-sm font-mono text-gray-800 break-all">{transactionId}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <span className="text-lg">🎉</span>
              <span className="text-sm font-medium">Money added successfully!</span>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold h-12"
              >
                Continue ({countdown}s)
              </Button>
              
              <Button
                onClick={() => router.push('/dashboard/transactions')}
                variant="outline"
                className="w-full h-10 text-gray-700"
              >
                View Transaction History
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-lg">💡</span>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900">What's Next?</p>
                <p className="text-xs text-blue-700 mt-1">
                  You can now use your wallet balance to pay for government services, schemes, and applications.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
