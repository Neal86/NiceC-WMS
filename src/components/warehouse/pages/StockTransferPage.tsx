import React, { useEffect, useState, useCallback } from 'react';
import { outboundApi } from '../../../api';
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
  { key: 'shipping', label: '待出库' },
  { key: 'shipped', label: '已出库' },
  { key: 'exception', label: '异常' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  orderNo: item.orderNo || item.no || '-',
  remark: item.remark || '',
  productQty: item.totalQty ?? item.qty ?? 0,
  skuQty: item.skuQty ?? '-',
  productName: item.productName || '',
  boxQty: item.boxQty ?? item.cartonQty ?? '-',
  relabelService: item.relabelService ?? item.needsRelabel ? '是' : '否',
  customer: item.customerName || item.customerCode || '-',
  channel: item.logisticsChannelName || item.channel || '-',
  trackingNo: item.trackingNo || '-',
  pickListPrinted: item.pickListPrinted || 'NOT_PRINTED',
  destinationType: item.destinationType || '-',
  outboundMethod: item.outboundMethod || item.shipMethod || '-',
  fbaShipmentId: item.fbaShipmentId || '-',
  shipmentTracking: item.shipmentTracking || '-',
  status: item.status || 'PENDING',
  createdTime: item.createdTime || item.createdAt || '',
});

export default function StockTransferPage({ currentUser, onNavigate }: WarehousePageProps) {
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
      const params: Record<string, any> = { page, pageSize, orderType: 'STOCK_TRANSFER' };
      if (currentUser?.warehouseId) params.warehouseId = currentUser.warehouseId;
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await outboundApi.getOrders(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'text' as const, key: 'sku', label: 'SKU', placeholder: 'SKU' },
    { type: 'text' as const, key: 'outboundOrderNo', label: '出库单号', placeholder: '出库单号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'orderNo', label: '出库单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'remark', label: '备注', width: 80 },
    { key: 'productQty', label: '产品数量', width: 80, align: 'right' as const },
    { key: 'skuQty', label: 'SKU×数量', width: 90 },
    { key: 'productName', label: '产品名称', width: 150 },
    { key: 'boxQty', label: '箱数', width: 60, align: 'right' as const },
    { key: 'relabelService', label: '换标服务', width: 80 },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'channel', label: '物流渠道', width: 100 },
    { key: 'trackingNo', label: '物流跟踪号', width: 130 },
    { key: 'pickListPrinted', label: '拣货单打印', width: 90 },
    { key: 'destinationType', label: '目的地类型', width: 90 },
    { key: 'outboundMethod', label: '出库方式', width: 90 },
    { key: 'fbaShipmentId', label: 'FBA Shipment ID', width: 140 },
    { key: 'shipmentTracking', label: '货件追踪', width: 100 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdTime', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
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
