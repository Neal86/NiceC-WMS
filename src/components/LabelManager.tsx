import React, { useState, useEffect } from 'react';
import { outboundApi } from '../api';
import { OutboundOrder } from '../types';
import { 
  Search, RefreshCw, Printer, AlertCircle, FileText, CheckCircle2, 
  HelpCircle, ExternalLink, Filter, ShoppingBag
} from 'lucide-react';

export default function LabelManager() {
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRINTED' | 'NOT_PRINTED'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await outboundApi.getOrders({ tab: 'ALL', page: 1, pageSize: 150 });
      setOrders(res.orders || []);
    } catch (e) {
      console.error('Failed to load shipping label orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handlePrintLabel = async (id: string, orderNo: string) => {
    try {
      const res = await outboundApi.printLabel(id);
      setToast(`订单 ${orderNo} 面单已发送到打印机，状态更新为 已打印。`);
      setTimeout(() => setToast(null), 3000);
      loadOrders(); // reload
    } catch (e) {
      alert('打印请求失败');
    }
  };

  const handleBatchPrint = async () => {
    if (selectedIds.length === 0) {
      alert('请选择要批量打印面单的出库单。');
      return;
    }
    try {
      await Promise.all(selectedIds.map(id => {
        const o = orders.find(x => x.id === id);
        return o ? outboundApi.printLabel(o.id) : Promise.resolve();
      }));
      setToast(`已批量发送 ${selectedIds.length} 张物流面单到打印序列中！`);
      setSelectedIds([]);
      setTimeout(() => setToast(null), 4000);
      loadOrders();
    } catch (e) {
      alert('批量面单发送失败');
    }
  };

  // Filter
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNo.toLowerCase().includes(search.toLowerCase()) || 
                          (o.recipient && o.recipient.toLowerCase().includes(search.toLowerCase()));
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && o.labelPrinted === statusFilter;
  });

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold py-1.5 px-4 rounded shadow-lg z-50 flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="h-10.5 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 text-xs font-extrabold">物流面单监控管理</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
            Lable Manager
          </span>
        </div>
        <button 
          onClick={loadOrders}
          className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
          title="刷新面单列表"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between shrink-0 bg-white gap-3">
        <div className="flex items-center gap-2.5 max-w-lg w-full">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="搜索出库单号/收件人..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-3 text-slate-600 placeholder-slate-400 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 h-7 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-0 rounded text-[10px] font-semibold cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              全部面单
            </button>
            <button
              onClick={() => setStatusFilter('NOT_PRINTED')}
              className={`px-3 py-0 rounded text-[10px] font-semibold cursor-pointer ${
                statusFilter === 'NOT_PRINTED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              未打印
            </button>
            <button
              onClick={() => setStatusFilter('PRINTED')}
              className={`px-3 py-0 rounded text-[10px] font-semibold cursor-pointer ${
                statusFilter === 'PRINTED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              已打印
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchPrint}
            disabled={selectedIds.length === 0}
            className={`h-7 px-3 rounded font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer ${
              selectedIds.length > 0 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>批量打印面单 ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* List Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-[10px] text-slate-400">正在同步承运商面单通道...</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-600">无此打印状态的面单记录</h3>
            <p className="text-[10px] text-slate-400 mt-1">请重置搜索词或过滤条件。</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] text-slate-500 font-bold tracking-wider h-8">
                <th className="px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredOrders.map(o => o.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 w-40">出库单号</th>
                <th className="px-3 w-48">承运配送渠道</th>
                <th className="px-3 w-28">面单状态</th>
                <th className="px-3 w-40">收件地区</th>
                <th className="px-3 w-32">商品件数</th>
                <th className="px-3 text-right w-32">打印操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 h-10.5">
                  <td className="px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(prev => [...prev, o.id]);
                        } else {
                          setSelectedIds(prev => prev.filter(id => id !== o.id));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 font-mono font-bold text-slate-800">{o.orderNo}</td>
                  <td className="px-3 font-mono text-xs text-slate-600">
                    {o.logisticsChannelId === 'chan_usps_ground' ? 'USPS GROUND(USPS_G)' :
                     o.logisticsChannelId === 'chan_ups_ground' ? 'UPS GROUND(UPS_G)' :
                     'FEDEX-HOME-DELIVERY(FHD_G)'}
                  </td>
                  <td className="px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                      o.labelPrinted === 'PRINTED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {o.labelPrinted === 'PRINTED' ? '● 已打印' : '○ 未打印'}
                    </span>
                  </td>
                  <td className="px-3 text-slate-500 truncate" title={o.recipient}>
                    {o.recipient}
                  </td>
                  <td className="px-3 font-mono text-slate-600">
                    {o.totalQty} 件 ({o.totalWeight} kg)
                  </td>
                  <td className="px-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handlePrintLabel(o.id, o.orderNo)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>打印单据</span>
                      </button>
                      {o.labelPrinted === 'PRINTED' && (
                        <a 
                          href={`https://mockpdf.wms.nicec.net/labels/${o.orderNo}.pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold flex items-center gap-0.5"
                          title="查看面单PDF"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
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
