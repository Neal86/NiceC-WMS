import { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { RefreshCw, Search, AlertCircle, Package, Loader2, Box } from 'lucide-react';

export default function BoxInventoryManager() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByLocation, setGroupByLocation] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      setError('无法加载箱库存数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const filtered = inventory.filter((i: any) =>
    !searchQuery || i.skuCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupByLocation
    ? Object.entries(filtered.reduce((acc: any, i: any) => {
        const key = i.warehouseName || i.warehouseId || 'unknown';
        acc[key] = (acc[key] || 0) + (i.availableQty || 0);
        return acc;
      }, {}))
    : [];

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-red-600 mb-4">{error}</p><button onClick={fetchInventory} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">重试</button></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden text-xs text-slate-700">
      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center text-[11px] font-medium">
        <Box className="w-4 h-4 mr-1.5" />箱库存管理
      </div>

      <div className="p-2.5 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索 SKU..." className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <label className="flex items-center gap-1 text-slate-500 cursor-pointer select-none">
          <input type="checkbox" checked={groupByLocation} onChange={e => setGroupByLocation(e.target.checked)} className="rounded" />
          <span>按仓库分组</span>
        </label>
        <button onClick={fetchInventory} className="flex items-center gap-1 h-7 px-2.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-200"><RefreshCw className="w-3 h-3" />刷新</button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
        ) : groupByLocation ? (
          grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Package className="w-12 h-12 mb-3" /><p>暂无箱库存</p></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
                <tr className="h-8"><th className="px-3 border-r border-slate-200/60">仓库</th><th className="px-3 text-right">总库存</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grouped.map(([warehouse, qty]: [string, any]) => (
                  <tr key={warehouse} className="hover:bg-slate-50/60 h-9">
                    <td className="px-3 font-medium text-slate-800">{warehouse}</td>
                    <td className="px-3 text-right font-mono font-bold text-emerald-600">{qty.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Package className="w-12 h-12 mb-3" /><p>暂无箱库存</p></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f5f7fa] text-slate-500 font-semibold sticky top-0">
              <tr className="h-8">
                <th className="px-3 border-r border-slate-200/60">SKU 编码</th>
                <th className="px-3 border-r border-slate-200/60">仓库</th>
                <th className="px-3 border-r border-slate-200/60 text-right">可用库存</th>
                <th className="px-3 border-r border-slate-200/60 text-right">预占库存</th>
                <th className="px-3 text-right">总库存</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 h-9">
                  <td className="px-3 font-mono font-bold text-slate-800">{inv.skuCode}</td>
                  <td className="px-3 text-slate-500">{inv.warehouseName || inv.warehouseId || '-'}</td>
                  <td className="px-3 text-right font-mono text-emerald-600">{inv.availableQty}</td>
                  <td className="px-3 text-right font-mono text-amber-600">{inv.reservedQty}</td>
                  <td className="px-3 text-right font-mono font-bold">{(inv.availableQty || 0) + (inv.reservedQty || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
