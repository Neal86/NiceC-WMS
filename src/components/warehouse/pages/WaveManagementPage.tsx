import React, { useEffect, useState, useCallback } from 'react';
import { waveApi } from '../../../api';
import { normalizeListResponse, formatDate } from '../types';
import StatusTabs from '../common/StatusTabs';
import FilterBar from '../common/FilterBar';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import StatusBadge from '../common/StatusBadge';
import { WarehousePageProps } from '../types';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待拣货' },
  { key: 'picking', label: '拣货中' },
  { key: 'completed', label: '已拣货' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  waveNo: item.waveNo || item.no || '-',
  pickedQty: item.pickedQty ?? 0,
  totalQty: item.totalQty ?? item.qty ?? 0,
  waveType: item.waveType || item.type || '-',
  orderCount: item.orderCount ?? item.orders?.length ?? 0,
  outboundOrderCount: item.outboundOrderCount ?? item.orderCount ?? 0,
  picker: item.pickerName || item.picker || '-',
  waveRule: item.waveRule || item.ruleName || '-',
  pickListPrinted: item.pickListPrinted || 'NOT_PRINTED',
  labelSplicing: item.labelSplicing || '-',
  secondarySort: item.secondarySort || '-',
  review: item.review || '-',
  outbound: item.outbound || '-',
  sortStatus: item.sortStatus || '-',
  reviewStatus: item.reviewStatus || '-',
  outboundStatus: item.outboundStatus || '-',
  createdAt: item.createdAt || item.createdTime || '',
  submitTime: item.submitTime || '',
  pickCompleteTime: item.pickCompleteTime || '',
  status: item.status || 'PENDING',
});

export default function WaveManagementPage({ currentUser }: WarehousePageProps) {
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
      if (currentUser?.warehouseId) params.warehouseId = currentUser.warehouseId;
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await waveApi.getWaves();
      const items = normalizeListResponse(res);
      setTotal(items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterFields = [
    { type: 'text' as const, key: 'outboundOrderNo', label: '出库单号', placeholder: '出库单号' },
    { type: 'text' as const, key: 'barcode', label: 'Barcode', placeholder: 'Barcode' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'waveNo', label: '波次号', width: 140, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'pickedQty', label: '已拣/应拣', width: 100, render: (_: any, row: any) => `${row.pickedQty}/${row.totalQty}` },
    { key: 'waveType', label: '波次品种类型', width: 100 },
    { key: 'orderCount', label: '订单数量', width: 80, align: 'right' as const },
    { key: 'outboundOrderCount', label: '出库订单数量', width: 100, align: 'right' as const },
    { key: 'picker', label: '拣货员', width: 80 },
    { key: 'waveRule', label: '波次规则', width: 100 },
    { key: 'pickListPrinted', label: '拣货单打印', width: 90 },
    { key: 'labelSplicing', label: '面单拼接', width: 80 },
    { key: 'secondarySort', label: '二次分拣', width: 80 },
    { key: 'review', label: '复核', width: 60 },
    { key: 'outbound', label: '出库', width: 60 },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'submitTime', label: '提交时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'pickCompleteTime', label: '拣货完成时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
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
