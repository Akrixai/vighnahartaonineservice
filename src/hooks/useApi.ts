import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {},
    apiOptions: UseApiOptions = {}
  ): Promise<ApiResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        setError(errorMessage);
        apiOptions.onError?.(errorMessage);
        return data;
      }

      if (data.success && apiOptions.onSuccess) {
        apiOptions.onSuccess(data.data);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      apiOptions.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Wallet operations
  const getWallet = useCallback(() => {
    return apiCall('/api/wallet');
  }, [apiCall]);

  const addMoney = useCallback((amount: number) => {
    return apiCall('/api/wallet/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }, [apiCall]);

  const verifyPayment = useCallback((paymentData: any) => {
    return apiCall('/api/wallet/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }, [apiCall]);

  // Transaction operations
  const getTransactions = useCallback((params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/transactions?${searchParams}`);
  }, [apiCall]);

  const createTransaction = useCallback((transactionData: any) => {
    return apiCall('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }, [apiCall]);

  // Scheme operations
  const getSchemes = useCallback((params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/schemes?${searchParams}`);
  }, [apiCall]);

  const createScheme = useCallback((schemeData: any) => {
    return apiCall('/api/schemes', {
      method: 'POST',
      body: JSON.stringify(schemeData),
    });
  }, [apiCall]);

  // Application operations
  const getApplications = useCallback((params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/applications?${searchParams}`);
  }, [apiCall]);

  const createApplication = useCallback((applicationData: any) => {
    return apiCall('/api/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }, [apiCall]);

  const approveApplication = useCallback((applicationId: string, notes?: string) => {
    return apiCall(`/api/applications/${applicationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }, [apiCall]);

  const rejectApplication = useCallback((applicationId: string, notes?: string, refund = false) => {
    return apiCall(`/api/applications/${applicationId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes, refund }),
    });
  }, [apiCall]);

  // User operations
  const getUsers = useCallback((params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/users?${searchParams}`);
  }, [apiCall]);

  const createUser = useCallback((userData: any) => {
    return apiCall('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }, [apiCall]);

  const updateUser = useCallback((userId: string, userData: any) => {
    return apiCall(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }, [apiCall]);

  const deleteUser = useCallback((userId: string) => {
    return apiCall(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  // Dashboard operations
  const getDashboardStats = useCallback(() => {
    return apiCall('/api/dashboard/stats');
  }, [apiCall]);

  return {
    loading,
    error,
    // Wallet
    getWallet,
    addMoney,
    verifyPayment,
    // Transactions
    getTransactions,
    createTransaction,
    // Schemes
    getSchemes,
    createScheme,
    // Applications
    getApplications,
    createApplication,
    approveApplication,
    rejectApplication,
    // Users
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    // Dashboard
    getDashboardStats,
    // Generic API call
    apiCall,
  };
}
