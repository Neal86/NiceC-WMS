import { useState, useEffect } from 'react';
import { clientService } from '../../../services/client/clientService';
import type { ClientStats } from '../../../types/client';

export default function Dashboard() {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('thisWeek');

  useEffect(() => {
    clientService.getDashboardStats().then(setStats);
    clientService.getAnnouncements().then(setAnnouncements);
  }, []);

  if (!stats) return <div className="text-xs text-slate-400 p-8 text-center">加载中...</div>;

  const statCards = [
    { label: '待入库', value: stats.inboundPending, sub: `今日 ${stats.inboundToday}`, color: 'border-l-4 border-l-blue-400' },
    { label: '待出库', value: stats.outboundPending, sub: `今日 ${stats.outboundToday}`, color: 'border-l-4 border-l-purple-400' },
    { label: '退件待处理', value: stats.returnPending, sub: `今日 ${stats.returnToday}`, color: 'border-l-4 border-l-amber-400' },
    { label: '转运待处理', value: stats.transshipmentPending, sub: '待处理', color: 'border-l-4 border-l-cyan-400' },
    { label: 'FBA退货待处理', value: stats.fbaReturnPending, sub: '待处理', color: 'border-l-4 border-l-rose-400' },
  ];

  return (
    <div className="space-y-3">
      {/* Top stat cards */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(c => (
          <div key={c.label} className={`bg-white rounded-md shadow-sm border border-slate-100 p-3 ${c.color}`}>
            <div className="text-[10px] text-slate-500 mb-1">{c.label}</div>
            <div className="text-xl font-bold text-slate-800">{c.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Volume Analysis */}
      <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">单量分析</h3>
          <div className="flex items-center gap-2 text-xs">
            {['thisWeek', 'thisMonth', 'thisYear'].map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  dateRange === r ? 'bg-blue-50 border border-blue-300 text-blue-600' : 'bg-white border border-slate-200 text-slate-500'
                }`}>
                {r === 'thisWeek' ? '本周' : r === 'thisMonth' ? '本月' : '本年'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 w-[480px] mb-4">
          <div className="border-t-2 border-blue-400 pt-2">
            <div className="text-xs text-slate-400">入库单数</div>
            <div className="text-lg font-bold text-slate-800">{stats.inboundToday || Math.floor(Math.random() * 20)}</div>
          </div>
          <div className="border-t-2 border-purple-400 pt-2">
            <div className="text-xs text-slate-400">一件代发单数</div>
            <div className="text-lg font-bold text-slate-800">{stats.outboundToday || Math.floor(Math.random() * 30)}</div>
          </div>
          <div className="border-t-2 border-green-400 pt-2">
            <div className="text-xs text-slate-400">备货中转单数</div>
            <div className="text-lg font-bold text-slate-800">0</div>
          </div>
        </div>
        <div className="h-[180px] flex items-center justify-center bg-slate-50 rounded text-xs text-slate-400">
          单量趋势图表区域
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Announcements */}
        <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3">最新公告</h4>
          {announcements.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">暂无公告</div>
          ) : (
            announcements.slice(0, 4).map(a => (
              <div key={a.id} className="border-b border-slate-50 py-2 last:border-0">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-slate-700 leading-relaxed">{a.title}</p>
                  <div className="flex gap-1 shrink-0 ml-2">
                    {a.tags?.map((t: string) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded whitespace-nowrap">{t}</span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.date}</p>
              </div>
            ))
          )}
        </div>

        {/* Inventory Summary */}
        <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3">库存统计</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">总库存</span>
            <span className="text-xl font-bold text-slate-800">{stats.inventoryTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xs text-slate-400">活跃 SKU</span>
            <span className="text-base font-bold text-slate-800">{stats.activeSkus}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-green-100 rounded-full">
              <div className="h-2 w-1/2 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-xs text-slate-500">{stats.inventoryTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Account Balance */}
        <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3">账户资产</h4>
          <div className="inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded mb-2">USD</div>
          <div className="text-xl font-bold text-red-500">
            {stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-slate-400">信用额度:</span>
            <span className="text-slate-700 font-semibold">{stats.creditLimit.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className="text-slate-400">可下单金额:</span>
            <span className="text-slate-700 font-semibold">{stats.orderableAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
