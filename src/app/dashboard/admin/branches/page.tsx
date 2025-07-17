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
import { Building, Plus, Edit, Trash2, MapPin, Phone, Mail, User } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BranchManagementPage() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager_name: ''
  });

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchBranches();
    }
  }, [session]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      manager_name: ''
    });
    setEditingBranch(null);
    setShowAddForm(false);
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_name: branch.manager_name || ''
    });
    setEditingBranch(branch);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingBranch 
        ? `/api/admin/branches/${editingBranch.id}`
        : '/api/admin/branches';
      
      const method = editingBranch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchBranches();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save branch');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/branches/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBranches();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/branches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      if (response.ok) {
        fetchBranches();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update branch status');
      }
    } catch (error) {
      console.error('Error updating branch status:', error);
      alert('Failed to update branch status');
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

  if (loading && branches.length === 0) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading branches..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <Building className="w-10 h-10 mr-3" />
            Branch Management
          </h1>
          <p className="text-orange-100 text-xl">
            Manage organizational branches and locations
          </p>
        </div>

        {/* Add Branch Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-800">
            Branches ({branches.length})
          </h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            disabled={loading}
          >
            {showAddForm ? '❌ Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Branch</>}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="text-orange-800">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </CardTitle>
              <CardDescription>
                {editingBranch ? 'Update branch information' : 'Create a new organizational branch'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Mumbai Branch"
                      required
                      className="border-orange-300 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Code *
                    </label>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., MUM"
                      required
                      maxLength={10}
                      className="border-orange-300 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Branch address..."
                    rows={3}
                    className="border-orange-300 focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Branch phone number"
                      className="border-orange-300 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="branch@company.com"
                      className="border-orange-300 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Name
                  </label>
                  <Input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="Branch manager name"
                    className="border-orange-300 focus:border-orange-500"
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
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Branches List */}
        <div className="grid gap-6">
          {branches.map((branch) => (
            <Card key={branch.id} className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-orange-800">{branch.name}</h3>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                        {branch.code}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        branch.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      {branch.address && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{branch.address}</span>
                        </div>
                      )}
                      {branch.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{branch.phone}</span>
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{branch.email}</span>
                        </div>
                      )}
                      {branch.manager_name && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{branch.manager_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(branch.id, branch.is_active)}
                      disabled={loading}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      {branch.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(branch)}
                      disabled={loading}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(branch.id)}
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

          {branches.length === 0 && (
            <Card className="border-orange-200">
              <CardContent className="p-12 text-center">
                <Building className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Branches</h3>
                <p className="text-gray-500 mb-4">
                  Start by adding your first organizational branch.
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Branch
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
