import { useState, useEffect, useCallback } from 'react';
import { Download, Plus, Search, RotateCcw, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';
import FormModal from '../shared/FormModal';
import { clientService } from '../../../services/client/clientService';
import type { PlatformAuth, OrderRule, ProductMapping } from '../../../types/client';
import { ActionButton, SearchInput, StatusTabs } from '../shared/PageLayout';

// ===== Platform Auth =====
const authTabs = [
  { label: '平台', key: 'platform' },
  { label: 'ERP', key: 'erp' },
];

const authColumns: Column<PlatformAuth>[] = [
  { key: 'platform', title: '平台/ERP名称', width: '120px', render: item => <span className="font-semibold">{item.platform}</span> },
  { key: 'storeName', title: '店铺名称', width: '130px' },
  { key: 'account', title: '账号', width: '150px' },
  { key: 'status', title: '状态', width: '80px', render: item => <StatusBadge status={item.status === 'active' ? '启用' : '停用'} /> },
  { key: 'syncStatus', title: '同步状态', width: '90px', render: item => <StatusBadge status={item.syncStatus} /> },
  { key: 'lastSyncTime', title: '最后同步', width: '150px', render: item => <span className="text-slate-500">{item.lastSyncTime}</span> },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export function PlatformAuthPage() {
  const [data, setData] = useState<PlatformAuth[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('platform');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PlatformAuth | null>(null);
  const [formData, setFormData] = useState<any>({});

  const load = useCallback(async () => {
    const result = await clientService.platformAuths.list({ page, pageSize: 20 });
    let items = result.data as PlatformAuth[];
    if (tab) items = items.filter(i => i.type === tab);
    if (search) items = items.filter(i => i.platform.toLowerCase().includes(search.toLowerCase()) || i.storeName.toLowerCase().includes(search.toLowerCase()));
    setData(items);
    setTotal(result.total);
  }, [page, tab, search]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (item: PlatformAuth) => { setEditItem(item); setFormData({ ...item }); setFormOpen(true); };
  const handleSave = async () => {
    try {
      if (editItem) { await clientService.platformAuths.update(editItem.id, formData); }
      else { await clientService.platformAuths.create({ ...formData, type: tab }); }
      setFormOpen(false); load();
    } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => { try { await clientService.platformAuths.delete(id); load(); } catch (e) { console.error(e); } };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">平台授权</h2>
        <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="添加授权" onClick={() => { setEditItem(null); setFormData({}); setFormOpen(true); }} />
      </div>
      <StatusTabs tabs={authTabs} activeTab={tab} onChange={v => { setTab(v); setPage(1); }} />
      <div className="bg-white p-3 border-b border-slate-200">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索平台/店铺..." />
      </div>
      <DataTable columns={authColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} onEdit={handleEdit} onDelete={handleDelete}
        getId={d => d.id} emptyMessage="暂无授权记录" />
      <FormModal open={formOpen} title={editItem ? '编辑授权' : '添加授权'} onClose={() => setFormOpen(false)} onSubmit={handleSave} width="500px">
        <div className="space-y-3">
          <div><label className="text-slate-400">平台/ERP</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.platform || ''} onChange={e => setFormData({ ...formData, platform: e.target.value })} /></div>
          <div><label className="text-slate-400">店铺名称</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.storeName || ''} onChange={e => setFormData({ ...formData, storeName: e.target.value })} /></div>
          <div><label className="text-slate-400">账号</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.account || ''} onChange={e => setFormData({ ...formData, account: e.target.value })} /></div>
          <div><label className="text-slate-400">API Key</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.apiKey || ''} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} /></div>
          <div><label className="text-slate-400">API Secret</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.apiSecret || ''} onChange={e => setFormData({ ...formData, apiSecret: e.target.value })} /></div>
        </div>
      </FormModal>
    </div>
  );
}

