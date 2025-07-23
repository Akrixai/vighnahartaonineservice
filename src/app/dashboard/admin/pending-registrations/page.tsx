'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { showToast } from '@/lib/toast';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';

interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: string;
  status: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
}

export default function PendingRegistrationsPage() {
  const { data: session } = useSession();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.EMPLOYEE) {
      fetchRegistrations();
    }
  }, [session, statusFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pending-registrations?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showToast.error('Error', { description: 'Failed to fetch registrations' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    if (session?.user?.role !== UserRole.ADMIN) {
      showToast.error('Unauthorized', { description: 'Only admins can approve registrations' });
      return;
    }

    try {
      setProcessing(registrationId);
      const response = await fetch('/api/admin/pending-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          action: 'approve'
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Approved!', { description: 'Registration approved successfully' });
        fetchRegistrations();
      } else {
        showToast.error('Error', { description: data.error || 'Failed to approve registration' });
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      showToast.error('Error', { description: 'Failed to approve registration' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (registrationId: string) => {
    if (session?.user?.role !== UserRole.ADMIN) {
      showToast.error('Unauthorized', { description: 'Only admins can reject registrations' });
      return;
    }

    if (!rejectionReason.trim()) {
      showToast.error('Reason Required', { description: 'Please provide a reason for rejection' });
      return;
    }

    try {
      setProcessing(registrationId);
      const response = await fetch('/api/admin/pending-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          action: 'reject',
          rejectionReason
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Rejected', { description: 'Registration rejected successfully' });
        setRejectionReason('');
        setShowDetails(false);
        fetchRegistrations();
      } else {
        showToast.error('Error', { description: data.error || 'Failed to reject registration' });
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showToast.error('Error', { description: 'Failed to reject registration' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (session?.user?.role !== UserRole.ADMIN) {
      showToast.error('Unauthorized', { description: 'Only admins can delete registrations' });
      return;
    }

    showToast.confirm('Delete registration?', {
      description: 'Are you sure you want to delete this registration? This action cannot be undone.',
      onConfirm: async () => {
        await performDelete(registrationId);
      }
    });
  };

  const performDelete = async (registrationId: string) => {

    try {
      setProcessing(registrationId);
      const response = await fetch(`/api/admin/pending-registrations?id=${registrationId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Deleted', { description: 'Registration deleted successfully' });
        fetchRegistrations();
      } else {
        showToast.error('Error', { description: data.error || 'Failed to delete registration' });
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      showToast.error('Error', { description: 'Failed to delete registration' });
    } finally {
      setProcessing(null);
    }
  };

  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading registrations..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <UserCheck className="w-10 h-10 mr-3" />
            Registration Management
          </h1>
          <p className="text-blue-100 text-xl">
            Review and manage retailer registration requests
          </p>
        </div>

        {/* Status Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="ml-auto">
                <span className="text-sm text-gray-600">
                  Total: {registrations.length} registrations
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No {statusFilter} registrations found
              </h3>
              <p className="text-gray-500">
                {statusFilter === 'pending' 
                  ? 'All registration requests have been processed.' 
                  : `No ${statusFilter} registrations to display.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {registrations.map((registration) => (
              <Card key={registration.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{registration.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{registration.role} Registration</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {registration.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{registration.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{registration.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{registration.city}, {registration.state}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {new Date(registration.created_at).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>

                      {registration.rejected_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-red-700">
                            <strong>Rejection Reason:</strong> {registration.rejected_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      {registration.status === 'pending' && session.user.role === UserRole.ADMIN && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(registration.id)}
                            disabled={processing === registration.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setShowDetails(true);
                            }}
                            disabled={processing === registration.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {session.user.role === UserRole.ADMIN && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(registration.id)}
                          disabled={processing === registration.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedRegistration(null);
                      setRejectionReason('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <p className="text-gray-900 font-medium capitalize">{selectedRegistration.role}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">State</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">PIN Code</label>
                      <p className="text-gray-900 font-medium">{selectedRegistration.pincode || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Registration Date</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedRegistration.created_at).toLocaleDateString('en-GB')} at{' '}
                        {new Date(selectedRegistration.created_at).toLocaleTimeString('en-GB')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRegistration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRegistration.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedRegistration.status.toUpperCase()}
                    </div>
                  </div>

                  {selectedRegistration.rejected_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Rejection Reason:</h4>
                      <p className="text-red-700">{selectedRegistration.rejected_reason}</p>
                    </div>
                  )}
                </div>

                {/* Rejection Form */}
                {selectedRegistration.status === 'pending' && session?.user?.role === UserRole.ADMIN && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Registration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Rejection *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide a clear reason for rejection..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleReject(selectedRegistration.id)}
                          disabled={processing === selectedRegistration.id || !rejectionReason.trim()}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Registration
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRejectionReason('');
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedRegistration.status === 'pending' && session?.user?.role === UserRole.ADMIN && (
                  <div className="border-t pt-6">
                    <div className="flex space-x-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(selectedRegistration.id)}
                        disabled={processing === selectedRegistration.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Registration
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDetails(false);
                          setSelectedRegistration(null);
                          setRejectionReason('');
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
