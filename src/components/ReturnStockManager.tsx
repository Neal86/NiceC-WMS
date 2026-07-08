import { useState, useEffect } from 'react';
import { returnApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';

export default function ReturnStockManager() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await returnApi.getReturns({ status: ['RESTOCKED', 'COMPLETED', 'DAMAGED'] });
      setReturns(Array.isArray(data) ? data : []);
    } catch {
      setError('无法加载退货库存');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  const filtered = returns.filter((r: any) =>
    !searchQuery || r.returnNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-red-600 mb-4">{error}</p><button onClick={fetchReturns} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button></div>
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
        <RotateCcw className="w-4 h-4 mr-1.5" />退货库存
      </div>

      <div className="p-2.5 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索退货单号..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={fetchReturns} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><RotateCcw className="w-12 h-12 mb-3" /><p>暂无退货库存</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0 text-[10.5px]">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">退货单号</th>
                <th className="px-3 border-r border-slate-200/60">SKU</th>
                <th className="px-3 border-r border-slate-200/60 text-right">退货数量</th>
                <th className="px-3 border-r border-slate-200/60">质检结果</th>
                <th className="px-3 border-r border-slate-200/60">状态</th>
                <th className="px-3">入库时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r: any) => {
                const item = r.items?.[0] || {};
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 h-9">
                    <td className="px-3 font-mono font-bold text-blue-600">{r.returnNo || r.id}</td>
                    <td className="px-3 font-mono text-slate-800">{item.skuCode || '-'}</td>
                    <td className="px-3 text-right font-mono">{item.qtyReceived || item.qtyExpected || '-'}</td>
                    <td className="px-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.condition === 'DAMAGED' ? 'bg-red-50 text-red-700' : item.condition === 'RELABEL_REQUIRED' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.condition || '-'}</span></td>
                    <td className="px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{r.status}</span></td>
                    <td className="px-3 text-slate-400 font-mono">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('zh-CN') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
