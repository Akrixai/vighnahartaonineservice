'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeServices } from '@/hooks/useRealTimeData';
import { formatCurrency } from '@/lib/utils';
import ServiceApplicationForm from '@/components/ServiceApplicationForm';

export default function ServicesPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Always call hooks before any early returns
  const { data: services, loading, error, refresh } = useRealTimeServices(true);

  // Check retailer access after hooks
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'ALL' || service.category === selectedCategory;
    const matchesType = selectedType === 'ALL' ||
      (selectedType === 'FREE' && service.is_free) ||
      (selectedType === 'PAID' && !service.is_free);
    const matchesSearch = searchTerm === '' ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesType && matchesSearch;
  });

  const categories = [...new Set(services.map(service => service.category).filter(Boolean))];

  const handleApplyService = (service: any) => {
    setSelectedService(service);
    setShowApplicationForm(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Government Services</h1>
          <p className="text-red-100 text-xl">
            Apply for government services and schemes through our platform
          </p>
          <div className="mt-4 flex items-center gap-4 text-red-100">
            <span>🏛️ {services.length} Services Available</span>
            <span>•</span>
            <span>🎯 Real-time Updates</span>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Services</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="FREE">Free Services</option>
                  <option value="PAID">Paid Services</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={refresh}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Services</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'ALL' || selectedType !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'No services are available yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Government Services */}
            {(() => {
              const governmentServices = filteredServices.filter(service =>
                service.category === 'government' || service.category === 'identity_documents' ||
                service.category === 'certificates' || service.category === 'educational' ||
                service.name.toLowerCase().includes('aadhaar') || service.name.toLowerCase().includes('pan')
              );

              return governmentServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏛️ Government Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Special Aadhaar Verification Service */}
                    <Card className="hover:shadow-lg transition-shadow border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-red-800 flex items-center">
                              🆔 Aadhaar Verification
                            </CardTitle>
                            <CardDescription className="text-red-600">Government Identity Service</CardDescription>
                          </div>
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                            FREE/PAID
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-red-700 mb-4">
                          Apply for new Aadhaar card, update existing details, or link mobile number.
                          Fast processing with document verification.
                        </p>

                        <div className="space-y-2 mb-4 text-xs text-red-600">
                          <div className="flex justify-between">
                            <span>New Aadhaar:</span>
                            <span className="font-medium">FREE</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Updates:</span>
                            <span className="font-medium">₹50</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mobile Linking:</span>
                            <span className="font-medium">₹25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Time:</span>
                            <span className="font-medium">7-15 days</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => window.location.href = '/dashboard/services/aadhaar-verification'}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          📝 Apply Now
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Other Government Services */}
                    {governmentServices.map((service) => (
                      <Card key={service.id} className="hover:shadow-lg transition-shadow border border-red-200">
                        {/* Service Image */}
                        {service.image_url && (
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                            <img
                              src={service.image_url}
                              alt={service.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${
                                service.is_free ? 'bg-green-100/90 text-green-600' : 'bg-blue-100/90 text-blue-600'
                              }`}>
                                {service.is_free ? 'FREE' : formatCurrency(service.price)}
                              </div>
                            </div>
                          </div>
                        )}
                        <CardHeader className={service.image_url ? 'pb-2' : ''}>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
                              <CardDescription>{service.category}</CardDescription>
                            </div>
                            {!service.image_url && (
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                service.is_free ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {service.is_free ? 'FREE' : formatCurrency(service.price)}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {service.description}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Processing Time:</span>
                              <span className="font-medium">{service.processing_time_days} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Commission:</span>
                              <span className="font-medium">{service.commission_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Documents:</span>
                              <span className="font-medium">{service.documents?.length || 0} required</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleApplyService(service)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            📝 Apply Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Other Services */}
            {(() => {
              const otherServices = filteredServices.filter(service =>
                !['government', 'identity_documents', 'certificates', 'educational'].includes(service.category) &&
                !service.name.toLowerCase().includes('aadhaar') && !service.name.toLowerCase().includes('pan')
              );

              return otherServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Other Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherServices.map((service) => (
                      <Card key={service.id} className="hover:shadow-lg transition-shadow">
                        {/* Service Image */}
                        {service.image_url && (
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                            <img
                              src={service.image_url}
                              alt={service.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${
                                service.is_free ? 'bg-green-100/90 text-green-600' : 'bg-blue-100/90 text-blue-600'
                              }`}>
                                {service.is_free ? 'FREE' : formatCurrency(service.price)}
                              </div>
                            </div>
                          </div>
                        )}
                        <CardHeader className={service.image_url ? 'pb-2' : ''}>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
                              <CardDescription>{service.category}</CardDescription>
                            </div>
                            {!service.image_url && (
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                service.is_free ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {service.is_free ? 'FREE' : formatCurrency(service.price)}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {service.description}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Processing Time:</span>
                              <span className="font-medium">{service.processing_time_days} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Commission:</span>
                              <span className="font-medium">{service.commission_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Documents:</span>
                              <span className="font-medium">{service.documents?.length || 0} required</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleApplyService(service)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            📝 Apply Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Application Form Modal */}
        <ServiceApplicationForm
          service={selectedService}
          isOpen={showApplicationForm}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setShowApplicationForm(false);
            setSelectedService(null);
            refresh(); // Refresh services list
          }}
        />
      </div>
    </DashboardLayout>
  );
}
