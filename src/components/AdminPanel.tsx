import React, { useState } from 'react';
import { Home, Users, Globe, Package, Truck, Warehouse, Settings, DollarSign, ChevronDown, Info, LogOut, Box, RotateCcw } from 'lucide-react';

interface AdminPanelProps {
  currentUser: any;
  onNavigateBack: () => void;
  onLogout: () => void;
  initialPath?: string;
}

const sidebarItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Users', icon: Users },
  { label: 'Customers', icon: Globe },
  { label: 'Warehouses', icon: Warehouse },
  { label: 'SKUs', icon: Package },
  { label: 'Inventory', icon: Box },
  { label: 'Inbound', icon: Truck },
  { label: 'Outbound', icon: Truck },
  { label: 'Billing', icon: DollarSign },
  { label: 'Integrations', icon: Settings },
  { label: 'Operation Logs', icon: RotateCcw },
  { label: 'Settings', icon: Settings },
];

const chartDates = [
  '2026-06-08', '2026-06-09', '2026-06-11', '2026-06-12', '2026-06-15',
  '2026-06-17', '2026-06-21', '2026-06-22', '2026-06-29', '2026-06-30', '2026-07-03'
];

const chartValues = [2, 1.8, 1, 1, 1, 1, 1.2, 2, 1.5, 1, 1];

