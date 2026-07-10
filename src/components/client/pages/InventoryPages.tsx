import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '../shared/DataTable';
import { clientService } from '../../../services/client/clientService';
import type { ProductInventory, CartonInventory, ReturnInventory, CombinedInventory, ProductAging } from '../../../types/client';
import { ActionButton, SearchInput } from '../shared/PageLayout';

// ===== Product Inventory =====
const productColumns: Column<ProductInventory>[] = [
  { key: 'image', title: '图片', width: '60px', render: () => <div className="w-8 h-8 bg-slate-100 rounded border border-slate-200" /> },
  { key: 'sku', title: 'SKU', width: '120px', render: item => <span className="font-mono font-semibold text-blue-600">{item.sku}</span> },
  { key: 'name', title: '产品名称', width: '130px' },
  { key: 'category', title: '产品分类', width: '90px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'attributes', title: '库存属性', width: '80px' },
  { key: 'totalStock', title: '总库存', width: '70px', render: item => <span className="font-semibold">{item.totalStock}</span> },
  { key: 'availableStock', title: '可用库存', width: '70px', render: item => <span className="font-semibold text-emerald-600">{item.availableStock}</span> },
  { key: 'warningStock', title: '预警库存', width: '70px', render: item => <span className="text-amber-600">{item.warningStock}</span> },
  { key: 'warningDiff', title: '预警差额', width: '70px', render: item => <span className={item.warningDiff < 0 ? 'text-red-600 font-semibold' : 'text-slate-600'}>{item.warningDiff}</span> },
  { key: 'lockedStock', title: '锁定库存', width: '70px', render: item => <span className="text-slate-500">{item.lockedStock}</span> },
  { key: 'inTransit', title: '在途库存', width: '70px', render: item => <span className="text-blue-600">{item.inTransit}</span> },
  { key: 'total', title: '合计', width: '70px', render: item => <span className="font-bold">{item.total}</span> },
];

export function ProductInventoryPage() {
  const [data, setData] = useState<ProductInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hideZero, setHideZero] = useState(true);

  const load = useCallback(async () => {
    const result = await clientService.productInventory.list({ page, pageSize: 20, search: search || undefined });
    let items = result.data as ProductInventory[];
    if (hideZero) items = items.filter(i => i.totalStock > 0);
    setData(items);
    setTotal(result.total);
  }, [page, search, hideZero]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const csv = ['SKU,产品名称,分类,仓库,总库存,可用库存,预警库存,预警差额,锁定库存,在途库存,合计',
      ...data.map(r => `${r.sku},${r.name},${r.category},${r.warehouse},${r.totalStock},${r.availableStock},${r.warningStock},${r.warningDiff},${r.lockedStock},${r.inTransit},${r.total}`)].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '产品库存.csv'; a.click();
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">产品库存</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} className="w-3 h-3" />
            隐藏零库存数据
          </label>
          <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" onClick={handleExport} variant="default" />
          <ActionButton icon={<RefreshCw className="w-3.5 h-3.5" />} label="刷新" onClick={() => load()} variant="default" />
        </div>
      </div>
      <div className="bg-white p-3 border-b border-slate-200">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索SKU/产品名称..." />
      </div>
      <DataTable columns={productColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} getId={d => d.id} emptyMessage="暂无产品库存数据" />
    </div>
  );
}

// ===== Carton Inventory =====
const cartonColumns: Column<CartonInventory>[] = [
  { key: 'cartonNo', title: '箱号', width: '120px', render: item => <span className="font-mono font-semibold text-blue-600">{item.cartonNo}</span> },
  { key: 'sku', title: 'SKU', width: '120px', render: item => <span className="font-mono">{item.sku}</span> },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'location', title: '库位', width: '100px' },
  { key: 'qty', title: '数量', width: '60px', render: item => <span className="font-semibold">{item.qty}</span> },
  { key: 'status', title: '状态', width: '80px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export function CartonInventoryPage() {
  const [data, setData] = useState<CartonInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const result = await clientService.cartonInventory.list({ page, pageSize: 20 });
    setData(result.data as CartonInventory[]);
    setTotal(result.total);
  }, [page]);
  useEffect(() => { load(); }, [load]);
  return <div className="bg-white rounded-md border border-slate-200 flex flex-col">
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
      <h2 className="text-sm font-bold text-slate-800">箱库存</h2>
    </div>
    <DataTable columns={cartonColumns} data={data} total={total} page={page} pageSize={20}
      onPageChange={setPage} getId={d => d.id} emptyMessage="暂无箱库存数据" />
  </div>;
}

