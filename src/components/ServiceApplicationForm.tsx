'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { FileText, X } from 'lucide-react';

interface ServiceApplicationFormProps {
  service: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ServiceApplicationForm({ service, isOpen, onClose, onSuccess }: ServiceApplicationFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Special handling for phone number
    if (name === 'customer_phone') {
      // Remove all non-digits
      let cleanPhone = value.replace(/\D/g, '');

      // Remove leading zeros
      cleanPhone = cleanPhone.replace(/^0+/, '');

      // Limit to 10 digits
      if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(0, 10);
      }

      setFormData(prev => ({
        ...prev,
        [name]: cleanPhone
      }));
      return;
    }

    if (name.startsWith('dynamic_')) {
      setFormData(prev => ({
        ...prev,
        service_specific_data: {
          ...prev.service_specific_data,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDynamicFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string, fieldType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        // Upload the file to get actual URL
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
            setUploadedFiles(prev => ({
              ...prev,
              [fieldId]: [uploadResult.url]
            }));

            toast.success(`${file.name} uploaded successfully!`);
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
        } else {
          const errorData = await uploadResponse.json();
          toast.error(`Upload failed: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate phone number
    if (!formData.customer_phone || formData.customer_phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits long (without leading zeros)');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.customer_name.trim()) {
      toast.error('Customer name is required');
      setLoading(false);
      return;
    }

    if (!formData.customer_address.trim()) {
      toast.error('Customer address is required');
      setLoading(false);
      return;
    }

    try {
      // First upload documents if any
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
          } else {
            const errorData = await uploadResponse.json();
            console.error('Upload error:', errorData);
            toast.error(`Failed to upload ${file.name}: ${errorData.error}`);
            return; // Stop submission if upload fails
          }
        }
      }

      // Dynamic field documents are handled separately in dynamic_field_documents

      const applicationData = {
        scheme_id: service.id,
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
        amount: service.is_free ? 0 : service.price
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceSpecificFields = () => {
    if (!service || !service.dynamic_fields || service.dynamic_fields.length === 0) return [];

    return service.dynamic_fields.map((field: any) => {
      const fieldName = `dynamic_${field.id}`;
      const fieldValue = formData.service_specific_data[fieldName] || '';

      switch (field.type) {
        case 'text':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={field.required}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'textarea':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={field.required}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'number':
        case 'email':
        case 'tel':
        case 'date':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={field.type}
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={field.required}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'select':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                required={field.required}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options?.map((option: string, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'file':
        case 'image':
        case 'pdf':
          const getAcceptTypes = () => {
            if (field.accept) return field.accept;
            switch (field.type) {
              case 'image': return '.jpg,.jpeg,.png,.gif';
              case 'pdf': return '.pdf';
              default: return '*/*';
            }
          };

          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                <span className="text-xs text-gray-500 ml-2">
                  ({field.type === 'image' ? 'Image' : field.type === 'pdf' ? 'PDF' : 'File'})
                </span>
              </label>
              <input
                type="file"
                name={fieldName}
                onChange={(e) => handleDynamicFileChange(e, field.id, field.type)}
                required={field.required}
                accept={getAcceptTypes()}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {uploadedFiles[field.id] && uploadedFiles[field.id].length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <span>✅ File uploaded successfully!</span>
                    <a
                      href={uploadedFiles[field.id][0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View File
                    </a>
                  </div>
                </div>
              )}
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Accepted formats: {getAcceptTypes().replace(/\./g, '').toUpperCase()}
              </p>
            </div>
          );

        default:
          return null;
      }
    });
  };

  if (!service) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[95vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center border border-white border-opacity-30 shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                  {service.name}
                </h1>
                <p className="text-yellow-100 text-sm mt-1 font-medium">
                  {service.description || 'Apply for new service, update existing details, or submit required documents'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
          <div className="p-6">
            
            {/* Application Form Title */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {service.name} Application
                </h2>
                <p className="text-gray-600 mt-1">
                  Fill in all the required details and upload necessary documents
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Service Type Selection */}
              <div className="bg-white rounded-lg shadow-md border border-red-200 hover:shadow-lg transition-shadow duration-200">
                <div className="p-6 border-l-4 border-red-500">
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Service Type *
                  </label>
                  <select className="w-full p-3 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-yellow-50 text-red-700 font-medium">
                    <option value={service.name}>{service.name}</option>
                  </select>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="bg-white rounded-lg shadow-md border border-yellow-300 hover:shadow-lg transition-shadow duration-200">
                <div className="p-6 border-b border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                    <span className="text-yellow-600">👤</span>
                    Personal Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        placeholder="Enter full name as per documents"
                        required
                        className="w-full p-3 border border-red-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50 text-red-800 placeholder-red-400"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        placeholder="Enter 10-digit mobile number (without 0)"
                        required
                        maxLength={10}
                        className={`w-full p-3 border rounded-md focus:ring-2 bg-yellow-50 text-red-800 placeholder-red-400 ${
                          formData.customer_phone && formData.customer_phone.length !== 10
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-red-300 focus:ring-yellow-500 focus:border-yellow-500'
                        }`}
                      />
                      {formData.customer_phone && formData.customer_phone.length !== 10 && (
                        <p className="text-red-600 text-xs mt-1">
                          Phone number must be exactly 10 digits (currently {formData.customer_phone.length} digits)
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="customer_address"
                        value={formData.customer_address}
                        onChange={handleInputChange}
                        placeholder="Enter complete address"
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Additional Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose of Application
                    </label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder="Explain why you need this service"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Any additional information or special requests"
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    />
                  </div>
                </div>
              </div>



              {/* Service-specific fields */}
              {service.dynamic_fields && service.dynamic_fields.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-red-600">⚙️</span>
                      Service-Specific Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderServiceSpecificFields()}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Upload Section */}
              <div className="bg-white rounded-lg shadow-md border border-orange-300 hover:shadow-lg transition-shadow duration-200">
                <div className="p-6 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                    <span className="text-orange-600">📎</span>
                    Document Upload
                  </h3>
                  <p className="text-red-600 text-sm mt-1 font-medium">
                    Upload required documents for this service
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Documents
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-gray-400 mb-2">
                          <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-red-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG, DOC, DOCX (Max 5MB each)
                        </p>
                      </label>
                    </div>

                    {/* Display uploaded documents */}
                    {documents.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Uploaded Documents:
                        </h5>
                        <div className="space-y-2">
                          {documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <span className="text-green-600">📄</span>
                                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required documents list */}
                    {service.documents && service.documents.length > 0 && (
                      <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">
                          Required Documents Checklist:
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {service.documents.map((doc: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-blue-700 bg-white p-2 rounded border border-blue-200">
                              <span className="mr-2">📄</span>
                              {doc}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-red-600">💳</span>
                    Payment Summary
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Service Fee:</span>
                      <span className={`text-xl font-bold ${service.is_free ? 'text-green-600' : 'text-red-600'}`}>
                        {service.is_free ? 'FREE' : formatCurrency(service.price)}
                      </span>
                    </div>
                    {!service.is_free && (
                      <p className="text-xs text-gray-500 mt-2">
                        Amount will be deducted from your wallet upon submission
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium transition-all duration-200 hover:shadow-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 text-white rounded-md hover:from-red-700 hover:via-red-600 hover:to-yellow-600 font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:scale-105 transform"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
