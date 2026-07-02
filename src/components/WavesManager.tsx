import React, { useState, useEffect } from 'react';
import { waveApi } from '../api';
import { Wave } from '../types';
import { 
  Search, RefreshCw, Trash2, CheckCircle2, HelpCircle, AlertCircle, 
  Layers, ArrowUpRight, Filter, Play, XCircle
} from 'lucide-react';

export default function WavesManager() {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const loadWaves = async () => {
    try {
      setLoading(true);
      const data = await waveApi.getWaves();
      setWaves(data);
    } catch (err) {
      console.error('Failed to load waves list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaves();
  }, []);

  const handleCloseOrDelete = async (id: string, no: string) => {
    if (confirm(`确认关闭并作废波次 [${no}] 吗？对应的订单将释放返回到 待处理 待拣货状态。`)) {
      try {
        await waveApi.deleteWave(id);
        setToast(`波次 ${no} 已被安全释放并注销。`);
        setTimeout(() => setToast(null), 3000);
        loadWaves();
      } catch (e) {
        alert('释放失败，请检查网络后重试');
      }
    }
  };

  const filteredWaves = waves.filter(w => 
    w.waveNo.toLowerCase().includes(search.toLowerCase()) || 
    w.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold py-1.5 px-4 rounded shadow-lg z-50 flex items-center gap-1.5 transition-all">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="h-10.5 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 text-xs font-extrabold">波次归集工作台</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
            波次订单池
          </span>
        </div>
        <button 
          onClick={loadWaves}
          className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
          title="刷新数据"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Action row */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white gap-4">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="搜索波次号 / 状态..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-3 text-slate-600 placeholder-slate-400 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>归集多个出库单，以在仓库里进行快速一次性合并合并拣货。</span>
        </div>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-[10px] text-slate-400">正在归集波次数据...</span>
            </div>
          </div>
        ) : filteredWaves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 text-center">
            <Layers className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
            <h3 className="text-xs font-bold text-slate-600">暂无符合条件的波次记录</h3>
            <p className="text-[10px] text-slate-400 mt-1">您可在一件代发订单表格中选择多个订单，点击「生成波次」以自动分配波次码。</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] text-slate-500 font-bold tracking-wider h-8">
                <th className="px-4 w-40">波次号</th>
                <th className="px-4 w-28">当前状态</th>
                <th className="px-4 w-28 text-center">包含订单数</th>
                <th className="px-4 w-48">创建时间</th>
                <th className="px-4 text-right w-36">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredWaves.map((wave) => (
                <tr key={wave.id} className="hover:bg-slate-50/80 h-10.5">
                  <td className="px-4 font-mono font-bold text-slate-800">{wave.waveNo}</td>
                  <td className="px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                      wave.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      wave.status === 'PICKING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {wave.status === 'COMPLETED' ? '已拣货完成' :
                       wave.status === 'PICKING' ? '分拣分配中' : '待处理订单'}
                    </span>
                  </td>
                  <td className="px-4 font-mono font-bold text-center text-slate-700">
                    {wave.orderCount} 单
                  </td>
                  <td className="px-4 font-mono text-slate-400">{wave.createdTime}</td>
                  <td className="px-4 text-right">
                    <div className="flex justify-end gap-2.5">
                      <button 
                        onClick={() => alert(`正在导出波次 ${wave.waveNo} 的合并拣货配货明细 PDF，总计 ${wave.orderCount} 张订单...`)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[10px] hover:underline cursor-pointer"
                      >
                        打印拣货配货单
                      </button>
                      <button 
                        onClick={() => handleCloseOrDelete(wave.id, wave.waveNo)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>释放波次</span>
                      </button>
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
