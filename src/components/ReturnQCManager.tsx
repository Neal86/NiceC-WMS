import { useState, useEffect } from 'react';
import { returnApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, ClipboardCheck, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ReturnQCManager() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [qcResult, setQcResult] = useState<'PASS' | 'DAMAGED' | 'RELABEL_REQUIRED'>('PASS');
  const [qcNote, setQcNote] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await returnApi.getReturns({ status: 'PENDING' });
      setReturns(Array.isArray(data) ? data : []);
    } catch {
      setError('无法加载退货质检数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  const handleQC = async (returnId: string) => {
    try {
      await returnApi.updateReturn(returnId, { qcStatus: qcResult, qcNote, items: selectedReturn?.items || [] });
      showToast(`退货质检完成: ${qcResult === 'PASS' ? '通过' : qcResult === 'DAMAGED' ? '次品' : '需换标'}`, 'success');
      setSelectedReturn(null);
      setQcNote('');
      fetchReturns();
    } catch {
      showToast('质检提交失败', 'error');
    }
  };

  const filtered = returns.filter((r: any) =>
    !searchQuery || r.returnNo?.toLowerCase().includes(searchQuery.toLowerCase()) || r.id?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <ClipboardCheck className="w-4 h-4 mr-1.5" />退件质检
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
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><ClipboardCheck className="w-12 h-12 mb-3" /><p>暂无待质检退货</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">退货单号</th>
                <th className="px-3 border-r border-slate-200/60">原始订单</th>
                <th className="px-3 border-r border-slate-200/60">SKU</th>
                <th className="px-3 border-r border-slate-200/60 text-right">数量</th>
                <th className="px-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r: any) => {
                const item = r.items?.[0] || {};
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 h-9">
                    <td className="px-3 font-mono font-bold text-blue-600">{r.returnNo || r.id}</td>
                    <td className="px-3 text-slate-500">{r.orderId || '-'}</td>
                    <td className="px-3 font-mono text-slate-800">{item.skuCode || '-'}</td>
                    <td className="px-3 text-right font-mono">{item.qtyExpected || '-'}</td>
                    <td className="px-3">
                      <button onClick={() => setSelectedReturn(r)} className="text-blue-600 hover:text-blue-800 font-bold"><ClipboardCheck className="w-3 h-3 inline mr-1" />质检</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setSelectedReturn(null)}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-4">退货质检 - {selectedReturn.returnNo}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">质检结果</label>
                <div className="flex gap-2">
                  <button onClick={() => setQcResult('PASS')} className={`flex-1 py-2 rounded border text-xs font-bold ${qcResult === 'PASS' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ThumbsUp className="w-3.5 h-3.5 inline mr-1" />合格</button>
                  <button onClick={() => setQcResult('DAMAGED')} className={`flex-1 py-2 rounded border text-xs font-bold ${qcResult === 'DAMAGED' ? 'bg-red-50 border-red-400 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ThumbsDown className="w-3.5 h-3.5 inline mr-1" />次品</button>
                  <button onClick={() => setQcResult('RELABEL_REQUIRED')} className={`flex-1 py-2 rounded border text-xs font-bold ${qcResult === 'RELABEL_REQUIRED' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>需换标</button>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">备注</label>
                <textarea value={qcNote} onChange={e => setQcNote(e.target.value)} rows={3} className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleQC(selectedReturn.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500">提交质检</button>
                <button onClick={() => setSelectedReturn(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded font-semibold text-xs">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
