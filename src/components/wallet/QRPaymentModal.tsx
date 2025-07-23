'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, QrCode, CreditCard } from 'lucide-react';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; paymentMethod: string; transactionId: string; screenshot?: File }) => void;
  loading?: boolean;
}

export default function QRPaymentModal({ isOpen, onClose, onSubmit, loading = false }: QRPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !transactionId) return;

    onSubmit({
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      screenshot: screenshot || undefined
    });
  };

  const generateQRData = () => {
    // This would typically generate a UPI payment link
    const upiId = 'vignahartajanseva@paytm'; // Replace with actual UPI ID
    const merchantName = 'Vignaharta Janseva';
    const upiLink = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Wallet%20Top-up`;
    return upiLink;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Add Money to Wallet</CardTitle>
                <CardDescription className="text-red-100">Secure payment gateway integration</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Card Payment Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-600 text-xl">💳</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  For Card Payment Users
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  If you paid using card/UPI through the "💳 Card/UPI" option above, please fill this form
                  with your payment details and upload the payment screenshot for verification.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold text-gray-800 flex items-center">
                <span className="mr-2">💳</span>
                Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max="50000"
                  required
                  className="pl-8 h-12 text-lg font-medium text-gray-900 border-2 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600 font-medium">Minimum: ₹1</span>
                <span className="text-orange-600 font-medium">Maximum: ₹50,000</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-800 flex items-center">
                <span className="mr-2">💳</span>
                Choose Payment Method
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'UPI' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('UPI')}
                  className={`h-16 flex flex-col items-center gap-2 transition-all duration-200 ${
                    paymentMethod === 'UPI'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg scale-105'
                      : 'border-2 border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-sm font-medium">UPI/QR</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('CARD')}
                  className={`h-16 flex flex-col items-center gap-2 transition-all duration-200 ${
                    paymentMethod === 'CARD'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg scale-105'
                      : 'border-2 border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-medium">Card</span>
                </Button>
              </div>
            </div>

            {/* QR Code Section */}
            {paymentMethod === 'UPI' && amount && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    onClick={() => setShowQR(!showQR)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    {showQR ? 'Hide QR Code' : 'Generate QR Code'}
                  </Button>
                </div>

                {showQR && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200 shadow-inner">
                    <div className="text-center space-y-6">
                      <div className="w-80 h-80 mx-auto bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
                        <div className="w-full h-full rounded-lg overflow-hidden relative">
                          <img
                            src="/akrixPayQR.jpg"
                            alt="AkrixPay QR Code"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-3 rounded-b-lg">
                            <p className="text-xl font-bold">₹{amount}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-800">
                          Scan with any UPI app to pay ₹{amount}
                        </p>
                        <p className="text-xs text-blue-600">
                          PhonePe • Google Pay • Paytm • BHIM • Any UPI App
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const upiLink = generateQRData();
                          window.open(upiLink, '_blank');
                        }}
                        className="w-full bg-white hover:bg-blue-50 border-blue-300 text-blue-700 font-medium py-3"
                      >
                        <span className="mr-2">📱</span>
                        Open in UPI App
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transaction ID Input */}
            <div className="space-y-2">
              <Label htmlFor="transactionId" className="text-sm font-semibold text-gray-800 flex items-center">
                <span className="mr-2">🔢</span>
                Transaction ID / Reference Number
              </Label>
              <Input
                id="transactionId"
                type="text"
                placeholder="e.g., 123456789012"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                className="h-12 text-gray-900 border-2 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg font-medium"
              />
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Enter the transaction ID you received after making the payment
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <Label htmlFor="screenshot" className="text-sm font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📸</span>
                Payment Screenshot (Optional)
              </Label>
              <div className="relative">
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="h-12 text-gray-900 border-2 border-gray-200 focus:border-pink-500 focus:ring-pink-500 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                />
              </div>
              <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                ⚡ Upload a screenshot for faster verification and approval
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg transition-all duration-200 disabled:opacity-50"
                disabled={loading || !amount || !transactionId}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">✓</span>
                    Submit for Verification
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Payment Instructions
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm text-blue-800">Enter the amount you want to add to your wallet</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm text-blue-800">Choose your preferred payment method (UPI/QR or Card)</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-sm text-blue-800">Complete the payment using your preferred app</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span className="text-sm text-blue-800">Enter the transaction ID you received after payment</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                <span className="text-sm text-green-800 font-medium">Money will be added after admin verification</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
