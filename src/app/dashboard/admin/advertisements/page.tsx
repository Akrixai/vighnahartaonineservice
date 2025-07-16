'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { UserRole } from '@/types';

interface LoginAdvertisement {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdvertisementsPage() {
  const { data: session } = useSession();
  const [advertisements, setAdvertisements] = useState<LoginAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    display_order: 0,
    is_active: true
  });

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch('/api/login-advertisements');
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.advertisements || []);
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      showToast.error('Failed to load advertisements', {
        description: 'Please refresh the page or contact support.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchAdvertisements();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image_url) {
      showToast.warning('Missing required fields', {
        description: 'Please provide both title and image URL.'
      });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;
      
      const response = await fetch('/api/login-advertisements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showToast.success(
          editingId ? 'Advertisement updated!' : 'Advertisement created!',
          { description: 'Changes will be visible immediately on the login page.' }
        );
        setFormData({
          title: '',
          description: '',
          image_url: '',
          link_url: '',
          display_order: 0,
          is_active: true
        });
        setEditingId(null);
        setShowAddForm(false);
        fetchAdvertisements();
      } else {
        throw new Error('Failed to save advertisement');
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      showToast.error('Failed to save advertisement', {
        description: 'Please check your input and try again.'
      });
    }
  };

  const handleEdit = (ad: LoginAdvertisement) => {
    setFormData({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      link_url: ad.link_url,
      display_order: ad.display_order,
      is_active: ad.is_active
    });
    setEditingId(ad.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    // Use custom toast confirmation instead of browser confirm
    showToast.custom('Delete advertisement?', 'warning', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          await performDelete(id);
        }
      }
    });
  };

  const performDelete = async (id: string) => {

    try {
      const response = await fetch(`/api/login-advertisements?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast.success('Advertisement deleted!', {
          description: 'The advertisement has been removed from the login page.'
        });
        fetchAdvertisements();
      } else {
        throw new Error('Failed to delete advertisement');
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      showToast.error('Failed to delete advertisement', {
        description: 'Please try again or contact support.'
      });
    }
  };

  const toggleActive = async (ad: LoginAdvertisement) => {
    try {
      const response = await fetch('/api/login-advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ad,
          is_active: !ad.is_active
        })
      });

      if (response.ok) {
        showToast.success(
          `Advertisement ${!ad.is_active ? 'activated' : 'deactivated'}!`,
          { description: 'Changes are now live on the login page.' }
        );
        fetchAdvertisements();
      } else {
        throw new Error('Failed to update advertisement');
      }
    } catch (error) {
      console.error('Error updating advertisement:', error);
      showToast.error('Failed to update advertisement', {
        description: 'Please try again or contact support.'
      });
    }
  };

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can manage advertisements.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            📢 Login Page Advertisements
          </h1>
          <p className="text-blue-100 text-xl">
            Manage advertisements displayed on the login page
          </p>
        </div>

        {/* Add New Advertisement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Manage Advertisements</span>
              <Button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    description: '',
                    image_url: '',
                    link_url: '',
                    display_order: 0,
                    is_active: true
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </CardTitle>
          </CardHeader>
          
          {showAddForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Advertisement title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL *</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Advertisement description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link_url">Link URL</Label>
                    <Input
                      id="link_url"
                      value={formData.link_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://example.com or /dashboard/page"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Advertisements List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advertisements.map((ad) => (
            <Card key={ad.id} className={`${ad.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-500">Order: {ad.display_order}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
                  }}
                />
                <h3 className="font-semibold text-lg">{ad.title}</h3>
                {ad.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{ad.description}</p>
                )}
                {ad.link_url && (
                  <p className="text-xs text-blue-600 truncate">{ad.link_url}</p>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(ad)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(ad)}
                  >
                    {ad.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ad.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {advertisements.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-semibold mb-2">No Advertisements</h3>
              <p className="text-gray-600 mb-4">Create your first login page advertisement</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Advertisement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
