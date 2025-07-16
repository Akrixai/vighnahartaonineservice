'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { useRealTimeAdvertisements } from '@/hooks/useRealTimeData';
import { Upload, Image as ImageIcon, Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react';

export default function AdminAdsPage() {
  const { data: session } = useSession();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    position: 'header',
    start_date: '',
    end_date: ''
  });

  // Use real-time data hook
  const { data: ads, loading, refresh } = useRealTimeAdvertisements(
    undefined, // Get all advertisements
    session?.user?.role === UserRole.ADMIN
  );

  // Check admin access - moved after all hooks
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'advertisements');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const submitData = {
        ...formData,
        image_url: imageUrl
      };

      const url = editingAd ? `/api/admin/advertisements/${editingAd.id}` : '/api/admin/advertisements';
      const method = editingAd ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        refresh(); // Use the refresh function from the hook
        resetForm();
        showToast.success(editingAd ? 'Advertisement updated successfully!' : 'Advertisement added successfully!');
      } else {
        const errorData = await response.json();
        showToast.error('Failed to save advertisement', {
          description: errorData.error || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      showToast.error('Error saving advertisement', {
        description: 'Please try again.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      position: ad.position,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : ''
    });
    setImagePreview(ad.image_url || '');
    setSelectedImage(null);
    setShowAddForm(true);
  };

  const handleDelete = async (adId: string) => {
    // Use custom toast confirmation instead of browser confirm
    showToast.custom('Delete advertisement?', 'warning', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          await performDelete(adId);
        }
      }
    });
  };

  const performDelete = async (adId: string) => {

    try {
      const response = await fetch(`/api/admin/advertisements/${adId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refresh(); // Use the refresh function from the hook
        showToast.success('Advertisement deleted successfully!');
      } else {
        showToast.error('Failed to delete advertisement');
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      showToast.error('Error deleting advertisement');
    }
  };

  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/advertisements/${adId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        refresh(); // Use the refresh function from the hook
        showToast.success(`Advertisement ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error updating advertisement status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      position: 'header',
      start_date: '',
      end_date: ''
    });
    setEditingAd(null);
    setShowAddForm(false);
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'header': return 'bg-blue-100 text-blue-600';
      case 'dashboard': return 'bg-orange-100 text-orange-600';
      case 'sidebar': return 'bg-green-100 text-green-600';
      case 'footer': return 'bg-purple-100 text-purple-600';
      case 'popup': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const isAdActive = (ad: any) => {
    if (!ad.is_active) return false;
    
    const now = new Date();
    const startDate = new Date(ad.start_date);
    const endDate = ad.end_date ? new Date(ad.end_date) : null;
    
    return now >= startDate && (!endDate || now <= endDate);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Advertisement Management</h1>
          <p className="text-red-100 text-xl">
            Manage website advertisements and promotional content
          </p>
        </div>

        {/* Add Ad Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-800">Advertisements ({ads.length})</h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Advertisement'}
          </Button>
        </div>

        {/* Add/Edit Ad Form */}
        {showAddForm && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">
                {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-700 mb-2">Advertisement Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter advertisement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Position *</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="header">Header</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="footer">Footer</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Advertisement Image *</label>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    </div>

                    {/* Image Preview */}
                    {(imagePreview || formData.image_url) && (
                      <div className="relative">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedImage(null);
                            setFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}


                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Link URL</label>
                  <input
                    type="url"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter advertisement description"
                  />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    {formLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingAd ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingAd ? '💾 Update Advertisement' : '➕ Add Advertisement'
                    )}
                  </Button>
                  <Button type="button" onClick={resetForm} variant="outline">
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Ads List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading advertisements...</p>
            </CardContent>
          </Card>
        ) : ads.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No advertisements found</h3>
              <p className="text-gray-600">Add your first advertisement to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Card key={ad.id} className={`hover:shadow-lg transition-shadow ${!isAdActive(ad) ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
                      <CardDescription>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(ad.position)}`}>
                          {ad.position.charAt(0).toUpperCase() + ad.position.slice(1)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isAdActive(ad) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {isAdActive(ad) ? 'Live' : 'Inactive'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ad.image_url && (
                    <img 
                      src={ad.image_url} 
                      alt={ad.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  )}
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {ad.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Clicks:</span>
                      <span className="font-medium">{ad.click_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Start:</span>
                      <span className="text-sm">{formatDateTime(ad.start_date).split(' ')[0]}</span>
                    </div>
                    {ad.end_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">End:</span>
                        <span className="text-sm">{formatDateTime(ad.end_date).split(' ')[0]}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(ad)}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                      size="sm"
                      className={`flex-1 ${ad.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    >
                      {ad.is_active ? '⏸️ Hide' : '▶️ Show'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(ad.id)}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      🗑️
                    </Button>
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
