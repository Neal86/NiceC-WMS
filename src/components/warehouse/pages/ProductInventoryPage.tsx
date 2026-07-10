import React, { useEffect, useState, useCallback } from 'react';
import { inventoryApi, metadataApi } from '../../../api';
import { normalizeListResponse, toNumber } from '../types';
import FilterBar from '../common/FilterBar';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import { WarehousePageProps } from '../types';

const adapter = (item: any) => ({
  id: item.id || item._id || '',
  sku: item.skuCode || item.sku || '-',
  barcode: item.skuBarcode || item.barcode || '-',
  productName: item.skuName || item.productName || item.name || '-',
  category: item.category || '-',
  customer: item.customerName || item.customer?.name || '-',
  attribute: item.attribute || item.inventoryAttr || '正品',
  totalQty: toNumber(item.totalQty ?? item.qty ?? item.availableQty ?? 0),
  availableQty: toNumber(item.availableQty ?? item.totalQty ?? 0),
  lockedQty: toNumber(item.lockedQty ?? item.reservedQty ?? 0),
});

export default function ProductInventoryPage({ currentUser }: WarehousePageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [hideZero, setHideZero] = useState(false);
  const [subTab, setSubTab] = useState('product');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let items: any[] = [];
      if (subTab === 'product') {
        const res = await inventoryApi.getInventory();
        items = normalizeListResponse(res);
      } else if (subTab === 'location') {
        const res = await inventoryApi.getInventory();
        items = normalizeListResponse(res);
      } else {
        const res = await inventoryApi.getInventory();
        items = normalizeListResponse(res);
      }
      let mapped = items.map(adapter);
      if (hideZero) mapped = mapped.filter(i => i.totalQty > 0);
      setTotal(mapped.length);
      setData(mapped);
    } catch (err: any) {
      setError(err?.message || '加载失败');
      setData([]);
    } finally { setLoading(false); }
  }, [subTab, hideZero]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterFields = [
    { type: 'select' as const, key: 'customerCode', label: '客户名称/代码', options: [] },
    { type: 'select' as const, key: 'attribute', label: '库存属性', options: [{ label: '正品', value: '正品' }, { label: '次品', value: '次品' }] },
    { type: 'select' as const, key: 'category', label: '产品分类', options: [] },
    { type: 'text' as const, key: 'barcode', label: 'Barcode-模糊搜索', placeholder: 'Barcode-模糊搜索', width: 150 },
  ];

  const summaryRow: Record<string, any> = {
    sku: '合计',
    totalQty: data.reduce((s, r) => s + r.totalQty, 0),
    availableQty: data.reduce((s, r) => s + r.availableQty, 0),
    lockedQty: data.reduce((s, r) => s + r.lockedQty, 0),
  };

  const columns = [
    { key: 'sku', label: 'SKU', width: 130, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'barcode', label: '产品条码', width: 130, render: (v: string) => <span style={{ color: '#315bea' }}>{v}</span> },
    { key: 'productName', label: '产品名称', width: 200 },
    { key: 'category', label: '产品分类', width: 100 },
    { key: 'customer', label: '客户', width: 120 },
    { key: 'attribute', label: '库存属性', width: 80, render: (v: string) => <span style={{ color: '#2e7d32' }}>{v}</span> },
    { key: 'totalQty', label: '总库存', width: 80, align: 'right' as const },
    { key: 'availableQty', label: '可用库存', width: 80, align: 'right' as const },
    { key: 'lockedQty', label: '锁定库存', width: 80, align: 'right' as const },
  ];

  const subTabs = [
    { key: 'product', label: '按产品查询' },
    { key: 'location', label: '按库位查询' },
    { key: 'flow', label: '库存流水' },
    { key: 'batch', label: '批次管理' },
  ];

  return (
    <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub tabs */}
      <div style={{ display: 'flex', height: 36, borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', alignItems: 'center', paddingLeft: 8, gap: 0 }}>
        {subTabs.map(tab => (
          <button key={tab.key} onClick={() => setSubTab(tab.key)} style={{
            position: 'relative',
            height: '100%',
            padding: '0 14px',
            fontSize: 12,
            color: subTab === tab.key ? '#315bea' : '#6b7280',
            fontWeight: subTab === tab.key ? 600 : 400,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: subTab === tab.key ? '2px solid #315bea' : '2px solid transparent',
          }}>{tab.label}</button>
        ))}
      </div>
      <FilterBar fields={filterFields} values={filters} onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); }} onReset={() => { setFilters({}); }} />
      {/* Hide zero checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <label style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} />
          隐藏 0 库存数据
        </label>
      </div>
      <DataTable columns={columns} data={data} rowKey="id" loading={loading} error={error} summaryRow={summaryRow} />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
