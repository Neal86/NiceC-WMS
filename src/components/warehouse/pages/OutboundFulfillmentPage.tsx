import React, { useEffect, useState, useCallback, useRef } from 'react';
import { outboundApi, metadataApi } from '../../../api';
import { normalizeListResponse, formatDate, safeStr } from '../types';
import StatusTabs from '../common/StatusTabs';
import FilterBar from '../common/FilterBar';
import ActionToolbar from '../common/ActionToolbar';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import StatusBadge from '../common/StatusBadge';
import { WarehousePageProps } from '../types';

const statusDefs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'picking', label: '待拣货' },
  { key: 'review', label: '待复核' },
  { key: 'shipping', label: '待出库' },
  { key: 'shipped', label: '已出库' },
  { key: 'exception', label: '异常' },
  { key: 'cancelled', label: '已取消' },
];

const statusFilterMap: Record<string, string[]> = {
  pending: ['PENDING', 'NEW'],
  picking: ['PICKING', 'PICK'],
  review: ['REVIEW', 'REVIEWS'],
  shipping: ['SHIPPING', 'READY'],
  shipped: ['SHIPPED', 'DONE', 'COMPLETED'],
  exception: ['EXCEPTION', 'EXCEPTIONS'],
  cancelled: ['CANCELLED', 'CANCELED', 'VOIDED'],
};

