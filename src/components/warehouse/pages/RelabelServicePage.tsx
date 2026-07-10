import React, { useEffect, useState, useCallback } from 'react';
import { relabelApi } from '../../../api';
import { normalizeListResponse, formatDate, safeStr } from '../types';
import StatusTabs from '../common/StatusTabs';
import FilterBar from '../common/FilterBar';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import StatusBadge from '../common/StatusBadge';
import { WarehousePageProps } from '../types';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'picking', label: '待拣货' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已处理' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  orderNo: item.orderNo || item.relabelNo || item.no || '-',
  relabelQty: item.relabelQty ?? item.qty ?? 0,
  forecastQty: item.forecastQty ?? item.expectedQty ?? 0,
  packedQty: item.packedQty ?? 0,
  customer: item.customerName || item.customer?.name || '-',
  status: item.status || 'PENDING',
  createdAt: item.createdAt || item.createdTime || '',
});

export default function RelabelServicePage({ currentUser }: WarehousePageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState('all');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, any> = { page, pageSize };
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await relabelApi.getOrders(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = async (id: string) => {
    if (!confirm('确认完成此换标服务？')) return;
    try {
      await relabelApi.complete(id);
      fetchData();
    } catch (e: any) { alert(e?.message || '操作失败'); }
  };

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'text' as const, key: 'fnsku', label: 'FNSKU', placeholder: 'FNSKU' },
    { type: 'text' as const, key: 'orderNo', label: '换标服务单号', placeholder: '换标服务单号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'orderNo', label: '换标服务单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'relabelQty', label: '换标数量/预报数量', width: 140, render: (_: any, row: any) => `${row.relabelQty}/${row.forecastQty}` },
    { key: 'packedQty', label: '装箱数量', width: 80, align: 'right' as const },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'actions', label: '操作', width: 80, render: (_: any, row: any) => (
      <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleComplete(row.id); }}>完成</span>
    )},
  ];

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StatusTabs tabs={statusTabs} activeKey={statusTab} onChange={tab => { setStatusTab(tab); setPage(1); }} />
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />
      <DataTable columns={columns} data={data} rowKey="id" loading={loading} error={error} selectedKeys={selectedKeys} onSelectChange={setSelectedKeys} />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
