import { useState, useEffect, useCallback } from 'react';
import { Download, Upload, Plus, Search, RotateCcw, RefreshCw, Printer, AlertTriangle } from 'lucide-react';
import DataTable, { Column } from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';
import FormModal from '../shared/FormModal';
import { clientService } from '../../../services/client/clientService';
import type { ClientProduct } from '../../../types/client';
import { StatusTabs, ActionButton, SearchInput } from '../shared/PageLayout';

const statusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '审核中', key: '审核中' },
  { label: '已审核', key: '已审核' },
  { label: '已驳回', key: '已驳回' },
  { label: '废弃', key: '废弃' },
];

const columns: Column<ClientProduct>[] = [
  { key: 'image', title: '图片', width: '60px', render: () => <div className="w-8 h-8 bg-slate-100 rounded border border-slate-200" /> },
  { key: 'sku', title: 'SKU', width: '130px', render: item => <span className="font-mono font-semibold text-blue-600">{item.sku}</span> },
  { key: 'name', title: '产品名称', width: '130px' },
  { key: 'category', title: '分类', width: '80px' },
  { key: 'brand', title: '品牌', width: '80px' },
  { key: 'status', title: '状态', width: '80px', render: item => <StatusBadge status={item.status} /> },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'totalStock', title: '库存', width: '60px', render: item => <span className="font-semibold">{item.totalStock}</span> },
  { key: 'price', title: '价格', width: '80px', render: item => <span>${item.price.toFixed(2)}</span> },
  { key: 'barcode', title: '条码', width: '120px', render: item => <span className="font-mono text-slate-500">{item.barcode}</span> },
  { key: 'weight', title: '重量(kg)', width: '80px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export default function ProductManagement() {
  const [data, setData] = useState<ClientProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClientProduct | null>(null);
  const [formData, setFormData] = useState<any>({});

  const load = useCallback(async () => {
    const result = await clientService.products.list({ page, pageSize: 20, status: status || undefined, search: search || undefined });
    setData(result.data as ClientProduct[]);
    setTotal(result.total);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (item: ClientProduct) => {
    setEditItem(item);
    setFormData({ ...item });
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormData({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await clientService.products.update(editItem.id, formData);
      } else {
        await clientService.products.create(formData);
      }
      setFormOpen(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try { await clientService.products.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    const csv = ['SKU,产品名称,分类,品牌,状态,仓库,库存,价格,条码,重量(kg)',
      ...data.map(r => `${r.sku},${r.name},${r.category},${r.brand},${r.status},${r.warehouse},${r.totalStock},${r.price},${r.barcode},${r.weight}`)].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '产品管理.csv'; a.click();
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">产品管理</h2>
        <div className="flex items-center gap-2">
          <ActionButton icon={<Upload className="w-3.5 h-3.5" />} label="导入" variant="default" />
          <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" onClick={handleExport} variant="default" />
          <ActionButton icon={<Printer className="w-3.5 h-3.5" />} label="打印条码" variant="default" />
          <ActionButton icon={<AlertTriangle className="w-3.5 h-3.5" />} label="设置预警" variant="default" />
          <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建" onClick={handleCreate} />
        </div>
      </div>

      <StatusTabs tabs={statusTabs} activeTab={status} onChange={v => { setStatus(v); setPage(1); }} />

      <div className="bg-white p-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索SKU/产品名称..." />
          <ActionButton icon={<Search className="w-3.5 h-3.5" />} label="查询" onClick={() => load()} />
          <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="重置" onClick={() => { setStatus(''); setSearch(''); setPage(1); }} variant="default" />
          <ActionButton icon={<RefreshCw className="w-3.5 h-3.5" />} label="刷新" onClick={() => load()} variant="default" />
        </div>
      </div>

      <DataTable
        columns={columns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} selectedIds={selectedIds}
        onSelectAll={checked => setSelectedIds(checked ? data.map(d => d.id) : [])}
        onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
        onEdit={handleEdit} onDelete={handleDelete} getId={d => d.id}
        emptyMessage="暂无产品数据" />

      <FormModal open={formOpen} title={editItem ? '编辑产品' : '新建产品'} onClose={() => setFormOpen(false)} onSubmit={handleSave} width="600px">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">SKU</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })} /></div>
            <div><label className="text-slate-400">产品名称</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">分类</label>
              <select className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option>电子产品</option><option>服装</option><option>家居用品</option><option>美妆</option><option>食品</option>
              </select></div>
            <div><label className="text-slate-400">品牌</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-slate-400">条码</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} /></div>
            <div><label className="text-slate-400">重量(kg)</label><input type="number" step="0.01" className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: +e.target.value })} /></div>
            <div><label className="text-slate-400">价格</label><input type="number" step="0.01" className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: +e.target.value })} /></div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
