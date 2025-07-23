'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function EmployeeFreeServicesPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [freeServices, setFreeServices] = useState<FreeService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === UserRole.EMPLOYEE) {
      fetchFreeServices();
    }
  }, [session]);

  const fetchFreeServices = async () => {
    try {
      setServicesLoading(true);
      const response = await fetch('/api/employee/free-services');
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

  if (session.user.role !== UserRole.EMPLOYEE) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only employees can access this page.</p>
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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Free Services & External Links</h1>
          <p className="text-blue-100">
            Access free government information services and external resources for customer assistance.
          </p>
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span>💡 Help customers access these free services and external resources!</span>
              <span className="text-xl font-bold">Employee Access</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-blue-600" />
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {service.category}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">
                      {service.external_url ? 'EXTERNAL' : 'FREE'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {service.description}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAccessService(service)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!service.external_url}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Access Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No free services are currently available.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">🔗 About Free Services & External Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🆓</div>
                <h4 className="font-medium text-blue-900 mb-1">Free Access</h4>
                <p className="text-blue-700">Help customers access free government services</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔗</div>
                <h4 className="font-medium text-blue-900 mb-1">External Resources</h4>
                <p className="text-blue-700">Direct links to official government portals</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">👥</div>
                <h4 className="font-medium text-blue-900 mb-1">Customer Support</h4>
                <p className="text-blue-700">Assist customers with service access and information</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
