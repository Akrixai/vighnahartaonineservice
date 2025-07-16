'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { Users, Edit, Trash2, Mail, Phone, MapPin, Calendar, Wallet, Eye } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Retailer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  updated_at: string;
  wallets?: {
    balance: number;
  }[];
}

export default function RetailersManagementPage() {
  const { data: session } = useSession();
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: retailers, loading: retailersLoading, refresh } = useRealTimeData<Retailer>({
    table: 'users',
    filter: { column: 'role', value: 'RETAILER' },
    orderBy: { column: 'created_at', ascending: false },
    select: `
      *,
      wallets (
        balance
      )
    `,
    enabled: session?.user?.role === UserRole.ADMIN
  });

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const toggleStatus = async (retailerId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/retailers/${retailerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update retailer status');
      }

      refresh();
    } catch (error) {
      console.error('Error updating retailer status:', error);
      alert('Failed to update retailer status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (retailerId: string) => {
    // Use custom toast confirmation instead of browser confirm
    showToast.custom('Delete retailer?', 'warning', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          await performDelete(retailerId);
        }
      }
    });
  };

  const performDelete = async (retailerId: string) => {

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/retailers/${retailerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete retailer');
      }

      refresh();
      showToast.success('Retailer deleted!', {
        description: 'The retailer has been successfully removed from the system.'
      });
    } catch (error) {
      console.error('Error deleting retailer:', error);
      showToast.error('Failed to delete retailer', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Retailer Management</h1>
            <p className="text-gray-600">Manage retailer accounts and their status</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Retailers</p>
                  <p className="text-2xl font-bold text-gray-900">{retailers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {retailers?.filter(r => r.is_active).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {retailers?.filter(r => !r.is_active).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{retailers?.reduce((sum, r) => sum + (r.wallets?.[0]?.balance || 0), 0).toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retailers List */}
        <Card>
          <CardHeader>
            <CardTitle>All Retailers</CardTitle>
            <CardDescription>View and manage retailer accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {retailersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading retailers...</p>
              </div>
            ) : retailers && retailers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retailer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {retailers.map((retailer) => (
                      <tr key={retailer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{retailer.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Joined {new Date(retailer.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {retailer.email}
                          </div>
                          {retailer.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {retailer.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {retailer.city && retailer.state 
                              ? `${retailer.city}, ${retailer.state}` 
                              : 'Not provided'
                            }
                          </div>
                          {retailer.pincode && (
                            <div className="text-sm text-gray-500">
                              PIN: {retailer.pincode}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <Wallet className="w-4 h-4 mr-1" />
                            ₹{(retailer.wallets?.[0]?.balance || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            retailer.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {retailer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            onClick={() => setSelectedRetailer(retailer)}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => toggleStatus(retailer.id, retailer.is_active)}
                            size="sm"
                            variant="outline"
                            className={retailer.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            disabled={loading}
                          >
                            {retailer.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(retailer.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No retailers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retailer Details Modal */}
      {selectedRetailer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Retailer Details</h2>
              <Button
                onClick={() => setSelectedRetailer(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedRetailer.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedRetailer.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedRetailer.phone || 'Not provided'}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      selectedRetailer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRetailer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Address Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Address:</span> {selectedRetailer.address || 'Not provided'}</p>
                  <p><span className="font-medium">City:</span> {selectedRetailer.city || 'Not provided'}</p>
                  <p><span className="font-medium">State:</span> {selectedRetailer.state || 'Not provided'}</p>
                  <p><span className="font-medium">PIN Code:</span> {selectedRetailer.pincode || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Wallet Balance:</span> ₹{(selectedRetailer.wallets?.[0]?.balance || 0).toLocaleString()}</p>
                  <p><span className="font-medium">Joined:</span> {new Date(selectedRetailer.created_at).toLocaleDateString()}</p>
                  <p><span className="font-medium">Last Updated:</span> {new Date(selectedRetailer.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
