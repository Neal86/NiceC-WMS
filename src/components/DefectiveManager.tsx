import { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, ShieldAlert, Loader2, Trash2 } from 'lucide-react';

export default function DefectiveManager() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDefective = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getInventory();
      const items = Array.isArray(data) ? data : [];
      setInventory(items.filter((i: any) => (i.damagedQty || 0) > 0));
    } catch {
      setError('无法加载次品数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDefective(); }, []);

  const handleDispose = async (id: string) => {
    if (!confirm('确认将此次品报废处理？')) return;
    try {
      await inventoryApi.adjustInventory({ id, damagedQty: 0, reason: '次品报废' });
      showToast('次品已报废处理', 'success');
      fetchDefective();
    } catch {
      showToast('处理失败', 'error');
    }
  };

  const filtered = inventory.filter((i: any) =>
    !searchQuery || i.skuCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-red-600 mb-4">{error}</p><button onClick={fetchDefective} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button></div>
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

      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center text-[11px] font-medium text-slate-500">
        <ShieldAlert className="w-4 h-4 mr-1.5" />次品处理
      </div>

      <div className="p-2.5 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索 SKU..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={fetchDefective} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><ShieldAlert className="w-12 h-12 mb-3" /><p>暂无次品记录</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">SKU 编码</th>
                <th className="px-3 border-r border-slate-200/60">仓库</th>
                <th className="px-3 border-r border-slate-200/60 text-right">次品数量</th>
                <th className="px-3 border-r border-slate-200/60 text-right">可用数量</th>
                <th className="px-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 h-9">
                  <td className="px-3 font-mono font-bold text-slate-800">{inv.skuCode}</td>
                  <td className="px-3 text-slate-500">{inv.warehouseName || inv.warehouseId || '-'}</td>
                  <td className="px-3 text-right font-mono text-red-500 font-bold">{inv.damagedQty}</td>
                  <td className="px-3 text-right font-mono text-emerald-600">{inv.availableQty}</td>
                  <td className="px-3">
                    <button onClick={() => handleDispose(inv.id)} className="text-red-500 hover:text-red-700 font-bold"><Trash2 className="w-3 h-3 inline mr-1" />报废</button>
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
