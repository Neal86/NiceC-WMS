import { useState, useEffect, useCallback } from 'react';
import { normalizeListResponse } from '../types';

interface UseWarehouseListOptions<T> {
  fetchFn: (params?: any) => Promise<any>;
  pageSize?: number;
  initialParams?: Record<string, any>;
  adapter?: (item: any) => T;
}

export function useWarehouseList<T extends Record<string, any>>({
  fetchFn,
  pageSize: defaultPageSize = 20,
  initialParams = {},
  adapter,
}: UseWarehouseListOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [statusTab, setStatusTab] = useState('all');

  const load = useCallback(async (overrideParams?: Record<string, any>) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
        ...initialParams,
        ...filters,
        ...overrideParams,
      };

      // Only send non-empty params
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === undefined || params[k] === null) {
          delete params[k];
        }
      });

      if (statusTab !== 'all') {
        params.status = statusTab.toUpperCase();
      }

      const response = await fetchFn(params);
      const items = normalizeListResponse<any>(response);

      // Try to get total from response metadata
      const responseTotal = response?.total ?? response?.pagination?.total ?? response?.count ?? 0;
      setTotal(responseTotal || items.length);

      const mapped = adapter ? items.map(adapter) : items as unknown as T[];
      setData(mapped);
    } catch (err: any) {
      console.error('useWarehouseList error:', err);
      setError(err?.response?.data?.message || err?.message || '加载失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, pageSize, filters, statusTab, initialParams, adapter]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-load when page/pageSize change
  useEffect(() => {
    load();
  }, [page, pageSize]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  const changeFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const changeStatusTab = useCallback((tab: string) => {
    setStatusTab(tab);
    setPage(1);
  }, []);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    filters,
    statusTab,
    setPage,
    setPageSize,
    changeFilter,
    resetFilters,
    changeStatusTab,
    refresh,
    setData,
  };
}
