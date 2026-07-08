import React, { useState, useEffect } from 'react';
import { workOrderApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, Clipboard, Loader2, Plus, Trash2 } from 'lucide-react';

export default function WorkOrderManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'Medium', assignee: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workOrderApi.getOrders();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch {
      setError('无法加载工单列表');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await workOrderApi.create(createForm);
      showToast(`工单 ${res.id || res.workOrderNo} 创建成功`, 'success');
      setShowCreate(false);
      setCreateForm({ title: '', description: '', priority: 'Medium', assignee: '' });
      fetchOrders();
    } catch {
      showToast('创建工单失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此工单？')) return;
    try {
      await workOrderApi.delete(id);
      showToast('工单已删除', 'success');
      fetchOrders();
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const filtered = orders.filter((o: any) =>
    !searchQuery || o.title?.toLowerCase().includes(searchQuery.toLowerCase()) || o.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={fetchOrders} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button>
        </div>
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
        <span className="font-medium text-slate-500"><Clipboard className="w-4 h-4 inline mr-1.5" />工单管理</span>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-500"><Plus className="w-3 h-3 inline mr-1" />新建工单</button>
      </div>

      <div className="p-2.5 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索工单..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      {showCreate && (
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <form onSubmit={handleCreate} className="max-w-lg space-y-3">
            <div><label className="block text-slate-500 font-semibold mb-1">标题</label><input type="text" required value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="block text-slate-500 font-semibold mb-1">描述</label><textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-slate-500 font-semibold mb-1">优先级</label><select value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))} className="w-full h-8 px-2 border border-slate-300 rounded"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
              <div><label className="block text-slate-500 font-semibold mb-1">指派人</label><input type="text" value={createForm.assignee} onChange={e => setCreateForm(f => ({ ...f, assignee: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500">创建</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded font-semibold text-xs">取消</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Clipboard className="w-12 h-12 mb-3" /><p>暂无工单</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">工单编号</th>
                <th className="px-3 border-r border-slate-200/60">标题</th>
                <th className="px-3 border-r border-slate-200/60">优先级</th>
                <th className="px-3 border-r border-slate-200/60">指派人</th>
                <th className="px-3 border-r border-slate-200/60">状态</th>
                <th className="px-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50/60 h-9">
                  <td className="px-3 font-mono font-bold text-blue-600">{o.id}</td>
                  <td className="px-3 max-w-[200px] truncate">{o.title}</td>
                  <td className="px-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${o.priority === 'Critical' ? 'bg-red-50 text-red-700' : o.priority === 'High' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{o.priority}</span></td>
                  <td className="px-3 text-slate-500">{o.assignee || '-'}</td>
                  <td className="px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{o.status || 'OPEN'}</span></td>
                  <td className="px-3"><button onClick={() => handleDelete(o.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
