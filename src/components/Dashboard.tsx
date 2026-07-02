import React, { useState, useEffect } from 'react';
import { dashboardApi, logApi } from '../api';
import { OperationLog } from '../types';
import { 
  TrendingUp, Box, Layers, AlertTriangle, CheckCircle2, Clipboard, 
  Activity, ArrowUpRight, Clock, ShieldCheck, HelpCircle
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pendingOrders: 3,
    shippedOrders: 26146,
    exceptionOrders: 0,
    totalSKUs: 50
  });

  const [trend, setTrend] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, tr, dist, lg] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getOutboundTrend(),
        dashboardApi.getChannelDistribution(),
        logApi.getOperationLogs()
      ]);
      setStats(sum);
      setTrend(tr);
      setDistribution(dist);
      setLogs(lg.slice(0, 8)); // latest 8
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">正在拉取 NiceC 实时数据看板...</span>
        </div>
      </div>
    );
  }

  // Calculate coordinates for dynamic SVG line chart
  const maxTrendVal = Math.max(...trend.map(t => t.qty), 3000);
  const trendPoints = trend.map((t, index) => {
    const x = 50 + index * 80;
    const y = 150 - (t.qty / maxTrendVal) * 110;
    return { x, y, ...t };
  });

  const linePath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="flex-1 bg-[#f8fafc] p-4.5 overflow-y-auto custom-scrollbar font-sans select-none">
      
      {/* Upper Welcome banner row */}
      <div className="mb-4 bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-800">NiceC WMS 仓储中央运营监控面板</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              欢迎回来， neal@nicec.net（超级管理员） | 当前系统处于正常监控状态
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded text-[10px] font-bold border border-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>NiceC 云端同步成功 (100%)</span>
        </div>
      </div>

      {/* Grid of Key Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* Card 1 */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">今日待处理订单</p>
            <h3 className="text-xl font-mono font-bold text-amber-600 mt-1">{stats.pendingOrders}</h3>
            <span className="text-[9px] text-slate-400 block mt-1">
              需要尽快安排波次拣货分配
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">已出库发货总单量</p>
            <h3 className="text-xl font-mono font-bold text-emerald-600 mt-1">{stats.shippedOrders.toLocaleString()}</h3>
            <span className="text-[9px] text-emerald-600 font-semibold block mt-1">
              ↑ 环比昨日增长 14.2%
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">异常滞留件数</p>
            <h3 className="text-xl font-mono font-bold text-rose-600 mt-1">{stats.exceptionOrders}</h3>
            <span className="text-[9px] text-slate-400 block mt-1">
              缺货/条码损坏/面单异常
            </span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">已注册 SKU 商品总数</p>
            <h3 className="text-xl font-mono font-bold text-blue-600 mt-1">{stats.totalSKUs}</h3>
            <span className="text-[9px] text-slate-400 block mt-1">
              绑定 5 个主客户账户
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Charts Line and Bar side by side */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Trend line chart (7 days) */}
        <div className="col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>近 7 天出库单量趋势趋势（件/天）</span>
            </h4>
            <span className="text-[9px] font-mono text-slate-400">NC-1仓</span>
          </div>
          
          <div className="h-44 flex items-center justify-center">
            <svg className="w-full h-full max-h-40" viewBox="0 0 600 170">
              {/* Horizontal grid lines */}
              <line x1="50" y1="30" x2="550" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="70" x2="550" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="110" x2="550" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1="50" y1="150" x2="550" y2="150" stroke="#cbd5e1" strokeWidth="1" />

              {/* Grid Label Y */}
              <text x="15" y="35" className="text-[9px] font-mono fill-slate-400">3,000</text>
              <text x="15" y="75" className="text-[9px] font-mono fill-slate-400">1,500</text>
              <text x="15" y="115" className="text-[9px] font-mono fill-slate-400">750</text>
              <text x="15" y="155" className="text-[9px] font-mono fill-slate-400">0</text>

              {/* Line Area Gradient */}
              <path
                d={`${linePath} L ${trendPoints[trendPoints.length - 1].x} 150 L 50 150 Z`}
                fill="url(#trend-gradient)"
                opacity="0.15"
              />

              {/* Line path */}
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots and Tooltips */}
              {trendPoints.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-blue-700"
                  >
                    {pt.qty}
                  </text>
                  <text
                    x={pt.x}
                    y="165"
                    textAnchor="middle"
                    className="text-[9px] font-sans fill-slate-400"
                  >
                    {pt.date}
                  </text>
                </g>
              ))}

              <defs>
                <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Channel distribution bento view */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-600" />
              <span>渠道分流占比分布</span>
            </h4>
          </div>

          <div className="space-y-2.5 mt-2.5">
            {distribution.map((dist, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1 font-mono">
                  <span>{dist.name}</span>
                  <span>{dist.value}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      i === 0 ? 'bg-blue-600' :
                      i === 1 ? 'bg-teal-500' :
                      i === 2 ? 'bg-amber-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${dist.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-2 bg-slate-50 border border-dashed border-slate-200 rounded text-[9px] text-slate-400 leading-relaxed text-center">
            NC仓主要依靠 FEDEX 和 USPS 作为地面派送核心承运商，合计发运占比达 80.0%。
          </div>
        </div>
      </div>

      {/* Logs and Feed Row */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>实时仓储作业操作日志 (Operation Logs)</span>
          </h4>
          <span className="text-[9px] text-slate-400">实时滚动</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider h-7">
                <th className="px-3">操作时间</th>
                <th className="px-3">操作人</th>
                <th className="px-3">模块</th>
                <th className="px-3">行为</th>
                <th className="px-3">日志详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 h-7.5">
                  <td className="px-3 font-mono text-slate-400 whitespace-nowrap">{log.createdAt}</td>
                  <td className="px-3 font-semibold text-slate-700">{log.username}</td>
                  <td className="px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-3 font-medium text-slate-800">{log.action}</td>
                  <td className="px-3 text-slate-500 max-w-sm truncate" title={log.detail}>
                    {log.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