export default function AdminPanel({ currentUser, onNavigateBack, onLogout, initialPath = '/admin' }: AdminPanelProps) {
  const [activeSidebar, setActiveSidebar] = useState('Dashboard');

  // Access check
  const role = String(currentUser?.role || '').toUpperCase();
  if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-4">You do not have permission to access the Admin Panel.</p>
          <button onClick={onNavigateBack} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const chartPath = chartValues.map((v, i) => {
    const x = 40 + (i * 520) / (chartValues.length - 1);
    const y = 200 - (v / 2.2) * 170;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-12 bg-[#001b44] text-white flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center text-xs font-bold">NC</div>
          <span className="text-sm font-bold">NiceC Admin</span>
          <button className="text-white/70 hover:text-white ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-white text-slate-800 text-xs px-6 h-12 flex items-center rounded-t-md font-medium">Dashboard</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/60">{new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
          <div className="w-6 h-6 rounded-full bg-blue-300 flex items-center justify-center text-xs text-white font-bold">
            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-white/80">{currentUser?.email || ''}</span>
          <span className="text-white/70">ADMIN</span>
          <button onClick={onLogout} className="text-white/70 hover:text-white cursor-pointer ml-1" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[160px] bg-[#071226] shrink-0 overflow-y-auto">
          <nav className="py-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebar === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveSidebar(item.label)}
                  className={`w-full text-left py-2.5 text-xs flex items-center gap-2 ${
                    isActive ? 'bg-blue-600 text-white font-medium border-r-2 border-blue-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${isActive ? 'px-3' : 'px-4'}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-100">
          {/* Warehouse filter */}
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 bg-white border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1">
              All Warehouses <ChevronDown className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Demo Data</span>
          </div>

          {/* Stat cards grid */}
          <div className="grid grid-cols-7 gap-3">
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Inbound</div>
              <div className="text-xs text-slate-400">Pending</div>
              <div className="text-xl font-bold text-slate-800">13</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Outbound</div>
              <div className="flex justify-between text-xs text-slate-400"><span>Drop Ship</span><span className="text-slate-700 font-semibold">97</span></div>
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Bulk Transfer</span><span className="text-slate-700 font-semibold">0</span></div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Returns</div>
              <div className="text-xs text-slate-400">Pending Receipt</div>
              <div className="text-xl font-bold text-slate-800">964</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Transfers</div>
              <div className="text-xs text-slate-400">Pending Receipt</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Top-Up Reviews</div>
              <div className="text-xs text-slate-400">Pending</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Product Reviews</div>
              <div className="text-xs text-slate-400">Pending</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-400 mb-1">Order Cutoff</div>
              <div className="text-xs text-slate-400">Pending</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
          </div>

          {/* Volume Analysis */}
          <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Volume Analysis</h3>
                <Info className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Demo Data</span>
              </div>
              <span className="text-xs text-slate-500">2026-06-08 → 2026-07-07</span>
            </div>

            <div className="grid grid-cols-6 gap-3 mb-4">
              <div><div className="text-xs text-slate-400">Standard Inbound</div><div className="text-sm font-bold text-slate-800">0</div></div>
              <div><div className="text-xs text-slate-400">Bulk Transfer In</div><div className="text-sm font-bold text-slate-800">0</div></div>
              <div><div className="text-xs text-slate-400">Drop Ship Out</div><div className="text-sm font-bold text-slate-800">0</div></div>
              <div><div className="text-xs text-slate-400">Bulk Transfer Out</div><div className="text-sm font-bold text-slate-800">0</div></div>
              <div><div className="text-xs text-slate-400">Relabel Service</div><div className="text-sm font-bold text-slate-800">0</div></div>
              <div><div className="text-xs text-slate-400">Defective Handling</div><div className="text-sm font-bold text-slate-800">0</div></div>
            </div>

            {/* SVG Chart */}
            <div className="h-[230px] w-full bg-white relative">
              <svg viewBox="0 0 600 230" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 0.5, 1, 1.5, 2].map((v, i) => (
                  <line key={`g-${i}`} x1="0" y1={15 + i * 43} x2="600" y2={15 + i * 43} stroke="#e2e8f0" strokeWidth="1" />
                ))}
                {/* Y axis labels */}
                <text x="8" y="19" fill="#94a3b8" fontSize="9">2</text>
                <text x="8" y="62" fill="#94a3b8" fontSize="9">1.5</text>
                <text x="8" y="105" fill="#94a3b8" fontSize="9">1</text>
                <text x="8" y="148" fill="#94a3b8" fontSize="9">0.5</text>
                <text x="8" y="191" fill="#94a3b8" fontSize="9">0</text>
                {/* X axis labels - show every 3rd to avoid overlap */}
                {chartDates.map((d, i) => {
                  if (i % 2 !== 0) return null;
                  const x = 40 + (i * 520) / (chartDates.length - 1);
                  return (
                    <text key={`x-${i}`} x={x} y="222" fill="#94a3b8" fontSize="8" textAnchor="middle">{d}</text>
                  );
                })}
                {/* Blue curve */}
                <path d={chartPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots on curve */}
                {chartValues.map((v, i) => {
                  const x = 40 + (i * 520) / (chartValues.length - 1);
                  const y = 200 - (v / 2.2) * 170;
                  return <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="#3b82f6" />;
                })}
              </svg>
            </div>
          </div>

          {/* Bottom 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {/* Announcements */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Announcements</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span>NiceC WMS v7.1 Release Notes</span><span className="text-slate-400 shrink-0">2026-07-03</span></div>
                <div className="flex justify-between text-xs"><span>NiceC WMS v6.18 Release Notes</span><span className="text-slate-400 shrink-0">2026-06-18</span></div>
                <div className="flex justify-between text-xs"><span>NiceC WMS v6.11 Release Notes</span><span className="text-slate-400 shrink-0">2026-06-12</span></div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Inventory</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Total In Stock</span>
                <span className="text-xl font-bold text-slate-800">38,700</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-slate-400">Active SKUs</span>
                <span className="text-base font-bold text-slate-800">1,041</span>
              </div>
            </div>

            {/* Fees */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Fees</h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">CNY</span>
                  <span className="text-slate-400">2026-07-05 → 2026-07-08</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">Service / Top-Up Fees</div>
              <div className="text-base font-bold text-slate-800 mt-1">0.00 CNY</div>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-red-500">YoY ↓100%</span>
                <span className="text-red-500">MoM ↓100%</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
