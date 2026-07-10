import React, { useEffect, useState, useCallback } from 'react';
import { outboundApi, returnApi } from '../../../api';
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
  { key: 'pending', label: '待处理' },
  { key: 'picking', label: '待拣货' },
  { key: 'shipping', label: '待出库' },
  { key: 'shipped', label: '已出库' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  returnNo: item.returnNo || item.orderNo || '-',
  productQty: item.totalQty ?? item.qty ?? 0,
  fnskuItems: item.items?.map((i: any) => `${i.fnsku || i.skuCode}:${i.qty}`).join(', ') || '-',
  fbaShipmentId: item.fbaShipmentId || '-',
  customer: item.customerName || item.customer?.name || '-',
  channel: item.logisticsChannelName || item.channel || '-',
  trackingNo: item.trackingNo || '-',
  outboundMethod: item.outboundMethod || item.shipMethod || '-',
  status: item.status || 'PENDING',
  createdAt: item.createdAt || item.createdTime || '',
});

export default function ReturnOutboundPage({ currentUser }: WarehousePageProps) {
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
      const params: Record<string, any> = { page, pageSize, returnType: 'OUTBOUND' };
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      // Try return API first, fallback to outbound API
      const res = await returnApi.getReturns(params).catch(() => outboundApi.getOrders({ ...params, orderType: 'RETURN_OUTBOUND' }));
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    alert('导出功能');
  };

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'select' as const, key: 'channel', label: '物流渠道', options: [] },
    { type: 'select' as const, key: 'outboundMethod', label: '出库方式', options: [] },
    { type: 'text' as const, key: 'fnsku', label: 'FNSKU', placeholder: 'FNSKU' },
    { type: 'text' as const, key: 'returnNo', label: '退货出库单号', placeholder: '退货出库单号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'returnNo', label: '退货出库单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'productQty', label: '产品数量', width: 80, align: 'right' as const },
    { key: 'fnskuItems', label: 'FNSKU×数量', width: 140 },
    { key: 'fbaShipmentId', label: 'FBA Shipment ID', width: 140 },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'channel', label: '物流渠道', width: 100 },
    { key: 'trackingNo', label: '物流跟踪号', width: 130 },
    { key: 'outboundMethod', label: '出库方式', width: 90 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'actions', label: '操作', width: 160, render: (_: any, row: any) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ color: '#315bea', cursor: 'pointer' }}>提交拣货</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }}>下载附件</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }}>查看</span>
      </div>
    )},
  ];

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StatusTabs tabs={statusTabs} activeKey={statusTab} onChange={tab => { setStatusTab(tab); setPage(1); }} />
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />
      <ActionToolbar buttons={[
        { key: 'import', label: '导入更新跟踪号', onClick: () => alert('导入更新跟踪号') },
        { key: 'export', label: '导出', onClick: handleExport },
      ]} />
      <DataTable columns={columns} data={data} rowKey="id" loading={loading} error={error} selectedKeys={selectedKeys} onSelectChange={setSelectedKeys} />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
