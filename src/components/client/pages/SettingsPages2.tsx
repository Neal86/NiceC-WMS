import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RotateCcw, RefreshCw, Download } from 'lucide-react';
import DataTable, { Column } from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';
import FormModal from '../shared/FormModal';
import { clientService } from '../../../services/client/clientService';
import type { ClientAccount, ClientRole, Address, LoginLog, UnitSettings } from '../../../types/client';
import { ActionButton, SearchInput, SelectFilter, DateRangeFilter } from '../shared/PageLayout';

// ===== Accounts =====
const accColumns: Column<ClientAccount>[] = [
  { key: 'username', title: '用户名', width: '100px', render: item => <span className="font-semibold">{item.username}</span> },
  { key: 'email', title: '邮箱', width: '180px' },
  { key: 'role', title: '角色', width: '80px' },
  { key: 'status', title: '状态', width: '80px', render: item => <StatusBadge status={item.status === 'active' ? '启用' : '停用'} /> },
  { key: 'lastLogin', title: '最后登录', width: '150px', render: item => <span className="text-slate-500">{item.lastLogin}</span> },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export function ClientAccountsPage() {
  const [data, setData] = useState<ClientAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClientAccount | null>(null);
  const [formData, setFormData] = useState<any>({});
  const load = useCallback(async () => {
    const result = await clientService.clientAccounts.list({ page, pageSize: 20 });
    setData(result.data as ClientAccount[]); setTotal(result.total);
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const handleEdit = (item: ClientAccount) => { setEditItem(item); setFormData({ ...item }); setFormOpen(true); };
  const handleSave = async () => {
    try {
      if (editItem) await clientService.clientAccounts.update(editItem.id, formData);
      else await clientService.clientAccounts.create(formData);
      setFormOpen(false); load();
    } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => { try { await clientService.clientAccounts.delete(id); load(); } catch (e) { console.error(e); } };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">账号管理</h2>
        <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建账号" onClick={() => { setEditItem(null); setFormData({}); setFormOpen(true); }} />
      </div>
      <DataTable columns={accColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} onEdit={handleEdit} onDelete={handleDelete}
        getId={d => d.id} emptyMessage="暂无账号" />
      <FormModal open={formOpen} title={editItem ? '编辑账号' : '新建账号'} onClose={() => setFormOpen(false)} onSubmit={handleSave}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">用户名</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} /></div>
            <div><label className="text-slate-400">邮箱</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">角色</label>
              <select className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <option>管理员</option><option>运营</option><option>财务</option><option>客服</option>
              </select></div>
            <div><label className="text-slate-400">密码</label><input type="password" className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// ===== Roles =====
const roleColumns: Column<ClientRole>[] = [
  { key: 'name', title: '角色名称', width: '100px', render: item => <span className="font-semibold">{item.name}</span> },
  { key: 'description', title: '描述', width: '150px' },
  { key: 'accountCount', title: '关联账号数', width: '100px', render: item => <span className="font-mono">{item.accountCount}</span> },
  { key: 'updatedBy', title: '最后更新人', width: '100px' },
  { key: 'updatedTime', title: '最后更新时间', width: '150px', render: item => <span className="text-slate-500">{item.updatedTime}</span> },
];

const allPermissionGroups = [
  { group: '订单', perms: ['order:view', 'order:create', 'order:edit', 'order:delete', 'order:export'] },
  { group: '入库', perms: ['inbound:view', 'inbound:create', 'inbound:edit', 'inbound:delete'] },
  { group: '库存', perms: ['inventory:view', 'inventory:export'] },
  { group: '产品', perms: ['product:view', 'product:create', 'product:edit', 'product:delete'] },
  { group: '设置', perms: ['setting:view', 'setting:edit'] },
];

export function ClientRolesPage() {
  const [data, setData] = useState<ClientRole[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClientRole | null>(null);
  const [formData, setFormData] = useState<any>({});
  const load = useCallback(async () => {
    const result = await clientService.clientRoles.list({ page, pageSize: 20 });
    setData(result.data as ClientRole[]); setTotal(result.total);
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const handleEdit = (item: ClientRole) => { setEditItem(item); setFormData({ ...item, permissions: [...(item.permissions || [])] }); setFormOpen(true); };
  const handleSave = async () => {
    try {
      if (editItem) await clientService.clientRoles.update(editItem.id, formData);
      else await clientService.clientRoles.create(formData);
      setFormOpen(false); load();
    } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => { try { await clientService.clientRoles.delete(id); load(); } catch (e) { console.error(e); } };

  const togglePermission = (perm: string) => {
    setFormData((prev: any) => {
      const perms = prev.permissions || [];
      return { ...prev, permissions: perms.includes(perm) ? perms.filter((p: string) => p !== perm) : [...perms, perm] };
    });
  };

  const toggleGroup = (groupPerms: string[]) => {
    setFormData((prev: any) => {
      const perms = prev.permissions || [];
      const allSelected = groupPerms.every((p: string) => perms.includes(p));
      return {
        ...prev,
        permissions: allSelected ? perms.filter((p: string) => !groupPerms.includes(p)) : [...new Set([...perms, ...groupPerms])]
      };
    });
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">角色管理</h2>
        <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建角色" onClick={() => { setEditItem(null); setFormData({ permissions: [] }); setFormOpen(true); }} />
      </div>
      <DataTable columns={roleColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} onEdit={handleEdit} onDelete={handleDelete}
        getId={d => d.id} emptyMessage="暂无角色数据" />
      <FormModal open={formOpen} title={editItem ? '编辑角色' : '新建角色'} onClose={() => setFormOpen(false)} onSubmit={handleSave} width="550px">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">角色名称</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><label className="text-slate-400">描述</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <div>
            <label className="text-slate-400 mb-2 block">权限设置</label>
            <div className="border border-slate-200 rounded p-2 space-y-2">
              {allPermissionGroups.map(group => (
                <div key={group.group}>
                  <div className="flex items-center gap-2 mb-1">
                    <input type="checkbox" checked={group.perms.every(p => (formData.permissions || []).includes(p))}
                      onChange={() => toggleGroup(group.perms)} className="w-3 h-3" />
                    <span className="text-xs font-semibold text-slate-700">{group.group}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-5">
                    {group.perms.map(perm => (
                      <label key={perm} className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                        <input type="checkbox" checked={(formData.permissions || []).includes(perm)}
                          onChange={() => togglePermission(perm)} className="w-2.5 h-2.5" />
                        {perm.split(':')[1]}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// ===== Address Book =====
const addressTypeOptions = [
  { label: '仓库地址', value: 'warehouse' },
  { label: 'FBA仓库地址', value: 'fba' },
  { label: '退件地址', value: 'return' },
  { label: '其他地址', value: 'other' },
];

const addressColumns: Column<Address>[] = [
  { key: 'name', title: '地址名称', width: '110px', render: item => <span className="font-semibold">{item.name}{item.isDefault ? <span className="text-blue-500 ml-1 text-[10px]">[默认]</span> : ''}</span> },
  { key: 'type', title: '类型', width: '90px', render: item => <StatusBadge status={{ warehouse: '仓库地址', fba: 'FBA仓库地址', return: '退件地址', other: '其他地址' }[item.type] || ''} /> },
  { key: 'contact', title: '联系人', width: '80px' },
  { key: 'phone', title: '电话', width: '120px' },
  { key: 'address', title: '地址', width: '200px' },
  { key: 'city', title: '城市', width: '80px' },
  { key: 'state', title: '州/省', width: '60px' },
  { key: 'country', title: '国家', width: '60px' },
  { key: 'zipCode', title: '邮编', width: '80px' },
];

export function AddressBookPage() {
  const [data, setData] = useState<Address[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Address | null>(null);
  const [formData, setFormData] = useState<any>({});
  const load = useCallback(async () => {
    const result = await clientService.addresses.list({ page, pageSize: 20 });
    let items = result.data as Address[];
    if (type) items = items.filter(i => i.type === type);
    if (search) items = items.filter(i => i.name.includes(search) || i.contact?.includes(search));
    setData(items); setTotal(result.total);
  }, [page, type, search]);
  useEffect(() => { load(); }, [load]);
  const handleEdit = (item: Address) => { setEditItem(item); setFormData({ ...item }); setFormOpen(true); };
  const handleSave = async () => {
    try {
      if (editItem) await clientService.addresses.update(editItem.id, formData);
      else await clientService.addresses.create(formData);
      setFormOpen(false); load();
    } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => { try { await clientService.addresses.delete(id); load(); } catch (e) { console.error(e); } };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">地址簿</h2>
        <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建地址" onClick={() => { setEditItem(null); setFormData({}); setFormOpen(true); }} />
      </div>
      <div className="bg-white p-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SelectFilter value={type} onChange={v => { setType(v); setPage(1); }} options={addressTypeOptions} placeholder="全部类型" />
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索地址名称/联系人..." />
          <ActionButton icon={<Search className="w-3.5 h-3.5" />} label="查询" onClick={() => load()} />
          <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="重置" onClick={() => { setType(''); setSearch(''); setPage(1); }} variant="default" />
        </div>
      </div>
      <DataTable columns={addressColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} onEdit={handleEdit} onDelete={handleDelete}
        getId={d => d.id} emptyMessage="暂无地址" />
      <FormModal open={formOpen} title={editItem ? '编辑地址' : '新建地址'} onClose={() => setFormOpen(false)} onSubmit={handleSave} width="600px">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">地址名称</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><label className="text-slate-400">类型</label>
              <select className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="warehouse">仓库地址</option><option value="fba">FBA仓库地址</option>
                <option value="return">退件地址</option><option value="other">其他地址</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">联系人</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.contact || ''} onChange={e => setFormData({ ...formData, contact: e.target.value })} /></div>
            <div><label className="text-slate-400">电话</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
          </div>
          <div><label className="text-slate-400">地址</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-slate-400">城市</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
            <div><label className="text-slate-400">州/省</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} /></div>
            <div><label className="text-slate-400">国家</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} /></div>
            <div><label className="text-slate-400">邮编</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={formData.zipCode || ''} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={formData.isDefault || false} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="w-3 h-3" />
            设为默认地址
          </label>
        </div>
      </FormModal>
    </div>
  );
}

// ===== Login Logs =====
const logColumns: Column<LoginLog>[] = [
  { key: 'source', title: '登录来源', width: '80px' },
  { key: 'account', title: '登录账号', width: '100px' },
  { key: 'ip', title: '登录IP', width: '130px', render: item => <span className="font-mono text-slate-500">{item.ip}</span> },
  { key: 'device', title: '登录设备', width: '130px' },
  { key: 'status', title: '状态', width: '70px', render: item => <StatusBadge status={item.status} /> },
  { key: 'loginTime', title: '登录时间', width: '160px', render: item => <span className="text-slate-500">{item.loginTime}</span> },
];

export function LoginLogsPage() {
  const [data, setData] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const load = useCallback(async () => {
    const result = await clientService.loginLogs.list({ page, pageSize: 20 });
    let items = result.data as LoginLog[];
    if (dateStart) items = items.filter(i => i.loginTime >= dateStart);
    if (dateEnd) items = items.filter(i => i.loginTime <= dateEnd + ' 23:59:59');
    setData(items); setTotal(result.total);
  }, [page, dateStart, dateEnd]);
  useEffect(() => { load(); }, [load]);
  const handleExport = () => {
    const csv = ['登录来源,登录账号,登录IP,登录设备,状态,登录时间',
      ...data.map(r => `${r.source},${r.account},${r.ip},${r.device},${r.status},${r.loginTime}`)].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '登录日志.csv'; a.click();
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">登录日志</h2>
        <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" onClick={handleExport} variant="default" />
      </div>
      <div className="bg-white p-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <DateRangeFilter start={dateStart} end={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} />
          <ActionButton icon={<Search className="w-3.5 h-3.5" />} label="查询" onClick={() => load()} />
          <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="重置" onClick={() => { setDateStart(''); setDateEnd(''); setPage(1); }} variant="default" />
        </div>
      </div>
      <DataTable columns={logColumns} data={data} total={total} page={page} pageSize={20}
        onPageChange={setPage} getId={d => d.id} emptyMessage="暂无登录日志" />
    </div>
  );
}

// ===== Units =====
export function UnitsPage() {
  const [settings, setSettings] = useState<UnitSettings>({ system: 'metric', weightUnit: 'kg', lengthUnit: 'cm' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    clientService.getUnitSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await clientService.saveUnitSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 p-6">
      <h2 className="text-sm font-bold text-slate-800 mb-4">计量单位</h2>
      <div className="max-w-md space-y-4">
        <div>
          <label className="text-xs text-slate-500 mb-2 block">单位制式</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="radio" name="system" checked={settings.system === 'metric'} onChange={() => setSettings({ system: 'metric', weightUnit: 'kg', lengthUnit: 'cm' })} className="w-3.5 h-3.5" />
              公制单位 (kg/cm)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="radio" name="system" checked={settings.system === 'imperial'} onChange={() => setSettings({ system: 'imperial', weightUnit: 'lb', lengthUnit: 'in' })} className="w-3.5 h-3.5" />
              英制单位 (lb/in)
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-slate-400">重量单位</label>
            <input className="w-full mt-1 h-8 px-2 border border-slate-300 rounded text-xs bg-slate-50" value={settings.weightUnit} readOnly /></div>
          <div><label className="text-xs text-slate-400">长度单位</label>
            <input className="w-full mt-1 h-8 px-2 border border-slate-300 rounded text-xs bg-slate-50" value={settings.lengthUnit} readOnly /></div>
        </div>
        <button onClick={handleSave}
          className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium cursor-pointer">{saved ? '已保存' : '保存'}</button>
      </div>
    </div>
  );
}
