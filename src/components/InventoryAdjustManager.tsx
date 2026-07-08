import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { RefreshCw, Search, AlertCircle, CheckCircle2, ArrowRightLeft, Plus, Package, Loader2, Trash2 } from 'lucide-react';

export default function InventoryAdjustManager() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAdjust, setShowAdjust] = useState<any>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ availableQty: 0, reservedQty: 0, damagedQty: 0, reason: '' });
  const [transferForm, setTransferForm] = useState({ fromSkuId: '', toSkuId: '', fromWarehouse: '', toWarehouse: '', qty: 1 });
  const [activeTab, setActiveTab] = useState<'list' | 'adjust' | 'transfer'>('list');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      setError('无法加载库存数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjust) return;
    try {
      await inventoryApi.adjustInventory({ skuId: showAdjust.skuId || showAdjust.id, availableQty: adjustForm.availableQty, reservedQty: adjustForm.reservedQty, damagedQty: adjustForm.damagedQty, reason: adjustForm.reason });
      showToast(`库存调整成功 - ${showAdjust.skuCode}`, 'success');
      setShowAdjust(null);
      fetchInventory();
    } catch {
      showToast('库存调整失败', 'error');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.transferInventory(transferForm);
      showToast('库存转移成功', 'success');
      setShowTransfer(false);
      setTransferForm({ fromSkuId: '', toSkuId: '', fromWarehouse: '', toWarehouse: '', qty: 1 });
      fetchInventory();
    } catch {
      showToast('库存转移失败', 'error');
    }
  };

  const filtered = inventory.filter((i: any) =>
    !searchQuery || i.skuCode?.toLowerCase().includes(searchQuery.toLowerCase()) || i.skuName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={fetchInventory} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button>
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

      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center gap-4">
        <button onClick={() => setActiveTab('list')} className={`h-9.5 px-1 border-b-2 font-medium ${activeTab === 'list' ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'}`}>库存列表</button>
        <button onClick={() => setActiveTab('adjust')} className={`h-9.5 px-1 border-b-2 font-medium ${activeTab === 'adjust' ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'}`}>库存调整</button>
        <button onClick={() => setActiveTab('transfer')} className={`h-9.5 px-1 border-b-2 font-medium ${activeTab === 'transfer' ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'}`}>库存转移</button>
      </div>

      <div className="p-2.5 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索 SKU 编码或名称..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={fetchInventory} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : activeTab === 'list' ? (
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Package className="w-12 h-12 mb-3" /><p>暂无库存数据</p></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0 text-[10.5px]">
                <tr className="h-8">
                  <th className="px-3 border-r border-slate-200/60">SKU 编码</th>
                  <th className="px-3 border-r border-slate-200/60">仓库</th>
                  <th className="px-3 border-r border-slate-200/60 text-right">可用库存</th>
                  <th className="px-3 border-r border-slate-200/60 text-right">预占库存</th>
                  <th className="px-3 border-r border-slate-200/60 text-right">次品数量</th>
                  <th className="px-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 h-9">
                    <td className="px-3 font-mono font-bold text-slate-800">{inv.skuCode}</td>
                    <td className="px-3 text-slate-500">{inv.warehouseName || inv.warehouseId || '-'}</td>
                    <td className="px-3 text-right font-mono text-emerald-600 font-bold">{inv.availableQty}</td>
                    <td className="px-3 text-right font-mono text-amber-600">{inv.reservedQty}</td>
                    <td className="px-3 text-right font-mono text-red-500">{inv.damagedQty || 0}</td>
                    <td className="px-3">
                      <button onClick={() => { setShowAdjust(inv); setAdjustForm({ availableQty: inv.availableQty, reservedQty: inv.reservedQty, damagedQty: inv.damagedQty || 0, reason: '' }); setActiveTab('adjust'); }} className="text-blue-600 hover:text-blue-800 font-bold mr-2">调整</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === 'adjust' ? (
          <div className="p-6 max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-4">{showAdjust ? `库存调整 - ${showAdjust.skuCode}` : '库存调整'}</h3>
            {!showAdjust ? (
              <p className="text-slate-400 text-center py-8">请先在库存列表中选择要调整的 SKU</p>
            ) : (
              <form onSubmit={handleAdjust} className="space-y-3">
                <div><label className="block text-slate-500 font-semibold mb-1">可用库存</label><input type="number" min="0" required value={adjustForm.availableQty} onChange={e => setAdjustForm(f => ({ ...f, availableQty: Number(e.target.value) }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
                <div><label className="block text-slate-500 font-semibold mb-1">预占库存</label><input type="number" min="0" required value={adjustForm.reservedQty} onChange={e => setAdjustForm(f => ({ ...f, reservedQty: Number(e.target.value) }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
                <div><label className="block text-slate-500 font-semibold mb-1">次品数量</label><input type="number" min="0" value={adjustForm.damagedQty} onChange={e => setAdjustForm(f => ({ ...f, damagedQty: Number(e.target.value) }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
                <div><label className="block text-slate-500 font-semibold mb-1">调整原因</label><input type="text" value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="例: 盘点修正" className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500">保存调整</button>
                  <button type="button" onClick={() => { setShowAdjust(null); setActiveTab('list'); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded font-semibold text-xs">取消</button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="p-6 max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-4">库存转移</h3>
            <form onSubmit={handleTransfer} className="space-y-3">
              <div><label className="block text-slate-500 font-semibold mb-1">源 SKU ID</label><input type="text" required value={transferForm.fromSkuId} onChange={e => setTransferForm(f => ({ ...f, fromSkuId: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
              <div><label className="block text-slate-500 font-semibold mb-1">目标 SKU ID</label><input type="text" required value={transferForm.toSkuId} onChange={e => setTransferForm(f => ({ ...f, toSkuId: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-slate-500 font-semibold mb-1">源仓库</label><input type="text" required value={transferForm.fromWarehouse} onChange={e => setTransferForm(f => ({ ...f, fromWarehouse: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-slate-500 font-semibold mb-1">目标仓库</label><input type="text" required value={transferForm.toWarehouse} onChange={e => setTransferForm(f => ({ ...f, toWarehouse: e.target.value }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-slate-500 font-semibold mb-1">转移数量</label><input type="number" min="1" required value={transferForm.qty} onChange={e => setTransferForm(f => ({ ...f, qty: Number(e.target.value) }))} className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500"><ArrowRightLeft className="w-3 h-3 inline mr-1" />执行转移</button>
                <button type="button" onClick={() => { setShowTransfer(false); setActiveTab('list'); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded font-semibold text-xs">取消</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
