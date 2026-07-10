import React, { useEffect, useState, useCallback } from 'react';
import { outboundApi, metadataApi } from '../../../api';
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
  { key: 'review', label: '待复核' },
  { key: 'shipping', label: '待出库' },
  { key: 'shipped', label: '已出库' },
  { key: 'exception', label: '异常' },
  { key: 'cancelled', label: '已取消' },
];

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  orderNo: item.orderNo || item.no || '-',
  remark: item.remark || item.notes || '',
  productQty: item.totalQty ?? item.productQty ?? item.qty ?? 0,
  skuQty: item.skuQty ?? item.skuCount ?? '-',
  productName: item.productName || '',
  category: item.category || '',
  waveNo: item.waveNo || item.wave?.waveNo || '',
  labelPrinted: item.labelPrinted || 'NOT_PRINTED',
  customer: item.customerName || item.customerCode || item.customer?.name || '-',
  orderType: item.orderType || item.type || '',
  channel: item.logisticsChannelName || item.channel || '',
  status: item.status || 'PENDING',
  createdTime: item.createdTime || item.createdAt || '',
  items: item.items || [],
  customerName: item.customerName || item.customerCode || '-',
});

export default function OutboundFulfillmentPage({ currentUser, onNavigate }: WarehousePageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState('all');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [channels, setChannels] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    metadataApi.getCustomers().then((res: any) => {
      const arr = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
      setCustomers(arr.map((c: any) => ({ label: `${c.name}(${c.code})`, value: c.code || c.id })));
    }).catch(() => {});
    metadataApi.getLogisticsChannels().then((res: any) => {
      const arr = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
      setChannels(arr.map((c: any) => ({ label: c.name, value: c.id })));
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, pageSize };
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

      const res = await outboundApi.getOrders(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      setData(items.map(adapter));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '加载失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBatchWave = async () => {
    if (selectedKeys.size === 0) return;
    try {
      await outboundApi.batchGenerateWave(Array.from(selectedKeys));
      alert('波次生成成功');
      setSelectedKeys(new Set());
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '生成波次失败');
    }
  };

  const handlePrintPickList = async () => {
    if (selectedKeys.size === 0) return;
    try {
      await outboundApi.batchPrintPickList(Array.from(selectedKeys));
      alert('打印拣货单成功');
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '打印失败');
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm('确认取消此出库单？')) return;
    try {
      await outboundApi.cancelOrder(id);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '取消失败');
    }
  };

  const handleShipOrder = async (id: string) => {
    if (!confirm('确认出库？')) return;
    try {
      await outboundApi.shipOrder(id);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '出库失败');
    }
  };

  const handlePrintLabel = async (id: string) => {
    try {
      await outboundApi.printLabel(id);
      await outboundApi.markLabelPrinted(id);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '打印失败');
    }
  };

  const handleExport = async () => {
    try {
      await outboundApi.exportOrders();
      alert('导出成功');
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '导出失败');
    }
  };

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: customers },
    { type: 'select' as const, key: 'orderType', label: '订单品种类型', options: [{ label: '单品单件', value: '单品单件' }, { label: '多品多件', value: '多品多件' }] },
    { type: 'text' as const, key: 'salesPlatform', label: '销售平台', placeholder: '销售平台' },
    { type: 'select' as const, key: 'logisticsChannel', label: '物流渠道', options: channels },
    { type: 'text' as const, key: 'sku', label: 'SKU', placeholder: 'SKU' },
    { type: 'text' as const, key: 'outboundOrderNo', label: '出库单号', placeholder: '出库单号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
  ];

  const columns = [
    { key: 'orderNo', label: '出库单号', width: 150, render: (v: string, row: any) => (
      <span
        style={{ color: '#315bea', cursor: 'pointer', textDecoration: 'none' }}
        onClick={(e) => { e.stopPropagation(); onNavigate?.('outbound', row.id); }}
      >
        {v}
      </span>
    )},
    { key: 'remark', label: '备注', width: 100, render: (v: string) => safeStr(v, '') },
    { key: 'productQty', label: '产品数量', width: 80, align: 'right' as const },
    { key: 'skuQty', label: 'SKU×数量', width: 100, render: (v: any, row: any) => row.items?.length ? `${row.items.length}×${row.productQty}` : (v ?? '-') },
    { key: 'productName', label: '产品名称', width: 160 },
    { key: 'category', label: '产品分类', width: 100 },
    { key: 'waveNo', label: '波次号', width: 130 },
    { key: 'labelPrinted', label: '面单打印', width: 80, render: (v: string) => (
      <span style={{ color: v === 'PRINTED' ? '#2e7d32' : '#9ca3af' }}>{v === 'PRINTED' ? '已打印' : '未打印'}</span>
    )},
    { key: 'customer', label: '客户', width: 120 },
    { key: 'orderType', label: '订单品种类型', width: 100 },
    { key: 'channel', label: '物流渠道', width: 100 },
    { key: 'status', label: '状态', width: 80, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdTime', label: '创建时间', width: 140, render: (v: string) => formatDate(v) },
    { key: 'actions', label: '操作', width: 160, fixed: 'right' as const, render: (_: any, row: any) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('outbound', row.id); }}>查看</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleCancelOrder(row.id); }}>取消</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handlePrintLabel(row.id); }}>打印面单</span>
        {['SHIPPING', 'READY'].includes(row.status) && (
          <>
            <span style={{ color: '#9ca3af' }}>|</span>
            <span style={{ color: '#2e7d32', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleShipOrder(row.id); }}>出库</span>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StatusTabs tabs={statusTabs} activeKey={statusTab} onChange={tab => { setStatusTab(tab); setPage(1); }} />
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />
      <ActionToolbar
        buttons={[
          { key: 'wave', label: '生成波次', primary: true, onClick: handleBatchWave, disabled: selectedKeys.size === 0 },
          { key: 'printPick', label: '打印拣货单', onClick: handlePrintPickList, disabled: selectedKeys.size === 0 },
          { key: 'export', label: '导出', onClick: handleExport },
        ]}
      />
      <DataTable
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading}
        error={error}
        selectedKeys={selectedKeys}
        onSelectChange={setSelectedKeys}
      />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
