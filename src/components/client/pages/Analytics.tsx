import { useState } from 'react';
import { BarChart4, TrendingUp, Package, Truck, RotateCcw } from 'lucide-react';

export default function Analytics() {
  const [period, setPeriod] = useState('thisMonth');

  const cards = [
    { label: '入库单数', value: '128', change: '+12%', icon: <Package className="w-4 h-4 text-blue-500" />, color: 'border-l-blue-400' },
    { label: '出库单数', value: '356', change: '+8%', icon: <Truck className="w-4 h-4 text-purple-500" />, color: 'border-l-purple-400' },
    { label: '退件单数', value: '42', change: '-3%', icon: <RotateCcw className="w-4 h-4 text-amber-500" />, color: 'border-l-amber-400' },
    { label: '近30天费用', value: '$12,846.50', change: '+5%', icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: 'border-l-emerald-400' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">统计分析</h2>
        <div className="flex items-center gap-2">
          {['thisWeek', 'thisMonth', 'thisYear'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] rounded cursor-pointer ${period === p ? 'bg-blue-50 border border-blue-300 text-blue-600' : 'bg-white border border-slate-200 text-slate-500'}`}>
              {p === 'thisWeek' ? '本周' : p === 'thisMonth' ? '本月' : '本年'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className={`bg-white rounded-md shadow-sm border border-slate-100 p-4 border-l-4 ${c.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500">{c.label}</span>
              {c.icon}
            </div>
            <div className="text-xl font-bold text-slate-800">{c.value}</div>
            <div className="text-[10px] mt-1" style={{ color: c.change.startsWith('+') ? '#059669' : '#dc2626' }}>{c.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">单量趋势</h3>
          <div className="h-[240px] flex items-center justify-center bg-slate-50 rounded text-xs text-slate-400">
            订单趋势图表
          </div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">费用分析</h3>
          <div className="h-[240px] flex items-center justify-center bg-slate-50 rounded text-xs text-slate-400">
            费用分析图表
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">平台分布</h3>
          <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded text-xs text-slate-400">
            平台分布图表
          </div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">库存周转</h3>
          <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded text-xs text-slate-400">
            库存周转图表
          </div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Top SKU</h3>
          <div className="space-y-2">
            {['SKU-10001', 'SKU-10002', 'SKU-10003', 'SKU-10004', 'SKU-10005'].map((sku, i) => (
              <div key={sku} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{sku}</span>
                <span className="font-mono text-slate-400">{Math.floor(Math.random() * 500)}单</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
