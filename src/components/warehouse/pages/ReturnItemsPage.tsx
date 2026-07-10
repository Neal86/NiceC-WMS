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
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  returnNo: item.returnNo || item.orderNo || item.no || '-',
  customer: item.customerName || item.customer?.name || '-',
  customerRemark: item.customerRemark || item.remark || '',
  receiveRemark: item.receiveRemark || '',
  processRemark: item.processRemark || '',
  skuQty: item.skuQty ?? item.items?.length ?? '-',
  receivedQty: item.receivedQty ?? 0,
  totalQty: item.totalQty ?? item.qty ?? 0,
  processMethod: item.processMethod || '-',
  returnType: item.returnType || item.type || '-',
  trackingNo: item.trackingNo || '-',
  storageLocation: item.storageLocation || '-',
  orderSource: item.orderSource || '-',
  relatedOutboundNo: item.relatedOutboundNo || '-',
  removalOrderId: item.removalOrderId || '-',
  status: item.status || 'PENDING',
  createdAt: item.createdAt || item.createdTime || '',
});

export default function ReturnItemsPage({ currentUser }: WarehousePageProps) {
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
      const res = await returnApi.getReturns(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterFields = [
    { type: 'select' as const, key: 'processStatus', label: '处理状态', options: [] },
    { type: 'select' as const, key: 'processMethod', label: '处理方式', options: [] },
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'text' as const, key: 'trackingNo', label: '物流跟踪号', placeholder: '物流跟踪号' },
    { type: 'text' as const, key: 'barcode', label: '产品条码', placeholder: '产品条码' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'returnNo', label: '退件单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'customerRemark', label: '客户备注', width: 120 },
    { key: 'receiveRemark', label: '收货备注', width: 120 },
    { key: 'processRemark', label: '处理备注', width: 120 },
    { key: 'skuQty', label: 'SKU×数量', width: 90 },
    { key: 'receivedQty', label: '已收/总产品数', width: 110, render: (_: any, row: any) => `${row.receivedQty}/${row.totalQty}` },
    { key: 'processMethod', label: '处理方式×数量', width: 100 },
    { key: 'returnType', label: '退件类型', width: 80 },
    { key: 'trackingNo', label: '物流跟踪号/寄存库位', width: 140 },
    { key: 'orderSource', label: '订单来源', width: 100 },
    { key: 'relatedOutboundNo', label: '关联出库单号', width: 140 },
    { key: 'removalOrderId', label: '移除单号', width: 130 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
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
