'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { supabaseClient } from '@/lib/supabase';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    employee_id?: string;
    department?: string;
    branch?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
    employee_id: '',
    department: '',
    branch: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('role', filter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription for users table
    const channel = supabaseClient
      .channel('users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('Real-time user change:', payload);
          // Refresh users list when any change occurs
          fetchUsers();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [filter]);

  // Check admin access - moved before all hooks
  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const userData = { ...formData };
      if (editingUser && !userData.password) {
        delete userData.password; // Don't update password if not provided
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        await fetchUsers();
        resetForm();
        showToast.success(editingUser ? 'User updated successfully!' : 'User added successfully!');
      } else {
        const errorData = await response.json();
        showToast.error(errorData.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showToast.error('Error saving user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // Don't pre-fill password
      role: user.role,
      employee_id: user.employee_id || '',
      department: user.department || '',
      branch: user.branch || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || ''
    });
    setShowAddForm(true);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        await fetchUsers();
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'EMPLOYEE',
      employee_id: '',
      department: '',
      branch: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-600';
      case 'EMPLOYEE': return 'bg-blue-100 text-blue-600';
      case 'RETAILER': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Users' },
    { value: 'ADMIN', label: 'Administrators' },
    { value: 'EMPLOYEE', label: 'Employees' },
    { value: 'RETAILER', label: 'Retailers' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">User Management</h1>
          <p className="text-red-100 text-xl">
            Manage system users, employees, and retailers
          </p>
        </div>

        {/* Filter Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === option.value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600">Total: {users.length} users</span>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {showAddForm ? '❌ Cancel' : '➕ Add User'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit User Form */}
        {showAddForm && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="RETAILER">Retailer</option>
                  </select>
                </div>

                {(formData.role === 'EMPLOYEE' || formData.role === 'ADMIN') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">Employee ID</label>
                      <input
                        type="text"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter employee ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter department"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">Branch</label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter branch"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'RETAILER' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-red-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter state"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">PIN Code</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        pattern="[0-9]{6}"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter 6-digit PIN code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">Branch</label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter branch"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                    {editingUser ? '💾 Update User' : '➕ Add User'}
                  </Button>
                  <Button type="button" onClick={resetForm} variant="outline">
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {filter !== 'ALL' 
                  ? `No ${filter.toLowerCase()}s found.`
                  : 'Add your first user to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* User Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {(user.role === 'EMPLOYEE' || user.role === 'ADMIN') && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {user.employee_id && (
                            <div>
                              <span className="text-gray-500">Employee ID:</span>
                              <span className="ml-2 font-medium">{user.employee_id}</span>
                            </div>
                          )}
                          {user.department && (
                            <div>
                              <span className="text-gray-500">Department:</span>
                              <span className="ml-2 font-medium">{user.department}</span>
                            </div>
                          )}
                          {user.branch && (
                            <div>
                              <span className="text-gray-500">Branch:</span>
                              <span className="ml-2 font-medium">{user.branch}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {user.role === 'RETAILER' && (user.address || user.branch) && (
                        <div className="text-sm space-y-1">
                          {user.address && (
                            <div>
                              <span className="text-gray-500">Address:</span>
                              <span className="ml-2">{user.address}</span>
                              {user.city && <span>, {user.city}</span>}
                              {user.state && <span>, {user.state}</span>}
                              {user.pincode && <span> - {user.pincode}</span>}
                            </div>
                          )}
                          {user.branch && (
                            <div>
                              <span className="text-gray-500">Branch:</span>
                              <span className="ml-2 font-medium">{user.branch}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Account Info</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="ml-2">{formatDateTime(user.created_at).split(' ')[0]}</span>
                        </div>
                        {user.wallet && (
                          <div>
                            <span className="text-gray-500">Wallet:</span>
                            <span className="ml-2 font-medium">₹{user.wallet.balance || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => handleEdit(user)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`${user.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      >
                        {user.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
