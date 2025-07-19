'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Plus, FileText, Upload, Phone, QrCode, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/layout';
import { showToast } from '@/lib/toast';

interface Refund {
  id: string;
  amount: number;
  reason: string;
  description: string;
  documents: string[];
  contact_number: string;
  qr_screenshot_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  admin_response: string;
  created_at: string;
  processed_at: string;
  application?: {
    id: string;
    scheme_id: string;
    customer_name: string;
  };
}

interface Application {
  id: string;
  scheme_id: string;
  customer_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function RefundsPage() {
  const { data: session } = useSession();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    application_id: 'none',
    amount: '',
    reason: '',
    description: '',
    contact_number: '',
    qr_screenshot_url: '',
    documents: [] as string[]
  });

  useEffect(() => {
    fetchRefunds();
    fetchApplications();
  }, []);

  const fetchRefunds = async () => {
    try {
      const response = await fetch('/api/refunds');
      if (response.ok) {
        const data = await response.json();
        setRefunds(data);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      showToast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications?status=APPROVED&limit=50');
      if (response.ok) {
        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.reason) {
      showToast.error('Amount and reason are required');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      showToast.error('Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      // Process form data to handle "none" value
      const processedData = {
        ...formData,
        application_id: formData.application_id === 'none' ? null : formData.application_id || null
      };

      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success('Refund request submitted successfully!');
        setFormData({
          application_id: 'none',
          amount: '',
          reason: '',
          description: '',
          contact_number: '',
          qr_screenshot_url: '',
          documents: []
        });
        setShowForm(false);
        fetchRefunds();
      } else {
        showToast.error(result.error || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Error submitting refund:', error);
      showToast.error('Error submitting refund request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <X className="w-4 h-4" />;
      case 'PROCESSED': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (session?.user?.role !== 'RETAILER') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only retailers can access refunds.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <RefreshCw className="w-10 h-10 mr-3" />
                Refunds
              </h1>
              <p className="text-red-100 text-xl">
                Submit and track your refund requests
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-red-600 hover:bg-red-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Refund Request
            </Button>
          </div>
        </div>

        {/* New Refund Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Submit Refund Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="application_id">Related Application (Optional)</Label>
                    <Select
                      value={formData.application_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, application_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an application" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No related application</SelectItem>
                        {Array.isArray(applications) && applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.customer_name} - ₹{app.amount} ({new Date(app.created_at).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Refund Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Refund *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Brief reason for refund"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed explanation of the issue"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contact_number">Contact Number</Label>
                    <Input
                      id="contact_number"
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                      placeholder="Your contact number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="qr_screenshot_url">QR Screenshot URL</Label>
                    <Input
                      id="qr_screenshot_url"
                      type="url"
                      value={formData.qr_screenshot_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, qr_screenshot_url: e.target.value }))}
                      placeholder="URL of QR code screenshot"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <FileText className="w-5 h-5 mr-2" />
              Your Refund Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading refunds...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg">No refund requests yet</p>
                <p className="text-gray-500">Submit your first refund request above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {refunds.map((refund) => (
                  <div key={refund.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">₹{refund.amount.toLocaleString()}</h3>
                        <p className="text-gray-600">{refund.reason}</p>
                        {refund.application && (
                          <p className="text-sm text-gray-500">
                            Related to: {refund.application.customer_name}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(refund.status)}>
                        {getStatusIcon(refund.status)}
                        <span className="ml-1">{refund.status}</span>
                      </Badge>
                    </div>

                    {refund.description && (
                      <p className="text-gray-700 mb-3">{refund.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Submitted: {new Date(refund.created_at).toLocaleDateString()}</span>
                      {refund.processed_at && (
                        <span>Processed: {new Date(refund.processed_at).toLocaleDateString()}</span>
                      )}
                    </div>

                    {refund.admin_response && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Admin Response:</p>
                        <p className="text-sm text-gray-600 mt-1">{refund.admin_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
