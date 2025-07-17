'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { ExternalLink, Globe, Search } from 'lucide-react';

interface FreeService {
  id: string;
  name: string;
  description: string;
  category: string;
  external_url: string;
  is_active: boolean;
}

export default function FreeServicesPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [freeServices, setFreeServices] = useState<FreeService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === UserRole.RETAILER) {
      fetchFreeServices();
    }
  }, [session]);

  const fetchFreeServices = async () => {
    try {
      setServicesLoading(true);
      const response = await fetch('/api/free-services');
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

  if (!session) {
    return null; // Middleware will redirect
  }

  if (servicesLoading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading free services..." />
      </DashboardLayout>
    );
  }

  const activeServices = freeServices?.filter(service => service.is_active) || [];
  const categories = ['All', ...Array.from(new Set(activeServices.map(service => service.category)))];

  const filteredServices = activeServices.filter(service => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAccessService = async (service: FreeService) => {
    if (service.external_url) {
      // Track usage before redirecting
      try {
        await fetch('/api/free-services/track-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: service.id,
            service_name: service.name,
            external_url: service.external_url
          }),
        });
      } catch (error) {
        console.error('Error tracking service usage:', error);
        // Continue with redirect even if tracking fails
      }

      // Open external URL in new tab
      window.open(service.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Free Services</h1>
          <p className="text-green-100">
            Access free government information services and check various document statuses.
          </p>
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span>💡 All services on this page are completely free!</span>
              <span className="text-xl font-bold">₹0.00</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search free services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-green-600" />
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {service.category}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      FREE
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {service.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <span>Redirects to external website</span>
                  </div>

                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-1">⚡</span>
                    Processing Time: Instant
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleAccessService(service)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Access Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No free services found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No free services are currently available'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">🆓 About Free Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">💰</div>
                <h4 className="font-medium text-green-900 mb-1">No Cost</h4>
                <p className="text-green-700">All services on this page are completely free</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-medium text-green-900 mb-1">Instant Access</h4>
                <p className="text-green-700">Get information and status updates immediately</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-medium text-green-900 mb-1">Secure</h4>
                <p className="text-green-700">Your information is protected and confidential</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
