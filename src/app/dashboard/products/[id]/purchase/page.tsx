'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Truck, CreditCard, MapPin, Phone, User } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function ProductPurchasePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cod' | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // COD Form Data
  const [codForm, setCodForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  useEffect(() => {
    if (!session || !productId) return;

    const fetchData = async () => {
      try {
        // Fetch product details
        console.log('Fetching product with ID:', productId);
        const productResponse = await fetch(`/api/products/${productId}`);
        const productResult = await productResponse.json();

        console.log('Product API response:', productResult);

        if (productResult.success) {
          setProduct(productResult.product);
        } else {
          console.error('Product fetch failed:', productResult.error);
        }

        // Fetch wallet details
        const walletResponse = await fetch('/api/wallet');
        const walletResult = await walletResponse.json();

        if (walletResult.success) {
          setWallet(walletResult.data);
        } else {
          console.error('Wallet fetch failed:', walletResult.error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, productId]);

  // Check retailer access
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <Button onClick={() => router.back()} className="bg-red-600 hover:bg-red-700 text-white">
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const deliveryCharges = 50; // Fixed delivery charges
  const totalAmount = product.price + deliveryCharges;
  const hasEnoughBalance = wallet && wallet.balance >= totalAmount;

  const handleWalletPayment = async () => {
    if (!hasEnoughBalance) {
      showToast.confirm('Insufficient wallet balance', {
        description: 'Would you like to add money to your wallet?',
        onConfirm: () => {
          router.push('/dashboard/wallet');
        }
      });
      return;
    }

    // Validate wallet form
    if (!codForm.customerName || !codForm.customerPhone || !codForm.address || !codForm.city || !codForm.state || !codForm.pincode) {
      showToast.error('Missing information', {
        description: 'Please fill all required address fields for delivery'
      });
      return;
    }

    setOrderLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          payment_method: 'WALLET',
          amount: totalAmount,
          delivery_charges: deliveryCharges,
          customer_details: {
            ...codForm,
            customerEmail: session.user.email
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast.success('Order placed successfully!', {
          description: 'Payment deducted from wallet.'
        });
        // Redirect to order confirmation with order ID
        router.push(`/dashboard/orders/${result.order.id}/receipt`);
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
      showToast.error('Failed to place order', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCODOrder = async () => {
    // Validate COD form
    if (!codForm.customerName || !codForm.customerPhone || !codForm.address || !codForm.city || !codForm.state || !codForm.pincode) {
      showToast.error('Missing information', {
        description: 'Please fill all required fields'
      });
      return;
    }

    setOrderLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          payment_method: 'COD',
          amount: totalAmount,
          delivery_charges: deliveryCharges,
          customer_details: codForm
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast.success('Order placed successfully!', {
          description: 'You will pay on delivery.'
        });
        // Redirect to order confirmation with order ID
        router.push(`/dashboard/orders/${result.order.id}/receipt`);
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('COD order error:', error);
      showToast.error('Failed to place order', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCodForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">🛒 Purchase Product</h1>
          <p className="text-red-100">Choose your payment method and complete the order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="text-gray-600 mt-2">{product.description}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Product Price:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Delivery Charges:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(deliveryCharges)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-red-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Choose Payment Method</CardTitle>
              <CardDescription>Select how you want to pay for this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Header */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">💳 Choose Payment Method</h3>
                <p className="text-gray-600">Select your preferred payment option below</p>
              </div>

              {/* Wallet Payment */}
              <div className={`border-3 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                paymentMethod === 'wallet'
                  ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 shadow-lg'
                  : 'border-gray-200 hover:border-red-300 hover:shadow-md'
              }`} onClick={() => setPaymentMethod('wallet')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      paymentMethod === 'wallet' ? 'bg-red-500' : 'bg-gray-100'
                    }`}>
                      <Wallet className={`w-8 h-8 ${
                        paymentMethod === 'wallet' ? 'text-white' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">💳 Digital Wallet</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Available Balance: {wallet ? formatCurrency(wallet.balance) : 'Loading...'}
                      </p>
                      <p className="text-xs text-gray-500">Instant payment • Secure • No extra charges</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {hasEnoughBalance ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Available
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        ⚠ Insufficient
                      </span>
                    )}
                    {paymentMethod === 'wallet' && (
                      <div className="mt-2 text-xs text-gray-500">✓ Selected</div>
                    )}
                  </div>
                </div>

                {paymentMethod === 'wallet' && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Payment Summary</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">After payment</p>
                        <p className="text-sm font-medium text-gray-700">
                          Balance: {wallet ? formatCurrency(wallet.balance - totalAmount) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COD Payment */}
              <div className={`border-3 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                paymentMethod === 'cod'
                  ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 shadow-lg'
                  : 'border-gray-200 hover:border-red-300 hover:shadow-md'
              }`} onClick={() => setPaymentMethod('cod')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      paymentMethod === 'cod' ? 'bg-red-500' : 'bg-gray-100'
                    }`}>
                      <Truck className={`w-8 h-8 ${
                        paymentMethod === 'cod' ? 'text-white' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">🚚 Cash on Delivery</h4>
                      <p className="text-sm text-gray-600 mb-1">Pay when product is delivered to you</p>
                      <p className="text-xs text-gray-500">Delivery charges may apply • 3-7 business days</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      📦 Available
                    </span>
                    {paymentMethod === 'cod' && (
                      <div className="mt-2 text-xs text-gray-500">✓ Selected</div>
                    )}
                  </div>
                </div>

                {paymentMethod === 'cod' && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Total Amount (COD)</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Payment at delivery</p>
                        <p className="text-sm font-medium text-gray-700">Cash/Card accepted</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet Payment Address Form */}
              {paymentMethod === 'wallet' && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Delivery Address
                    </CardTitle>
                    <CardDescription>
                      Please provide delivery address for your order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          name="customerName"
                          value={codForm.customerName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          name="customerPhone"
                          value={codForm.customerPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter phone number"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-red-700 mb-2">Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={codForm.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter complete address"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={codForm.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter city"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={codForm.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter state"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">PIN Code *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={codForm.pincode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter PIN code"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">Landmark (Optional)</label>
                        <input
                          type="text"
                          name="landmark"
                          value={codForm.landmark}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter landmark"
                        />
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="pt-6 space-y-4">
                {paymentMethod === 'wallet' && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleWalletPayment}
                      disabled={!hasEnoughBalance || orderLoading}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 text-lg font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      {orderLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing Payment...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Wallet className="w-6 h-6" />
                          <span>💳 Pay {formatCurrency(totalAmount)} from Wallet</span>
                        </div>
                      )}
                    </Button>
                    {!hasEnoughBalance && (
                      <p className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        ⚠ Insufficient wallet balance. Please add money to your wallet first.
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleCODOrder}
                      disabled={orderLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      {orderLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Placing Order...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Truck className="w-6 h-6" />
                          <span>🚚 Place COD Order - {formatCurrency(totalAmount)}</span>
                        </div>
                      )}
                    </Button>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-center text-sm text-blue-800">
                        📦 Your order will be delivered in 3-7 business days. Pay when you receive the product.
                      </p>
                    </div>
                  </div>
                )}

                {!paymentMethod && (
                  <p className="text-center text-gray-500">Please select a payment method</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COD Form */}
        {paymentMethod === 'cod' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Delivery Information</CardTitle>
              <CardDescription>Please provide delivery details for cash on delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName" className="text-gray-900">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={codForm.customerName}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    required
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone" className="text-gray-900">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={codForm.customerPhone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail" className="text-gray-900">Email</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={codForm.customerEmail}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="pincode" className="text-gray-900">PIN Code *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={codForm.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter PIN code"
                    required
                    className="text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-gray-900">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={codForm.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    required
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-gray-900">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={codForm.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-gray-900">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={codForm.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    required
                    className="text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="landmark" className="text-gray-900">Landmark</Label>
                  <Input
                    id="landmark"
                    name="landmark"
                    value={codForm.landmark}
                    onChange={handleInputChange}
                    placeholder="Enter nearby landmark"
                    className="text-gray-900"
                  />
                </div>

                <div className="md:col-span-2 pt-4">
                  <Button
                    type="button"
                    onClick={handleCODOrder}
                    disabled={orderLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {orderLoading ? 'Placing Order...' : `Place COD Order - ${formatCurrency(totalAmount)}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
