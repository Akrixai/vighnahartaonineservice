'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';

export default function ServiceApplicationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isReapply, setIsReapply] = useState(false);
  const [reapplyData, setReapplyData] = useState<any>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    purpose: '',
    remarks: '',
    service_specific_data: {} as Record<string, any>
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({});

  // Check for reapply data on component mount
  useEffect(() => {
    const reapplyDataStr = sessionStorage.getItem('reapplyData');
    if (reapplyDataStr) {
      try {
        const data = JSON.parse(reapplyDataStr);
        if (data.schemeId === serviceId && data.isReapply) {
          setIsReapply(true);
          setReapplyData(data);
          
          // Prefill form data
          setFormData({
            customer_name: data.customerData.name || '',
            customer_phone: data.customerData.phone || '',
            customer_email: data.customerData.email || '',
            customer_address: data.customerData.address || '',
            purpose: data.formData?.purpose || '',
            remarks: data.formData?.remarks || '',
            service_specific_data: data.formData?.service_specific_data || {}
          });

          // Clear the session storage
          sessionStorage.removeItem('reapplyData');
          
          showToast.info('Reapplication Form', {
            description: 'Your previous data has been prefilled. No charges will apply for reapplication.'
          });
        }
      } catch (error) {
        console.error('Error parsing reapply data:', error);
      }
    }
  }, [serviceId]);

  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/schemes/${serviceId}`);
        if (response.ok) {
          const result = await response.json();
          setService(result.scheme);
        } else {
          showToast.error('Service not found');
          router.push('/dashboard/services');
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        showToast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId, router]);

  // Check retailer access
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!service) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h1>
          <p className="text-gray-600">The requested service could not be found.</p>
          <Button onClick={() => router.push('/dashboard/services')} className="mt-4">
            Back to Services
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceSpecificChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      service_specific_data: {
        ...prev.service_specific_data,
        [`dynamic_${fieldId}`]: value
      }
    }));
  };

  const handleFileUpload = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', file);
      formDataForUpload.append('folder', 'applications');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataForUpload,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.url) {
            uploadedUrls.push(result.url);
          }
        } else {
          showToast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        showToast.error('Failed to upload file');
      }
    }

    if (uploadedUrls.length > 0) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), ...uploadedUrls]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate required fields
    if (!formData.customer_name.trim()) {
      showToast.error('Customer name is required');
      setSubmitting(false);
      return;
    }

    if (!formData.customer_phone || formData.customer_phone.length !== 10) {
      showToast.error('Phone number must be exactly 10 digits');
      setSubmitting(false);
      return;
    }

    if (!formData.customer_address.trim()) {
      showToast.error('Customer address is required');
      setSubmitting(false);
      return;
    }

    try {
      // Upload regular documents if any
      let documentUrls: string[] = [];
      if (documents.length > 0) {
        for (const file of documents) {
          const formDataForUpload = new FormData();
          formDataForUpload.append('file', file);
          formDataForUpload.append('folder', 'applications');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataForUpload,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            if (uploadResult.success && uploadResult.url) {
              documentUrls.push(uploadResult.url);
            }
          }
        }
      }

      const applicationData = {
        scheme_id: serviceId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        customer_address: formData.customer_address,
        form_data: {
          purpose: formData.purpose,
          remarks: formData.remarks,
          service_specific_data: formData.service_specific_data
        },
        documents: documentUrls,
        dynamic_field_documents: uploadedFiles,
        amount: isReapply ? 0 : (service.is_free ? 0 : service.price), // Free for reapplications
        is_reapply: isReapply,
        original_application_id: reapplyData?.originalApplicationId
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        showToast.success(
          isReapply 
            ? 'Reapplication submitted successfully!' 
            : 'Application submitted successfully!'
        );
        router.push('/dashboard/applications');
      } else {
        const error = await response.json();
        showToast.error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      showToast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const servicePrice = isReapply ? 0 : (service.is_free ? 0 : service.price);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/services')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isReapply ? 'Reapply for' : 'Apply for'} {service.name}
              </h1>
              <p className="text-gray-600">{service.description}</p>
            </div>
          </div>
        </div>

        {/* Reapply Notice */}
        {isReapply && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-blue-800 font-medium">
                  This is a reapplication. No charges will apply for this submission.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Info */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{service.category}</span>
              </div>
              <div>
                <span className="text-gray-500">Price:</span>
                <span className="ml-2 font-medium">
                  {servicePrice === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatCurrency(servicePrice)
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Processing Time:</span>
                <span className="ml-2 font-medium">{service.processing_time_days} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Application Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <Input
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Textarea
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter complete address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <Textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="Purpose of application"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <Textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Any additional remarks"
                    rows={3}
                  />
                </div>
              </div>

              {/* Dynamic Fields */}
              {service.dynamic_fields && service.dynamic_fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Service Specific Information</h3>
                  {service.dynamic_fields.map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && '*'}
                      </label>

                      {field.type === 'text' && (
                        <Input
                          value={formData.service_specific_data[`dynamic_${field.id}`] || ''}
                          onChange={(e) => handleServiceSpecificChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <Textarea
                          value={formData.service_specific_data[`dynamic_${field.id}`] || ''}
                          onChange={(e) => handleServiceSpecificChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={3}
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={formData.service_specific_data[`dynamic_${field.id}`] || ''}
                          onChange={(e) => handleServiceSpecificChange(field.id, e.target.value)}
                          required={field.required}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select an option</option>
                          {field.options?.map((option: string, index: number) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                      )}

                      {(field.type === 'file' || field.type === 'image' || field.type === 'pdf') && (
                        <div>
                          <div className="mb-2 text-sm text-gray-600">
                            Upload {field.type === 'image' ? 'Image' : field.type === 'pdf' ? 'PDF Document' : 'File'} for: <strong>{field.label}</strong>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept={field.type === 'image' ? 'image/*' : field.type === 'pdf' ? '.pdf' : '*'}
                            onChange={(e) => handleFileUpload(field.id, e.target.files)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            {field.type === 'image' && 'Accepted formats: JPG, PNG, GIF'}
                            {field.type === 'pdf' && 'Accepted format: PDF only'}
                            {field.type === 'file' && 'All file formats accepted'}
                          </div>
                          {uploadedFiles[field.id] && uploadedFiles[field.id].length > 0 && (
                            <div className="mt-2 space-y-1">
                              {uploadedFiles[field.id].map((url, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm text-green-600">
                                  <FileText className="w-4 h-4" />
                                  <span>File {index + 1} uploaded successfully</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Regular Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Documents
                </label>
                <div className="mb-2 text-sm text-gray-600">
                  Upload any additional supporting documents (optional)
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-1 text-xs text-gray-500">
                  All file formats accepted. You can select multiple files.
                </div>
                {documents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/services')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? 'Submitting...' : (isReapply ? 'Submit Reapplication' : 'Submit Application')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
