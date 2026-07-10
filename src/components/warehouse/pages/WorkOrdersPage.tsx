import React, { useEffect, useState, useCallback } from 'react';
import { workOrderApi } from '../../../api';
import { normalizeListResponse, formatDate, safeStr } from '../types';
import StatusTabs from '../common/StatusTabs';
import FilterBar from '../common/FilterBar';
import ActionToolbar from '../common/ActionToolbar';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import StatusBadge from '../common/StatusBadge';
import { WarehousePageProps } from '../types';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已审核' },
  { key: 'completed', label: '处理完成' },
  { key: 'voided', label: '已作废' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  orderNo: item.orderNo || item.workOrderNo || item.no || '-',
  title: item.title || item.subject || '-',
  priority: item.priority || 'NORMAL',
  customer: item.customerName || item.customer?.name || '-',
  type: item.type || item.orderType || '-',
  status: item.status || 'PENDING',
  createdAt: item.createdAt || item.createdTime || '',
});

export default function WorkOrdersPage({ currentUser }: WarehousePageProps) {
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
      const res = await workOrderApi.getOrders(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      await workOrderApi.update(id, { status: 'APPROVED' });
      fetchData();
    } catch (e: any) { alert(e?.message || '操作失败'); }
  };

  const handleVoid = async (id: string) => {
    if (!confirm('确认作废此工单？')) return;
    try {
      await workOrderApi.update(id, { status: 'VOIDED' });
      fetchData();
    } catch (e: any) { alert(e?.message || '操作失败'); }
  };

  const handleExport = async () => {
    alert('导出功能');
  };

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'select' as const, key: 'type', label: '工单类型', options: [] },
    { type: 'select' as const, key: 'priority', label: '紧急程度', options: [{ label: '普通', value: 'NORMAL' }, { label: '紧急', value: 'URGENT' }] },
    { type: 'text' as const, key: 'title', label: '工单标题', placeholder: '工单标题' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'orderNo', label: '工单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'title', label: '工单标题', width: 250 },
    { key: 'priority', label: '紧急程度', width: 80, render: (v: string) => (
      <span style={{ color: v === 'URGENT' || v === '紧急' ? '#d32f2f' : '#6b7280' }}>
        {v === 'URGENT' || v === 'HIGH' ? '紧急' : '普通'}
      </span>
    )},
    { key: 'customer', label: '客户', width: 120 },
    { key: 'type', label: '工单类型', width: 100 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'actions', label: '操作', width: 160, fixed: 'right' as const, render: (_: any, row: any) => (
      <div style={{ display: 'flex', gap: 4 }}>
        {row.status === 'PENDING' && (
          <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }}>审核</span>
        )}
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }}>查看</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }}>编辑</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#d32f2f', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleVoid(row.id); }}>作废</span>
      </div>
    )},
  ];

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StatusTabs tabs={statusTabs} activeKey={statusTab} onChange={tab => { setStatusTab(tab); setPage(1); }} />
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />
      <ActionToolbar buttons={[{ key: 'typeManage', label: '工单类型管理', onClick: () => alert('工单类型管理') }, { key: 'export', label: '导出', onClick: handleExport }]} />
      <DataTable columns={columns} data={data} rowKey="id" loading={loading} error={error} selectedKeys={selectedKeys} onSelectChange={setSelectedKeys} />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
