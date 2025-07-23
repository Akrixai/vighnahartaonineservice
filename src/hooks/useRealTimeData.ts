import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealTimeDataOptions {
  table: string;
  filter?: { column: string; value: any };
  orderBy?: { column: string; ascending?: boolean };
  select?: string;
  enabled?: boolean;
}

export function useRealTimeData<T = any>({
  table,
  filter,
  orderBy,
  select = '*',
  enabled = true
}: UseRealTimeDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const fetchDataRef = useRef<() => Promise<void>>();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData((result || []) as T[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [table, filter, orderBy, select, enabled]);

  // Update the ref whenever fetchData changes
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Separate effect for initial data fetch
  useEffect(() => {
    if (!enabled) return;
    fetchData();
  }, [fetchData]);

  // Separate effect for real-time subscription
  useEffect(() => {
    if (!enabled) return;

    // Clean up existing channel
    if (channel) {
      supabase.removeChannel(channel);
    }

    // Set up real-time subscription
    const newChannel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
        },
        (payload) => {
          // Refetch data on any change
          if (fetchDataRef.current) {
            fetchDataRef.current();
          }
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, filter, enabled]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
}

// Specialized hooks for common use cases - using API endpoints

export function useRealTimeServices(enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.services || []);
      } else {
        throw new Error(result.error || 'Failed to fetch services');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchServices();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refresh: fetchServices
  };
}

export function useRealTimeAdvertisements(position?: string, enabled = true) {
  const filter = useMemo(() =>
    position ? { column: 'position', value: position } : { column: 'is_active', value: true },
    [position]
  );

  const orderBy = useMemo(() => ({ column: 'created_at', ascending: false }), []);

  return useRealTimeData<any>({
    table: 'advertisements',
    filter,
    orderBy,
    select: `
      id,
      title,
      description,
      image_url,
      link_url,
      position,
      is_active,
      start_date,
      end_date,
      click_count
    `,
    enabled
  });
}

export function useRealTimeApplications(userId?: string, enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchApplications(true); // Initial load with loading state

      // Poll for real-time updates every 10 seconds (without loading state)
      const interval = setInterval(() => fetchApplications(false), 10000);
      return () => clearInterval(interval);
    }
  }, [enabled, userId]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchApplications(true)
  };
}

export function useRealTimeAdminApplications(enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.applications || []);
      } else {
        throw new Error(result.error || 'Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchApplications();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refresh: fetchApplications
  };
}

export function useRealTimeProducts(enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.products || []);
      } else {
        throw new Error(result.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchProducts();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refresh: fetchProducts
  };
}

export function useRealTimeTrainingVideos(enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainingVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/training-videos');
      if (!response.ok) {
        throw new Error('Failed to fetch training videos');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.videos || []);
      } else {
        throw new Error(result.error || 'Failed to fetch training videos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchTrainingVideos();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refresh: fetchTrainingVideos
  };
}