// ===== Return Inventory =====
const returnInvColumns: Column<ReturnInventory>[] = [
  { key: 'sku', title: 'SKU', width: '120px', render: item => <span className="font-mono font-semibold text-blue-600">{item.sku}</span> },
  { key: 'name', title: '产品名称', width: '130px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'qty', title: '总数量', width: '70px', render: item => <span className="font-semibold">{item.qty}</span> },
  { key: 'sellableQty', title: '可销售', width: '70px', render: item => <span className="font-semibold text-emerald-600">{item.sellableQty}</span> },
  { key: 'unsellableQty', title: '不可销售', width: '70px', render: item => <span className="text-red-500">{item.unsellableQty}</span> },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export function ReturnInventoryPage() {
  const [data, setData] = useState<ReturnInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const result = await clientService.returnInventory.list({ page, pageSize: 20 });
    setData(result.data as ReturnInventory[]);
    setTotal(result.total);
  }, [page]);
  useEffect(() => { load(); }, [load]);
  return <div className="bg-white rounded-md border border-slate-200 flex flex-col">
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
      <h2 className="text-sm font-bold text-slate-800">退货库存</h2>
    </div>
    <DataTable columns={returnInvColumns} data={data} total={total} page={page} pageSize={20}
      onPageChange={setPage} getId={d => d.id} emptyMessage="暂无退货库存数据" />
  </div>;
}

// ===== Combined Inventory =====
const combinedColumns: Column<CombinedInventory>[] = [
  { key: 'sku', title: 'SKU', width: '120px', render: item => <span className="font-mono font-semibold text-blue-600">{item.sku}</span> },
  { key: 'name', title: '产品名称', width: '130px' },
  { key: 'productStock', title: '产品库存', width: '80px', render: item => <span className="font-semibold">{item.productStock}</span> },
  { key: 'cartonStock', title: '箱库存', width: '80px', render: item => <span className="font-semibold">{item.cartonStock}</span> },
  { key: 'returnStock', title: '退货库存', width: '80px', render: item => <span className="font-semibold">{item.returnStock}</span> },
  { key: 'total', title: '合计', width: '70px', render: item => <span className="font-bold text-blue-600">{item.total}</span> },
];

export function CombinedInventoryPage() {
  const [data, setData] = useState<CombinedInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const result = await clientService.combinedInventory.list({ page, pageSize: 20 });
    setData(result.data as CombinedInventory[]);
    setTotal(result.total);
  }, [page]);
  useEffect(() => { load(); }, [load]);
  return <div className="bg-white rounded-md border border-slate-200 flex flex-col">
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
      <h2 className="text-sm font-bold text-slate-800">综合库存</h2>
    </div>
    <DataTable columns={combinedColumns} data={data} total={total} page={page} pageSize={20}
      onPageChange={setPage} getId={d => d.id} emptyMessage="暂无综合库存数据" />
  </div>;
}

// ===== Aging Pages (shared component) =====
const agingColumns: Column<ProductAging>[] = [
  { key: 'sku', title: 'SKU', width: '120px', render: item => <span className="font-mono font-semibold text-blue-600">{item.sku}</span> },
  { key: 'name', title: '产品名称', width: '130px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'qty', title: '数量', width: '60px', render: item => <span className="font-semibold">{item.qty}</span> },
  { key: 'daysInStock', title: '库龄(天)', width: '80px', render: item => {
    const color = item.daysInStock > 180 ? 'text-red-600' : item.daysInStock > 90 ? 'text-amber-600' : 'text-slate-700';
    return <span className={`font-semibold ${color}`}>{item.daysInStock}天</span>;
  }},
  { key: 'location', title: '库位', width: '100px' },
  { key: 'lastMoveTime', title: '最后移动时间', width: '150px', render: item => <span className="text-slate-500">{item.lastMoveTime}</span> },
];

function AgingPageBase({ title, service }: { title: string; service: any }) {
  const [data, setData] = useState<ProductAging[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const result = await service.list({ page, pageSize: 20 });
    setData(result.data as ProductAging[]);
    setTotal(result.total);
  }, [page, service]);
  useEffect(() => { load(); }, [load]);
  return <div className="bg-white rounded-md border border-slate-200 flex flex-col">
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
    </div>
    <DataTable columns={agingColumns} data={data} total={total} page={page} pageSize={20}
      onPageChange={setPage} getId={d => d.id} emptyMessage={`暂无${title}数据`} />
  </div>;
}

export function ProductAgingPage() { return <AgingPageBase title="产品库龄" service={clientService.productAging} />; }
export function CartonAgingPage() { return <AgingPageBase title="箱库龄" service={clientService.cartonAging} />; }
export function ReturnAgingPage() { return <AgingPageBase title="退货库龄" service={clientService.returnAging} />; }