// ===== Order Rules =====
const ruleColumns: Column<OrderRule>[] = [
  { key: 'name', title: '规则名称', width: '130px', render: item => <span className="font-semibold">{item.name}</span> },
  { key: 'platform', title: '平台', width: '90px' },
  { key: 'priority', title: '优先级', width: '70px' },
  { key: 'status', title: '状态', width: '80px', render: item => <StatusBadge status={item.status === 'active' ? '启用' : '停用'} /> },
  { key: 'condition', title: '条件', width: '120px' },
  { key: 'action', title: '动作', width: '120px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
  { key: 'updatedTime', title: '更新时间', width: '150px', render: item => <span className="text-slate-500">{item.updatedTime}</span> },
];

export function OrderRulesPage() {
  const [data, setData] = useState<OrderRule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<OrderRule | null>(null);
  const [formData, setFormData] = useState<any>({});
  const load = useCallback(async () => {
    const result = await clientService.orderRules.list({ page, pageSize: 20 });
    setData(result.data as OrderRule[]); setTotal(result.total);
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const handleEdit = (item: OrderRule) => { setEditItem(item); setFormData({ ...item }); setFormOpen(true); };
  const handleSave = async () => {
    try {
      if (editItem) await clientService.orderRules.update(editItem.id, formData);
      else await clientService.orderRules.create(formData);
      setFormOpen(false); load();
    } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => { try { await clientService.orderRules.delete(id); load(); } catch (e) { console.error(e); } };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">平台订单规则</h2>
        <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建规则" onClick={() => { setEditItem(null); setFormData({}); setFormOpen(true); }} />
      </div>
      <DataTable columns={ruleColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} onEdit={handleEdit} onDelete={handleDelete}
        getId={d => d.id} emptyMessage="暂无订单规则" />
      <FormModal open={formOpen} title={editItem ? '编辑规则' : '新建规则'} onClose={() => setFormOpen(false)} onSubmit={handleSave}>
        <div className="space-y-3">
          <div><label className="text-slate-400">规则名称</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">平台</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.platform || ''} onChange={e => setFormData({ ...formData, platform: e.target.value })} /></div>
            <div><label className="text-slate-400">优先级</label><input type="number" className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.priority || ''} onChange={e => setFormData({ ...formData, priority: +e.target.value })} /></div>
          </div>
          <div><label className="text-slate-400">条件</label><textarea className="w-full mt-1 h-16 px-2 border border-slate-300 rounded text-[11px]" value={formData.condition || ''} onChange={e => setFormData({ ...formData, condition: e.target.value })} /></div>
          <div><label className="text-slate-400">动作</label><textarea className="w-full mt-1 h-16 px-2 border border-slate-300 rounded text-[11px]" value={formData.action || ''} onChange={e => setFormData({ ...formData, action: e.target.value })} /></div>
        </div>
      </FormModal>
    </div>
  );
}

// ===== Product Mapping =====
const mappingColumns: Column<ProductMapping>[] = [
  { key: 'platformSku', title: '平台SKU', width: '130px', render: item => <span className="font-mono font-semibold text-blue-600">{item.platformSku}</span> },
  { key: 'systemSku', title: '系统SKU', width: '130px', render: item => <span className="font-mono">{item.systemSku}</span> },
  { key: 'productName', title: '产品名称', width: '150px' },
  { key: 'platform', title: '平台', width: '90px' },
  { key: 'status', title: '状态', width: '80px', render: item => <StatusBadge status={item.status === 'matched' ? '已匹配' : '未匹配'} /> },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export function ProductMappingPage() {
  const [data, setData] = useState<ProductMapping[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    const result = await clientService.productMappings.list({ page, pageSize: 20, search: search || undefined });
    setData(result.data as ProductMapping[]); setTotal(result.total);
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">产品配对</h2>
        <div className="flex items-center gap-2">
          <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="手动匹配" variant="default" />
          <ActionButton icon={<RefreshCw className="w-3.5 h-3.5" />} label="批量匹配" variant="default" />
        </div>
      </div>
      <div className="bg-white p-3 border-b border-slate-200">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索SKU..." />
      </div>
      <DataTable columns={mappingColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} getId={d => d.id} emptyMessage="暂无产品配对数据" />
    </div>
  );
}
