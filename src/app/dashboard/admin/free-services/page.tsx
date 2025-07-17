'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { Plus, Edit, Trash2, ExternalLink, Globe } from 'lucide-react';

interface FreeService {
  id: string;
  name: string;
  description: string;
  category: string;
  external_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminFreeServicesPage() {
  const { data: session } = useSession();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<FreeService | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    external_url: ''
  });

  // Predefined categories for better organization
  const predefinedCategories = [
    'Information Services',
    'Educational Services',
    'Government Schemes',
    'Document Verification',
    'Financial Services',
    'Healthcare Services',
    'Employment Services',
    'Legal Services',
    'Social Welfare',
    'Other'
  ];

  const [freeServices, setFreeServices] = useState<FreeService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchFreeServices();
    }
  }, [session]);

  const fetchFreeServices = async () => {
    try {
      setServicesLoading(true);
      const response = await fetch('/api/admin/free-services');
      if (response.ok) {
        const data = await response.json();
        setFreeServices(data.freeServices || []);
      }
    } catch (error) {
      console.error('Error fetching free services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const refresh = () => {
    fetchFreeServices();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      external_url: ''
    });
    setEditingService(null);
    setShowAddForm(false);
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedServices.length === freeServices?.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(freeServices?.map(service => service.id) || []);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedServices.length === 0) return;

    setLoading(true);
    try {
      const promises = selectedServices.map(id =>
        fetch(`/api/admin/free-services/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true })
        })
      );

      await Promise.all(promises);
      fetchFreeServices();
      setSelectedServices([]);
    } catch (error) {
      console.error('Error bulk activating services:', error);
      alert('Failed to activate services');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedServices.length === 0) return;

    setLoading(true);
    try {
      const promises = selectedServices.map(id =>
        fetch(`/api/admin/free-services/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: false })
        })
      );

      await Promise.all(promises);
      fetchFreeServices();
      setSelectedServices([]);
    } catch (error) {
      console.error('Error bulk deactivating services:', error);
      alert('Failed to deactivate services');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedServices.length} selected services?`)) return;

    setLoading(true);
    try {
      const promises = selectedServices.map(id =>
        fetch(`/api/admin/free-services/${id}`, { method: 'DELETE' })
      );

      await Promise.all(promises);
      fetchFreeServices();
      setSelectedServices([]);
    } catch (error) {
      console.error('Error bulk deleting services:', error);
      alert('Failed to delete services');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: FreeService) => {
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      external_url: service.external_url
    });
    setEditingService(service);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingService 
        ? `/api/admin/free-services/${editingService.id}`
        : '/api/admin/free-services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          is_free: true,
          price: 0
        }),
      });

      if (response.ok) {
        resetForm();
        fetchFreeServices();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save free service');
      }
    } catch (error) {
      console.error('Error saving free service:', error);
      alert('Failed to save free service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this free service?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/free-services/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFreeServices();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete free service');
      }
    } catch (error) {
      console.error('Error deleting free service:', error);
      alert('Failed to delete free service');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/free-services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      if (response.ok) {
        fetchFreeServices();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update service status');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Failed to update service status');
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (servicesLoading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading free services..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <Globe className="w-10 h-10 mr-3" />
            Free Services Management
          </h1>
          <p className="text-green-100 text-xl">
            Manage free services that redirect to external websites
          </p>
        </div>

        {/* Header with Bulk Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-green-800">
              Free Services ({freeServices?.length || 0})
            </h2>
            {selectedServices.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedServices.length} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkActivate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDeactivate}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={loading}
                >
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            {showAddForm ? '❌ Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Free Service</>}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">
                {editingService ? 'Edit Free Service' : 'Add New Free Service'}
              </CardTitle>
              <CardDescription>
                Free services redirect users to external websites when they click "Access Now"
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Aadhaar Card Information"
                      required
                      className="border-green-300 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select a category</option>
                      {predefinedCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External URL *
                  </label>
                  <Input
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    placeholder="https://example.com/service"
                    required
                    className="border-green-300 focus:border-green-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Users will be redirected to this URL when they click "Access Now"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the service..."
                    required
                    rows={3}
                    className="border-green-300 focus:border-green-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Select All Checkbox */}
        {freeServices && freeServices.length > 0 && (
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={selectedServices.length === freeServices.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label className="text-sm text-gray-700">
              Select All ({freeServices.length} services)
            </label>
          </div>
        )}

        {/* Services List */}
        <div className="grid gap-6">
          {freeServices?.map((service) => (
            <Card key={service.id} className="border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleSelectService(service.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                    />
                    <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-green-800">{service.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{service.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {service.category}
                      </span>
                      <div className="flex items-center">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        <a 
                          href={service.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {service.external_url}
                        </a>
                      </div>
                    </div>
                  </div>

                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(service.id, service.is_active)}
                      disabled={loading}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      {service.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      disabled={loading}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      disabled={loading}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!freeServices || freeServices.length === 0) && (
            <Card className="border-green-200">
              <CardContent className="p-12 text-center">
                <Globe className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Free Services</h3>
                <p className="text-gray-500 mb-4">
                  Start by adding your first free service that redirects to external websites.
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Free Service
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
