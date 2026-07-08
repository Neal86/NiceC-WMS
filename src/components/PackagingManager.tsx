import React, { useState, useEffect } from 'react';
import { packagingApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, Package, Loader2, Plus, Trash2, Edit } from 'lucide-react';

export default function PackagingManager() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', sku: '', unitPrice: 0 });
  const [editing, setEditing] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packagingApi.getMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    } catch {
      setError('无法加载包材数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await packagingApi.create(createForm);
      showToast('包材创建成功', 'success');
      setShowCreate(false);
      setCreateForm({ name: '', sku: '', unitPrice: 0 });
      fetchMaterials();
    } catch {
      showToast('创建失败', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await packagingApi.update(editing.id, createForm);
      showToast('包材更新成功', 'success');
      setEditing(null);
      setShowCreate(false);
      setCreateForm({ name: '', sku: '', unitPrice: 0 });
      fetchMaterials();
    } catch {
      showToast('更新失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此包材？')) return;
    try {
      await packagingApi.delete(id);
      showToast('包材已删除', 'success');
      fetchMaterials();
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const filtered = materials.filter((m: any) =>
    !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-red-600 mb-4">{error}</p><button onClick={fetchMaterials} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden text-xs text-slate-700">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4 py-2.5 rounded shadow-lg border flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-500"><Package className="w-4 h-4 inline mr-1.5" />包材管理</span>
        <button onClick={() => { setShowCreate(true); setEditing(null); setCreateForm({ name: '', sku: '', unitPrice: 0 }); }} className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-500"><Plus className="w-3 h-3 inline mr-1" />新建包材</button>
      </div>

      <div className="p-2.5 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索包材名称或 SKU..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={fetchMaterials} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      {showCreate && (
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <form onSubmit={editing ? handleUpdate : handleCreate} className="max-w-md space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-slate-500 font-semibold mb-1">名称</label><input type="text" required value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="block text-slate-500 font-semibold mb-1">SKU</label><input type="text" required value={createForm.sku} onChange={e => setCreateForm(f => ({ ...f, sku: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
            </div>
            <div><label className="block text-slate-500 font-semibold mb-1">单价</label><input type="number" step="0.01" value={createForm.unitPrice} onChange={e => setCreateForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500">{editing ? '保存修改' : '创建'}</button>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded font-semibold text-xs">取消</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Package className="w-12 h-12 mb-3" /><p>暂无包材</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">名称</th>
                <th className="px-3 border-r border-slate-200/60">SKU</th>
                <th className="px-3 border-r border-slate-200/60 text-right">单价</th>
                <th className="px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50/60 h-9">
                  <td className="px-3 text-slate-800 font-bold">{m.name}</td>
                  <td className="px-3 font-mono text-slate-600">{m.sku}</td>
                  <td className="px-3 text-right font-mono">¥{m.unitPrice?.toFixed(2)}</td>
                  <td className="px-3 text-right">
                    <button onClick={() => { setEditing(m); setCreateForm({ name: m.name, sku: m.sku, unitPrice: m.unitPrice }); setShowCreate(true); }} className="text-blue-600 hover:text-blue-800 mr-2"><Edit className="w-3 h-3 inline" />编辑</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3 inline" />删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
