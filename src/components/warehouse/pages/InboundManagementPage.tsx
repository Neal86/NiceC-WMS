import React, { useEffect, useState, useCallback } from 'react';
import { inboundApi, putawayApi } from '../../../api';
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
  { key: 'receiving', label: '收货中' },
  { key: 'received', label: '已收货' },
  { key: 'putaway', label: '已上架' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  orderNo: item.orderNo || item.inboundNo || '-',
  remark: item.remark || '',
  receivedBoxes: item.receivedBoxes ?? 0,
  totalBoxes: item.totalBoxes ?? item.boxQty ?? 0,
  productQty: item.totalQty ?? item.qty ?? 0,
  skuQty: item.skuQty ?? '-',
  barcodeQty: item.barcodeQty ?? '-',
  referenceNo: item.referenceNo || item.refNo || '-',
  trackingNo: item.trackingNo || item.containerNo || '-',
  arrivalMethod: item.arrivalMethod || item.shipMethod || '-',
  estimatedArrival: item.estimatedArrival || item.expectedDate || '',
  customer: item.customerName || item.customer?.name || '-',
  inboundType: item.inboundType || item.type || '-',
  status: item.status || 'PENDING',
  createdAt: item.createdAt || item.createdTime || '',
  items: item.items || [],
});

export default function InboundManagementPage({ currentUser }: WarehousePageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState('all');
  const [bizType, setBizType] = useState('all');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, any> = { page, pageSize };
      if (currentUser?.warehouseId) params.warehouseId = currentUser.warehouseId;
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      if (bizType !== 'all') params.inboundType = bizType;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await inboundApi.getOrders(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.message || '加载失败'); setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, bizType, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReceive = async (id: string) => {
    if (!confirm('确认收货？')) return;
    try {
      await inboundApi.receive(id);
      fetchData();
    } catch (e: any) { alert(e?.message || '收货失败'); }
  };

  const handlePutaway = async (id: string) => {
    if (!confirm('确认上架？')) return;
    try {
      await putawayApi.complete(id);
      fetchData();
    } catch (e: any) { alert(e?.message || '上架失败'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确认取消？')) return;
    try {
      // Cancel via inbound API if available
      alert('当前接口未开放');
    } catch (e: any) { alert(e?.message || '取消失败'); }
  };

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'select' as const, key: 'arrivalMethod', label: '到仓方式', options: [] },
    { type: 'text' as const, key: 'barcode', label: '产品条码', placeholder: '产品条码' },
    { type: 'text' as const, key: 'orderNo', label: '入库单号', placeholder: '入库单号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'orderNo', label: '入库单号', width: 150, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'remark', label: '备注', width: 80 },
    { key: 'receivedBoxes', label: '已收箱数/总箱数', width: 130, render: (_: any, row: any) => `${row.receivedBoxes}/${row.totalBoxes}` },
    { key: 'productQty', label: '产品数量', width: 80, align: 'right' as const },
    { key: 'skuQty', label: 'SKU×数量', width: 90 },
    { key: 'barcodeQty', label: '产品条码×数量', width: 110 },
    { key: 'referenceNo', label: '参考单号', width: 130 },
    { key: 'trackingNo', label: '跟踪号/货柜号', width: 130 },
    { key: 'arrivalMethod', label: '到仓方式', width: 80 },
    { key: 'estimatedArrival', label: '预计到达日期', width: 110, render: (v: string) => formatDate(v) },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'inboundType', label: '入库类型', width: 80 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'actions', label: '操作', width: 140, fixed: 'right' as const, render: (_: any, row: any) => (
      <div style={{ display: 'flex', gap: 4 }}>
        {row.status === 'PENDING' && <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleReceive(row.id); }}>收货</span>}
        <span style={{ color: '#315bea', cursor: 'pointer' }}>查看</span>
        {row.status === 'RECEIVED' && <><span style={{ color: '#9ca3af' }}>|</span><span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handlePutaway(row.id); }}>上架</span></>}
        {row.status === 'PENDING' && <><span style={{ color: '#9ca3af' }}>|</span><span style={{ color: '#d32f2f', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleCancel(row.id); }}>取消</span></>}
      </div>
    )},
  ];

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StatusTabs tabs={statusTabs} activeKey={statusTab} onChange={tab => { setStatusTab(tab); setPage(1); }} />
      {/* Business sub-tabs */}
      <div style={{ display: 'flex', height: 30, borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa', paddingLeft: 12, alignItems: 'center', gap: 4 }}>
        {[
          { key: 'all', label: '全部' },
          { key: 'REGULAR', label: '常规入库' },
          { key: 'STOCK_TRANSFER', label: '备货中转入库' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setBizType(tab.key); setPage(1); }} style={{
            height: 26, padding: '0 10px', fontSize: 11, border: 'none', background: tab.key === bizType ? '#315bea' : '#fff', color: tab.key === bizType ? '#fff' : '#6b7280', cursor: 'pointer', borderRadius: 2, marginRight: 4,
          }}>{tab.label}</button>
        ))}
      </div>
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />
      <DataTable columns={columns} data={data} rowKey="id" loading={loading} error={error} selectedKeys={selectedKeys} onSelectChange={setSelectedKeys} />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
