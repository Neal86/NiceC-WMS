import { useState, useEffect, useCallback } from 'react';

export function useWarehouseNavigation() {
  const [activePage, setActivePage] = useState<string>(() => {
    const stored = sessionStorage.getItem('wh_activePage');
    if (stored) return stored;
    const path = window.location.pathname;
    if (path.startsWith('/warehouse/')) {
      const parts = path.split('/');
      // /warehouse/outbound/:id
      if (parts.length >= 4 && parts[2] === 'outbound') return 'outbound';
      return parts[2] || 'home';
    }
    return 'home';
  });

  const [detailParams, setDetailParams] = useState<Record<string, string> | null>(null);

  const navigate = useCallback((pageKey: string, subId?: string) => {
    setActivePage(pageKey);
    sessionStorage.setItem('wh_activePage', pageKey);
    if (subId) {
      setDetailParams({ id: subId });
    } else {
      setDetailParams(null);
    }

    let path = `/warehouse/${pageKey}`;
    if (subId) {
      // Only outbound detail supports /warehouse/outbound/:id
      if (pageKey === 'outbound') {
        path = `/warehouse/outbound/${subId}`;
      }
    }
    window.history.pushState({ page: pageKey, id: subId }, '', path);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (!path.startsWith('/warehouse')) return;
      const parts = path.split('/');
      if (parts.length >= 4 && parts[2] === 'outbound') {
        setActivePage('outbound');
        setDetailParams({ id: parts[3] });
        sessionStorage.setItem('wh_activePage', 'outbound');
      } else if (parts.length >= 3) {
        const key = parts[2] || 'home';
        setActivePage(key);
        setDetailParams(null);
        sessionStorage.setItem('wh_activePage', key);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { activePage, detailParams, navigate, setActivePage };
}
