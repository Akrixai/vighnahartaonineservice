'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { Award, Search, Filter, Download, Eye, Calendar, Building, User, MapPin, FileSpreadsheet, Users, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Certificate {
  id: string;
  user_id: string;
  name: string;
  employee_id?: string;
  department?: string;
  branch: string;
  certificate_number: string;
  issue_date: string;
  company_name: string;
  digital_signature: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  type: 'employee' | 'retailer';
}

export default function AdminCertificatesPage() {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'employee' | 'retailer'>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchCertificates();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [certificates, searchTerm, filterType]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      
      // Fetch employee certificates
      const employeeResponse = await fetch('/api/admin/employee-certificates');
      const employeeData = await employeeResponse.json();
      
      // Fetch retailer certificates
      const retailerResponse = await fetch('/api/admin/retailer-certificates');
      const retailerData = await retailerResponse.json();

      const allCertificates: Certificate[] = [
        ...(employeeData.certificates || []).map((cert: any) => ({
          ...cert,
          name: cert.employee_name,
          type: 'employee' as const
        })),
        ...(retailerData.certificates || []).map((cert: any) => ({
          ...cert,
          name: cert.retailer_name,
          type: 'retailer' as const
        }))
      ];

      setCertificates(allCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = certificates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(cert => cert.type === filterType);
    }

    setFilteredCertificates(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredCertificates.map(cert => ({
      'Certificate Number': cert.certificate_number,
      'Name': cert.name,
      'Type': cert.type.charAt(0).toUpperCase() + cert.type.slice(1),
      'Employee ID': cert.employee_id || 'N/A',
      'Department': cert.department || 'N/A',
      'Branch': cert.branch || 'N/A',
      'Issue Date': cert.issue_date,
      'Company': cert.company_name,
      'Status': cert.is_active ? 'Active' : 'Inactive',
      'Created At': new Date(cert.created_at).toLocaleDateString('en-GB')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Certificates');
    XLSX.writeFile(wb, `certificates_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only administrators can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading certificates..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <Award className="w-10 h-10 mr-3" />
            Certificate Management
          </h1>
          <p className="text-blue-100 text-xl">
            Manage employee and retailer certificates
          </p>
          <div className="mt-4 flex items-center gap-4 text-blue-100">
            <span>📊 {certificates.length} Total Certificates</span>
            <span>•</span>
            <span>👥 {certificates.filter(c => c.type === 'employee').length} Employee</span>
            <span>•</span>
            <span>🏪 {certificates.filter(c => c.type === 'retailer').length} Retailer</span>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, certificate number, branch, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="employee">Employee Only</option>
                  <option value="retailer">Retailer Only</option>
                </select>
              </div>

              <Button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={filteredCertificates.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredCertificates.length} of {certificates.length} certificates
            </div>
          </CardContent>
        </Card>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No certificates found</h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'No certificates have been generated yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredCertificates.map((certificate) => (
              <Card key={certificate.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          certificate.type === 'employee' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {certificate.type === 'employee' ? (
                            <UserCheck className={`w-6 h-6 ${certificate.type === 'employee' ? 'text-blue-600' : 'text-green-600'}`} />
                          ) : (
                            <Users className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{certificate.name}</h3>
                          <p className="text-sm text-gray-600 capitalize flex items-center">
                            {certificate.type === 'employee' ? (
                              <UserCheck className="w-4 h-4 mr-1" />
                            ) : (
                              <Users className="w-4 h-4 mr-1" />
                            )}
                            {certificate.type} Certificate
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          certificate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {certificate.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="text-xs text-gray-500">Certificate Number</div>
                            <div className="text-sm font-medium text-gray-900">{certificate.certificate_number}</div>
                          </div>
                        </div>
                        
                        {certificate.employee_id && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="text-xs text-gray-500">Employee ID</div>
                              <div className="text-sm font-medium text-gray-900">{certificate.employee_id}</div>
                            </div>
                          </div>
                        )}
                        
                        {certificate.department && (
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="text-xs text-gray-500">Department</div>
                              <div className="text-sm font-medium text-gray-900">{certificate.department}</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="text-xs text-gray-500">Branch</div>
                            <div className="text-sm font-medium text-gray-900">{certificate.branch || 'Not specified'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="text-xs text-gray-500">Issue Date</div>
                            <div className="text-sm font-medium text-gray-900">{certificate.issue_date}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCertificate(certificate)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Certificate View Modal */}
        {showCertificateModal && selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Certificate Preview</h2>
                  <button
                    onClick={() => {
                      setShowCertificateModal(false);
                      setSelectedCertificate(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Certificate Display */}
                <div className="max-w-3xl mx-auto">
                  <div className="border-4 border-red-600 rounded-lg p-8 bg-white shadow-lg">
                    {/* Certificate Header */}
                    <div className="text-center mb-8">
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                          <Award className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <h1 className="text-4xl font-bold text-red-600 mb-2">
                        {selectedCertificate.company_name}
                      </h1>
                      <div className="w-32 h-1 bg-red-600 mx-auto mb-4"></div>
                      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                        {selectedCertificate.type.toUpperCase()} AUTHORIZATION CERTIFICATE
                      </h2>
                      <p className="text-gray-600">
                        This certificate authorizes the bearer to operate as an official {selectedCertificate.type}
                      </p>
                    </div>

                    {/* Certificate Body */}
                    <div className="space-y-8">
                      {/* Certificate Details */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-red-600 mr-3" />
                              <div>
                                <div className="text-sm text-gray-600">{selectedCertificate.type === 'employee' ? 'Employee Name' : 'Retailer Name'}</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {selectedCertificate.name}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Building className="w-5 h-5 text-red-600 mr-3" />
                              <div>
                                <div className="text-sm text-gray-600">Company</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {selectedCertificate.company_name}
                                </div>
                              </div>
                            </div>

                            {selectedCertificate.branch && (
                              <div className="flex items-center">
                                <MapPin className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                  <div className="text-sm text-gray-600">Branch</div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    {selectedCertificate.branch}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Award className="w-5 h-5 text-red-600 mr-3" />
                              <div>
                                <div className="text-sm text-gray-600">Certificate Number</div>
                                <div className="text-lg font-semibold text-gray-900 font-mono">
                                  {selectedCertificate.certificate_number}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Calendar className="w-5 h-5 text-red-600 mr-3" />
                              <div>
                                <div className="text-sm text-gray-600">Issue Date</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {selectedCertificate.issue_date}
                                </div>
                              </div>
                            </div>

                            {selectedCertificate.employee_id && (
                              <div className="flex items-center">
                                <User className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                  <div className="text-sm text-gray-600">Employee ID</div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    {selectedCertificate.employee_id}
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedCertificate.department && (
                              <div className="flex items-center">
                                <Building className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                  <div className="text-sm text-gray-600">Department</div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    {selectedCertificate.department}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Authorization Text */}
                      <div className="text-center py-6">
                        <p className="text-lg text-gray-700 leading-relaxed">
                          This certificate hereby authorizes <strong>{selectedCertificate.name}</strong> to act as an
                          official {selectedCertificate.type} for <strong>{selectedCertificate.company_name}</strong> and to provide government
                          services to customers on behalf of the company. This authorization is valid from the date
                          of issue and remains active as long as the {selectedCertificate.type} maintains good standing with the company.
                        </p>
                      </div>

                      {/* Certificate Footer */}
                      <div className="border-t pt-6 mt-8">
                        <div className="flex justify-between items-end">
                          <div className="text-center">
                            <div className="w-32 h-16 border-b-2 border-gray-400 mb-2 flex items-end justify-center">
                              <div className="text-xs text-gray-700 font-signature italic">
                                Vignaharta Janseva
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">Authorized Signature</div>
                            <div className="text-xs text-gray-500 mt-1">Company Representative</div>
                            {selectedCertificate.digital_signature && (
                              <div className="text-xs text-gray-400 mt-2 font-mono">
                                Digital ID: {selectedCertificate.digital_signature.substring(0, 16)}...
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="w-20 h-20 border-2 border-red-600 rounded-full flex items-center justify-center mb-2">
                              <div className="text-xs text-red-600 font-bold">OFFICIAL<br/>SEAL</div>
                            </div>
                            <div className="text-xs text-gray-500">Company Seal</div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Certificate ID:</div>
                            <div className="text-xs font-mono text-gray-800">{selectedCertificate.certificate_number}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              Issued on {selectedCertificate.issue_date}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
