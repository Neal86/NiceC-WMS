import React, { useState, useEffect } from 'react';
import { inventoryApi, warehouseApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, Truck, Loader2, ArrowRightLeft } from 'lucide-react';

export default function TransitManager() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [transferForm, setTransferForm] = useState({ skuId: '', fromWarehouse: '', toWarehouse: '', qty: 1 });
  const [transfers, setTransfers] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const wh = await warehouseApi.getWarehouses();
      setWarehouses(Array.isArray(wh) ? wh : []);
    } catch {
      setError('无法加载转运数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.transferInventory(transferForm);
      showToast('转运提交成功', 'success');
      setTransferForm({ skuId: '', fromWarehouse: '', toWarehouse: '', qty: 1 });
      setTransfers(prev => [...prev, { id: Date.now().toString(), ...transferForm, createdAt: new Date().toISOString() }]);
    } catch {
      showToast('转运提交失败', 'error');
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button>
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

      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center text-[11px] font-medium text-slate-500">
        <Truck className="w-4 h-4 mr-1.5" />转运管理
      </div>

      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3">新建转运单</h3>
        <form onSubmit={handleTransfer} className="grid grid-cols-5 gap-3">
          <div><label className="block text-slate-500 font-semibold mb-1">SKU ID</label><input type="text" required value={transferForm.skuId} onChange={e => setTransferForm(f => ({ ...f, skuId: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
          <div><label className="block text-slate-500 font-semibold mb-1">源仓库</label><select required value={transferForm.fromWarehouse} onChange={e => setTransferForm(f => ({ ...f, fromWarehouse: e.target.value }))} className="w-full h-8 px-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">{warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div><label className="block text-slate-500 font-semibold mb-1">目标仓库</label><select required value={transferForm.toWarehouse} onChange={e => setTransferForm(f => ({ ...f, toWarehouse: e.target.value }))} className="w-full h-8 px-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">{warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div><label className="block text-slate-500 font-semibold mb-1">数量</label><input type="number" min="1" required value={transferForm.qty} onChange={e => setTransferForm(f => ({ ...f, qty: Number(e.target.value) }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
          <div className="pt-5"><button type="submit" className="w-full h-8 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500"><ArrowRightLeft className="w-3 h-3 inline mr-1" />提交转运</button></div>
        </form>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Truck className="w-12 h-12 mb-3" /><p>暂无转运记录</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">转运编号</th>
                <th className="px-3 border-r border-slate-200/60">SKU</th>
                <th className="px-3 border-r border-slate-200/60">源仓库</th>
                <th className="px-3 border-r border-slate-200/60">目标仓库</th>
                <th className="px-3 border-r border-slate-200/60 text-right">数量</th>
                <th className="px-3">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/60 h-9">
                  <td className="px-3 font-mono font-bold text-blue-600">TR{t.id.slice(-6)}</td>
                  <td className="px-3 font-mono text-slate-800">{t.skuId}</td>
                  <td className="px-3 text-slate-500">{t.fromWarehouse}</td>
                  <td className="px-3 text-slate-500">{t.toWarehouse}</td>
                  <td className="px-3 text-right font-mono">{t.qty}</td>
                  <td className="px-3 text-slate-400 font-mono">{new Date(t.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
