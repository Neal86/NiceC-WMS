import React from 'react';

export interface WarehousePageProps {
  currentUser: any;
  onNavigate?: (path: string, sub?: string) => void;
  params?: Record<string, string>;
}

export interface StatusTab {
  key: string;
  label: string;
}

export interface FilterField {
  type: 'select' | 'text' | 'number' | 'date' | 'search' | 'custom';
  key: string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  width?: number;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => any;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterValues {
  [key: string]: string | number | undefined;
}

export function normalizeListResponse<T>(response: any): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];
  if (Array.isArray(response.data)) return response.data as T[];
  if (Array.isArray(response.items)) return response.items as T[];
  if (Array.isArray(response.orders)) return response.orders as T[];
  if (Array.isArray(response.results)) return response.results as T[];
  if (Array.isArray(response.records)) return response.records as T[];
  if (Array.isArray(response.list)) return response.list as T[];
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data as T[];
  return [];
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '-' || dateStr === '') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '-';
  }
}

export function toNumber(val: any, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export function safeStr(val: any, fallback = '-'): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s || fallback;
}
