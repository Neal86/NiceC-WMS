import React, { useState } from 'react';
import { HelpCircle, LogOut } from 'lucide-react';

interface ClientPortalProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: string;
    customerId?: string;
    avatar?: string;
  };
  onLogout: () => void;
}

const sidebarItems = [
  '首页', '平台订单', '仓储服务', '退件', '转运', 'FBA退货',
  '库存', '产品管理', '统计分析', '账户&账单', '系统设置'
];

export default function ClientPortal({ currentUser, onLogout }: ClientPortalProps) {
  const [activeSidebar, setActiveSidebar] = useState('首页');

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-12 bg-[#001b44] text-white flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center text-xs font-bold">NC</div>
          <span className="text-sm font-bold">NiceC OMS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-white text-slate-800 text-xs px-6 h-12 flex items-center rounded-t-md font-medium">首页</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button className="text-white/70 hover:text-white cursor-pointer"><HelpCircle className="w-4 h-4" /></button>
          <span className="text-white/70">中文 v</span>
          <div className="w-6 h-6 rounded-full bg-blue-300 flex items-center justify-center text-xs text-white font-bold">
            {currentUser.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-white/80 max-w-[200px] truncate">泉州之道 - 耀子兴 - 一件代发</span>
          <button onClick={onLogout} className="text-white/70 hover:text-white cursor-pointer ml-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[136px] bg-white shrink-0 border-r border-slate-200 overflow-y-auto">
          <nav className="py-2">
            {sidebarItems.map((item) => {
              const isActive = activeSidebar === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveSidebar(item)}
                  className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item}</span>
                  {item !== '首页' && <span className="text-slate-300 text-[10px]">&gt;</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Update time */}
          <div className="text-right text-xs text-slate-400">
            更新时间 2026-07-09 02:15:08 UTC+8
          </div>

          {/* First row: 5 stat cards */}
          <div className="grid grid-cols-5 gap-3">
            {/* 入库 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-2">入库</div>
              <div className="text-xs text-slate-400">待入库</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            {/* 出库 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-1">出库</div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>一件代发</span>
                <span className="text-slate-700 font-semibold">3</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>备货中转</span>
                <span className="text-slate-700 font-semibold">0</span>
              </div>
            </div>
            {/* 退件 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-2">退件</div>
              <div className="text-xs text-slate-400">待入库</div>
              <div className="text-xl font-bold text-slate-800">904</div>
            </div>
            {/* 转运 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-2">转运</div>
              <div className="text-xs text-slate-400">待收货</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            {/* FBA退货 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-1">FBA退货</div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>待入库</span>
                <span className="text-slate-700 font-semibold">1</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>待换标</span>
                <span className="text-slate-700 font-semibold">0</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>待出库</span>
                <span className="text-slate-700 font-semibold">0</span>
              </div>
            </div>
          </div>

          {/* 单量分析 */}
          <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">单量分析</h3>
              <div className="flex items-center gap-2 text-xs">
                <button className="px-3 py-1 bg-blue-50 border border-blue-300 text-blue-600 rounded text-xs font-medium">本周</button>
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded text-xs">本月</button>
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded text-xs">本年</button>
                <span className="text-slate-400 mx-1">|</span>
                <span className="text-slate-500">2026-07-06 → 2026-07-07</span>
              </div>
            </div>

            {/* Small stat cards */}
            <div className="grid grid-cols-3 gap-3 w-[480px] mb-4">
              <div className="border-t-2 border-blue-400 pt-2">
                <div className="text-xs text-slate-400">入库单量</div>
                <div className="text-lg font-bold text-slate-800">0</div>
              </div>
              <div className="border-t-2 border-purple-400 pt-2">
                <div className="text-xs text-slate-400">一件代发单量</div>
                <div className="text-lg font-bold text-slate-800">4</div>
              </div>
              <div className="border-t-2 border-green-400 pt-2">
                <div className="text-xs text-slate-400">备货中转单量</div>
                <div className="text-lg font-bold text-slate-800">0</div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="h-[220px] w-full bg-white relative">
              <svg viewBox="0 0 600 220" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2].map((i) => (
                  <line key={`g-${i}`} x1="0" y1={40 + i * 60} x2="600" y2={40 + i * 60} stroke="#e2e8f0" strokeWidth="1" />
                ))}
                {/* Y axis labels */}
                <text x="10" y="44" fill="#94a3b8" fontSize="10">2</text>
                <text x="10" y="104" fill="#94a3b8" fontSize="10">1</text>
                <text x="10" y="164" fill="#94a3b8" fontSize="10">0.5</text>
                {/* X axis labels */}
                <text x="100" y="210" fill="#94a3b8" fontSize="10" textAnchor="middle">2026-07-06</text>
                <text x="500" y="210" fill="#94a3b8" fontSize="10" textAnchor="middle">2026-07-07</text>
                {/* Horizontal line for y=2 (purple) */}
                <line x1="60" y1="40" x2="600" y2="40" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />
                {/* Horizontal line for y=0.5 (green) */}
                <line x1="60" y1="164" x2="600" y2="164" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
              </svg>
            </div>
          </div>

          {/* Bottom 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {/* 最新公告 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">最新公告</h4>
              <div className="border border-slate-100 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-700 leading-relaxed">联邦法定假日：阵亡将士纪念日-放假通知</p>
                    <p className="text-xs text-slate-400 mt-1">2026-05-19</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">海外仓</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">系统</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 库存 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">库存</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">在库总数</span>
                <span className="text-xl font-bold text-slate-800">204</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-slate-400">可用SKU</span>
                <span className="text-base font-bold text-slate-800">2,020</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-green-100 rounded-full">
                  <div className="h-2 w-1/2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs text-slate-500">204</span>
              </div>
            </div>

            {/* 账号资产 */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">账号资产</h4>
              <div className="inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded mb-2">USD</div>
              <div className="text-xl font-bold text-red-500">-27,418.6861</div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-slate-400">信用额度：</span>
                <span className="text-slate-700 font-semibold">1,000,000.0000</span>
              </div>
              <div className="mt-3 text-right">
                <button className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 cursor-pointer">服务</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
