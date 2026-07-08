import { useState, useEffect } from 'react';
import { dashboardApi, logApi } from '../api';
import { RefreshCw, AlertCircle, Loader2, BarChart, TrendingUp, FileText, Activity } from 'lucide-react';

export default function ReportsManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>({ pendingOrders: 0, shippedOrders: 0, exceptionOrders: 0, totalSKUs: 0 });
  const [trend, setTrend] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, tr, dist, lg] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getOutboundTrend(),
        dashboardApi.getChannelDistribution(),
        logApi.getOperationLogs()
      ]);
      setSummary(sum);
      setTrend(tr || []);
      setDistribution(dist || []);
      setLogs((lg || []).slice(0, 20));
    } catch {
      setError('无法加载报表数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4.5 text-xs text-slate-700">
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-2 text-slate-400">加载中...</span></div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800"><BarChart className="w-4 h-4 inline mr-1.5" />运营报表</h2>
            <button onClick={loadData} className="flex items-center gap-1 h-7 px-2.5 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className="w-3 h-3" />刷新</button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-400 font-semibold">待处理订单</p>
              <p className="text-xl font-mono font-bold text-amber-600 mt-1">{summary.pendingOrders}</p>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-400 font-semibold">已出库</p>
              <p className="text-xl font-mono font-bold text-emerald-600 mt-1">{summary.shippedOrders?.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-400 font-semibold">异常件</p>
              <p className="text-xl font-mono font-bold text-rose-600 mt-1">{summary.exceptionOrders}</p>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-400 font-semibold">SKU 总数</p>
              <p className="text-xl font-mono font-bold text-blue-600 mt-1">{summary.totalSKUs}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-700 mb-3 flex items-center gap-1"><TrendingUp className="w-4 h-4 text-blue-600" />出库趋势</h4>
              <div className="h-32 flex items-end gap-2">
                {trend.map((t: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500">{t.qty}</span>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.max(4, (t.qty / Math.max(...trend.map((x: any) => x.qty), 1)) * 100)}px` }} />
                    <span className="text-[8px] text-slate-400">{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-700 mb-3 flex items-center gap-1"><BarChart className="w-4 h-4 text-emerald-600" />渠道分布</h4>
              <div className="space-y-2">
                {distribution.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-16 text-[10px] font-semibold text-slate-600">{d.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-blue-600' : i === 1 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${d.value}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h4 className="text-[11px] font-bold text-slate-700 mb-3 flex items-center gap-1"><Activity className="w-4 h-4 text-indigo-600" />操作日志</h4>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase h-7">
                  <th className="px-3">时间</th><th className="px-3">操作人</th><th className="px-3">模块</th><th className="px-3">行为</th><th className="px-3">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 h-7">
                    <td className="px-3 font-mono text-slate-400">{log.createdAt}</td>
                    <td className="px-3 font-semibold text-slate-700">{log.username}</td>
                    <td className="px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">{log.module}</span></td>
                    <td className="px-3 text-slate-800">{log.action}</td>
                    <td className="px-3 text-slate-500 max-w-xs truncate">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
