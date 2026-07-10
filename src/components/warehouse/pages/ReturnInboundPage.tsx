import React, { useEffect, useState, useCallback } from 'react';
import { returnApi } from '../../../api';
import { normalizeListResponse, formatDate, safeStr } from '../types';
import StatusTabs from '../common/StatusTabs';
import FilterBar from '../common/FilterBar';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import StatusBadge from '../common/StatusBadge';
import { WarehousePageProps } from '../types';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待入库' },
  { key: 'inspect', label: '待清点' },
  { key: 'putaway', label: '待上架' },
  { key: 'putawaying', label: '上架中' },
  { key: 'completed', label: '已上架' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  returnNo: item.returnNo || item.orderNo || '-',
  trackingNo: item.trackingNo || '-',
  returnQty: item.returnQty ?? item.qty ?? 0,
  fnsku: item.fnsku || item.fnSku || '-',
  customer: item.customerName || item.customer?.name || '-',
  removalOrderId: item.removalOrderId || '-',
  status: item.status || 'PENDING',
  createdAt: item.createdAt || item.createdTime || '',
});

export default function ReturnInboundPage({ currentUser }: WarehousePageProps) {
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
      const params: Record<string, any> = { page, pageSize, returnType: 'INBOUND' };
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await returnApi.getReturns(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map((item: any) => ({
        ...adapter(item),
        fnskuItems: item.items?.map((i: any) => `${i.fnsku || i.skuCode}:${i.qty}`).join(', ') || `${item.fnsku || '-'}:${item.qty || 0}`,
      })));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'text' as const, key: 'fnsku', label: 'FNSKU', placeholder: 'FNSKU' },
    { type: 'text' as const, key: 'trackingNo', label: '物流跟踪号', placeholder: '物流跟踪号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'returnNo', label: '退货入库单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'trackingNo', label: '物流跟踪号', width: 130 },
    { key: 'returnQty', label: '退货数量', width: 80, align: 'right' as const },
    { key: 'fnsku', label: 'FNSKU×数量', width: 140, render: (v: string, row: any) => row.fnskuItems || v },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'removalOrderId', label: '移除订单 Order ID', width: 150 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'actions', label: '操作', width: 160, render: (_: any, row: any) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); returnApi.receiveReturn(row.id).then(() => fetchData()).catch(() => alert('签收失败')); }}>签收</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); returnApi.inspectReturn(row.id).then(() => fetchData()).catch(() => alert('清点失败')); }}>清点</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); returnApi.restockReturn(row.id).then(() => fetchData()).catch(() => alert('上架失败')); }}>上架</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }}>查看</span>
      </div>
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
