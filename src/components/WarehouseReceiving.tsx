import { useState, useEffect } from 'react';
import { inboundApi, putawayApi } from '../api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, Barcode, Package, Loader2 } from 'lucide-react';

export default function WarehouseReceiving() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inboundApi.getOrders({ status: 'PENDING' });
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch {
      setError('无法加载入库单，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleBarcodeScan = async () => {
    if (!barcode.trim()) return;
    try {
      await inboundApi.receive(barcode.trim());
      showToast(`条码 ${barcode} 收货确认成功`, 'success');
      setBarcode('');
      fetchOrders();
    } catch {
      showToast('收货失败，请检查条码是否正确', 'error');
    }
  };

  const handleReceive = async (orderId: string) => {
    try {
      await inboundApi.receive(orderId);
      showToast('收货成功', 'success');
      fetchOrders();
    } catch {
      showToast('收货失败', 'error');
    }
  };

  const handleGeneratePutaway = async (orderId: string) => {
    try {
      await putawayApi.complete(orderId);
      showToast('已生成上架任务', 'success');
    } catch {
      showToast('生成上架任务失败', 'error');
    }
  };

  const filtered = orders.filter((o: any) =>
    !searchQuery || o.orderNo?.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4 py-2.5 rounded shadow-lg border text-xs flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center text-[11px] font-medium text-slate-500">
        <span>到仓扫描 / 入库收货</span>
      </div>

      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <Barcode className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan(); }}
            placeholder="扫描条码或输入入库单号后按 Enter 收货..."
            className="flex-1 h-10 px-3 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
          <button onClick={handleBarcodeScan} className="h-10 px-4 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">确认收货</button>
        </div>
        <p className="text-[10px] text-slate-400">提示：扫描入库单条码或手动输入单号，确认后完成收货并生成上架任务</p>
      </div>

      <div className="px-3.5 py-2 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索入库单号..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-xs text-slate-400">加载中...</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无待收货入库单</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">入库单号</th>
                <th className="px-3 border-r border-slate-200/60">客户</th>
                <th className="px-3 border-r border-slate-200/60">到仓方式</th>
                <th className="px-3 border-r border-slate-200/60 text-right">总箱数</th>
                <th className="px-3 border-r border-slate-200/60 text-right">产品数</th>
                <th className="px-3 border-r border-slate-200/60">状态</th>
                <th className="px-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50/60 h-9">
                  <td className="px-3 font-mono font-bold text-blue-600">{o.orderNo || o.id}</td>
                  <td className="px-3 text-slate-500">{o.customerName || o.client || '-'}</td>
                  <td className="px-3 text-slate-600">{o.arrivalMethod || '-'}</td>
                  <td className="px-3 text-right font-mono">{o.totalBoxes || '-'}</td>
                  <td className="px-3 text-right font-mono">{o.totalProducts || '-'}</td>
                  <td className="px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">待入库</span>
                  </td>
                  <td className="px-3">
                    <button onClick={() => handleReceive(o.id)} className="text-blue-600 hover:text-blue-800 font-bold mr-2">收货</button>
                    <button onClick={() => handleGeneratePutaway(o.id)} className="text-indigo-600 hover:text-indigo-800 font-bold">上架</button>
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
