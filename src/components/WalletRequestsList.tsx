'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { CompactFileViewer } from './FileViewer';

interface WalletRequest {
  id: string;
  type: 'TOPUP' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payment_method: string;
  transaction_reference: string;
  screenshot_url?: string;
  description: string;
  created_at: string;
  processed_at?: string;
  processed_by_name?: string;
  rejection_reason?: string;
}

interface WalletRequestsListProps {
  className?: string;
  showTitle?: boolean;
  limit?: number;
}

export default function WalletRequestsList({ 
  className = '', 
  showTitle = true,
  limit = 10 
}: WalletRequestsListProps) {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWalletRequests();
  }, []);

  const fetchWalletRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wallet-requests?limit=${limit}`);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || 'Failed to fetch wallet requests');
      }
    } catch (err) {
      console.error('Error fetching wallet requests:', err);
      setError('Failed to load wallet requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {status}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    return type === 'TOPUP' ? 'text-green-600' : 'text-blue-600';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            💳 Wallet Requests
          </h3>
        )}
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading wallet requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            💳 Wallet Requests
          </h3>
        )}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            onClick={fetchWalletRequests}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            💳 Wallet Requests
          </h3>
        )}
        <div className="text-center p-8 bg-gray-50 rounded-lg border">
          <div className="text-gray-400 mb-2">
            <Clock className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">No wallet requests found</p>
          <p className="text-sm text-gray-500 mt-1">
            Your wallet top-up and withdrawal requests will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            💳 Wallet Requests
          </h3>
          <Button
            onClick={fetchWalletRequests}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(request.status)}
                    <span className={`font-medium ${getTypeColor(request.type)}`}>
                      {request.type === 'TOPUP' ? '💰 Wallet Top-up' : '💸 Wallet Withdrawal'}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-2 font-semibold text-gray-800">
                        {formatCurrency(request.amount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="ml-2 text-gray-800">
                        {request.payment_method}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Reference:</span>
                      <span className="ml-2 text-gray-800 font-mono text-xs">
                        {request.transaction_reference}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Requested:</span>
                      <span className="ml-2 text-gray-800">
                        {new Date(request.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {request.description && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Description:</span>
                      <span className="ml-2 text-gray-700">{request.description}</span>
                    </div>
                  )}

                  {request.screenshot_url && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Payment Screenshot:</span>
                      <div className="mt-1">
                        <CompactFileViewer 
                          filePath={request.screenshot_url}
                          fileName="Payment Screenshot"
                        />
                      </div>
                    </div>
                  )}

                  {request.status === 'APPROVED' && request.processed_at && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">Approved</span>
                      </div>
                      <div className="text-green-600 text-xs mt-1">
                        Processed on {new Date(request.processed_at).toLocaleDateString('en-IN')}
                        {request.processed_by_name && ` by ${request.processed_by_name}`}
                      </div>
                    </div>
                  )}

                  {request.status === 'REJECTED' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="flex items-center text-red-700">
                        <XCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">Rejected</span>
                      </div>
                      {request.rejection_reason && (
                        <div className="text-red-600 text-xs mt-1">
                          Reason: {request.rejection_reason}
                        </div>
                      )}
                      {request.processed_at && (
                        <div className="text-red-600 text-xs mt-1">
                          Processed on {new Date(request.processed_at).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length >= limit && (
        <div className="text-center mt-4">
          <Button
            onClick={() => {
              // This could be expanded to load more requests
              fetchWalletRequests();
            }}
            variant="outline"
            size="sm"
          >
            View All Requests
          </Button>
        </div>
      )}
    </div>
  );
}