const adapter = (item: any) => {
  const items = item.items || [];
  const barcodeQtyStr = items.length > 1
    ? `多个(${items.length})`
    : items.length === 1
      ? `${items[0].skuBarcode || items[0].barcode || ''} × ${items[0].qty ?? items[0].quantity ?? 0}`
      : '-';
  return {
    id: item.id || item._id || item.orderNo || '',
    orderNo: item.orderNo || item.no || '-',
    remark: item.remark || item.notes || '',
    productQty: item.totalQty ?? item.productQty ?? item.qty ?? 0,
    skuQty: item.skuQty ?? item.skuCount ?? (items.length ? `${items.length}×${items.reduce((s: number, i: any) => s + (i.qty || 0), 0)}` : '-'),
    productBarcodeQty: barcodeQtyStr,
    items,
    productName: items.length ? items.map((i: any) => i.productName || i.name).filter(Boolean).join(', ') : item.productName || '',
    category: items.length ? items.map((i: any) => i.category).filter(Boolean).join(', ') : item.category || '',
    waveNo: item.waveNo || item.wave?.waveNo || '',
    labelPrinted: item.labelPrinted || 'NOT_PRINTED',
    customer: item.customerName || item.customerCode || item.customer?.name || '-',
    orderType: item.orderType || item.type || '',
    channel: item.logisticsChannelName || item.channel || '',
    status: item.status || 'PENDING',
    createdTime: item.createdTime || item.createdAt || '',
  };
};

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
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [channels, setChannels] = useState<{ label: string; value: string }[]>([]);
  const [carriers, setCarriers] = useState<{ label: string; value: string }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    metadataApi.getCustomers().then((res: any) => {
      const arr = normalizeListResponse(res);
      setCustomers(arr.map((c: any) => ({ label: `${c.name}(${c.code})`, value: c.code || c.id })));
    }).catch(() => {});
    metadataApi.getLogisticsChannels().then((res: any) => {
      const arr = normalizeListResponse(res);
      setChannels(arr.map((c: any) => ({ label: c.name, value: c.id })));
    }).catch(() => {});
    metadataApi.getCarriers().then((res: any) => {
      const arr = normalizeListResponse(res);
      setCarriers(arr.map((c: any) => ({ label: c.name, value: c.id })));
    }).catch(() => {});
  }, []);

  const computeStatusCounts = useCallback((items: any[]) => {
    const counts: Record<string, number> = { all: items.length };
    statusDefs.forEach(def => {
      if (def.key === 'all') return;
      const statuses = statusFilterMap[def.key] || [];
      counts[def.key] = items.filter((item: any) => statuses.includes(String(item.status).toUpperCase())).length;
    });
    setStatusCounts(counts);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, any> = { page, pageSize };
      if (currentUser?.warehouseId) params.warehouseId = currentUser.warehouseId;
      if (statusTab !== 'all') params.status = statusTab.toUpperCase();
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await outboundApi.getOrders(params);
      const items = normalizeListResponse(res);
      setTotal(res?.total ?? items.length);
      const mapped = items.map(adapter);
      setData(mapped);
      computeStatusCounts(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '加载失败');
      setData([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusTab, filters, currentUser?.warehouseId, computeStatusCounts]);

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
    setOpenDropdownId(null);
    if (!confirm('确认取消此出库单？')) return;
    try {
      await outboundApi.cancelOrder(id);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '取消失败');
    }
  };

  const handleShipOrder = async (id: string) => {
    setOpenDropdownId(null);
    if (!confirm('确认出库？')) return;
    try {
      await outboundApi.shipOrder(id);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || '出库失败');
    }
  };

  const handlePrintLabel = async (id: string) => {
    setOpenDropdownId(null);
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
    { type: 'select' as const, key: 'carrier', label: '承运商', options: carriers },
    { type: 'select' as const, key: 'productCategory', label: '产品分类', options: [] },
    { type: 'text' as const, key: 'destinationCountry', label: '目的国家', placeholder: '目的国家' },
    { type: 'text' as const, key: 'warehouseZone', label: '库区', placeholder: '库区' },
    { type: 'select' as const, key: 'metricUnit', label: '公制单位', options: [{ label: 'kg', value: 'kg' }, { label: 'lb', value: 'lb' }] },
    { type: 'text' as const, key: 'location', label: '库位', placeholder: '库位' },
    { type: 'text' as const, key: 'skuQtyExplosive', label: 'SKU×数量(爆品)', placeholder: 'SKU×数量(爆品)' },
    { type: 'text' as const, key: 'recipient', label: '收件人', placeholder: '收件人' },
    { type: 'text' as const, key: 'sku', label: 'SKU', placeholder: 'SKU' },
    { type: 'text' as const, key: 'outboundOrderNo', label: '出库单号', placeholder: '出库单号' },
    { type: 'date' as const, key: 'createdTime', label: '创建时间' },
    { type: 'text' as const, key: 'totalWeight', label: '订单总重量', placeholder: '重量', width: 100 },
    { type: 'text' as const, key: 'minQty', label: '最小数量', placeholder: '最小', width: 80 },
    { type: 'text' as const, key: 'maxQty', label: '最大数量', placeholder: '最大', width: 80 },
    { type: 'select' as const, key: 'favoriteFilter', label: '常用筛选', options: [] },
  ];

  const columns = [
    { key: 'orderNo', label: '出库单号', width: 150, render: (v: string, row: any) => (
      <span
        style={{ color: '#315bea', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onNavigate?.('outbound', row.id); }}
      >
        {v}
      </span>
    )},
    { key: 'remark', label: '备注', width: 90, render: (v: string) => safeStr(v, '') },
    { key: 'productQty', label: '产品数量', width: 75, align: 'right' as const },
    { key: 'skuQty', label: 'SKU×数量', width: 90 },
    { key: 'productBarcodeQty', label: '产品条码×数量', width: 130, render: (v: string, row: any) => {
      if (row.items?.length > 1) {
        return <span style={{ color: '#315bea', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); }}>{v}</span>;
      }
      return <span>{v}</span>;
    }},
    { key: 'productName', label: '产品名称', width: 150 },
    { key: 'category', label: '产品分类', width: 90 },
    { key: 'waveNo', label: '波次号', width: 120 },
    { key: 'labelPrinted', label: '面单打印', width: 75, render: (v: string) => (
      <span style={{ color: v === 'PRINTED' ? '#2e7d32' : '#9ca3af' }}>{v === 'PRINTED' ? '已打印' : '未打印'}</span>
    )},
    { key: 'customer', label: '客户', width: 110 },
    { key: 'orderType', label: '订单品种类型', width: 95 },
    { key: 'channel', label: '物流渠道', width: 95 },
    { key: 'actions', label: '操作', width: 140, fixed: 'right' as const, render: (_: any, row: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
        <span style={{ color: '#315bea', cursor: 'pointer', fontSize: 12 }}
          onClick={(e) => { e.stopPropagation(); onNavigate?.('outbound', row.id); }}>
          编辑
        </span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <div style={{ position: 'relative' }}>
          <span style={{ color: '#315bea', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}
            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === row.id ? null : row.id); }}>
            操作
            <svg width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </span>
          {openDropdownId === row.id && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 100,
              backgroundColor: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minWidth: 100, padding: '4px 0',
            }}>
              {[
                { label: '查看详情', action: () => { setOpenDropdownId(null); onNavigate?.('outbound', row.id); } },
                { label: '取消', action: () => handleCancelOrder(row.id) },
                { label: '打印面单', action: () => handlePrintLabel(row.id) },
                ...(['SHIPPING', 'READY'].includes(row.status) ? [{ label: '出库', action: () => handleShipOrder(row.id) }] : []),
              ].map(item => (
                <div key={item.label}
                  onClick={(e) => { e.stopPropagation(); item.action(); }}
                  style={{
                    padding: '5px 12px', fontSize: 12, color: '#374151',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )},
  ];

  const statusTabsWithCounts = statusDefs.map(def => ({
    ...def,
    count: statusCounts[def.key] ?? 0,
  }));

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StatusTabs tabs={statusTabsWithCounts} activeKey={statusTab} onChange={tab => { setStatusTab(tab); setPage(1); }} />
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />
      <ActionToolbar
        buttons={[
          { key: 'wave', label: '生成波次', primary: true, onClick: handleBatchWave, disabled: selectedKeys.size === 0 },
          { key: 'waveRule', label: '波次规则', onClick: () => alert('功能开发中') },
          { key: 'labelManage', label: '面单管理', onClick: () => alert('功能开发中') },
          { key: 'printPick', label: '打印发货清单', onClick: handlePrintPickList, disabled: selectedKeys.size === 0 },
          { key: 'import', label: '导入', onClick: () => alert('功能开发中') },
          { key: 'exportAttach', label: '导出附件', onClick: () => alert('功能开发中') },
          { key: 'export', label: '导出', onClick: handleExport },
          { key: 'more', label: '更多', onClick: () => alert('功能开发中') },
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
