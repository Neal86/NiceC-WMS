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
  'Dashboard', 'Orders', 'Inventory', 'Inbound', 'Returns',
  'Billing', 'Invoices', 'API Keys', 'Webhooks', 'Store Connections', 'Support'
];

export default function ClientPortal({ currentUser, onLogout }: ClientPortalProps) {
  const [activeSidebar, setActiveSidebar] = useState('Dashboard');

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-12 bg-[#001b44] text-white flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center text-xs font-bold">NC</div>
          <span className="text-sm font-bold">NiceC Client Portal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-white text-slate-800 text-xs px-6 h-12 flex items-center rounded-t-md font-medium">Dashboard</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button className="text-white/70 hover:text-white cursor-pointer"><HelpCircle className="w-4 h-4" /></button>
          <div className="w-6 h-6 rounded-full bg-blue-300 flex items-center justify-center text-xs text-white font-bold">
            {currentUser.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-white/80">{currentUser.email}</span>
          <span className="text-white/50">|</span>
          <span className="text-white/60">CLIENT</span>
          <span className="text-white/50">|</span>
          <span className="text-white/60 max-w-[160px] truncate">Quanzhou - Yaozixing - Drop Ship</span>
          <button onClick={onLogout} className="text-white/70 hover:text-white cursor-pointer ml-1" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[170px] bg-white shrink-0 border-r border-slate-200 overflow-y-auto">
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
                  <span className="truncate">{item}</span>
                  {item !== 'Dashboard' && <span className="text-slate-300 text-[10px] shrink-0">&gt;</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Update time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Demo Data</span>
            <span className="text-slate-400">Updated 2026-07-09 02:15:08 UTC+8</span>
          </div>

          {/* First row: 5 stat cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-2">Inbound</div>
              <div className="text-xs text-slate-400">Pending Receipt</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-1">Outbound</div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Drop Ship</span>
                <span className="text-slate-700 font-semibold">3</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Bulk Transfer</span>
                <span className="text-slate-700 font-semibold">0</span>
              </div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-2">Returns</div>
              <div className="text-xs text-slate-400">Pending Receipt</div>
              <div className="text-xl font-bold text-slate-800">904</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-2">Transfers</div>
              <div className="text-xs text-slate-400">Pending Receipt</div>
              <div className="text-xl font-bold text-slate-800">0</div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4 min-h-[96px]">
              <div className="text-xs text-slate-500 mb-1">FBA Returns</div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Pending Receipt</span>
                <span className="text-slate-700 font-semibold">1</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Pending Relabel</span>
                <span className="text-slate-700 font-semibold">0</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Pending Outbound</span>
                <span className="text-slate-700 font-semibold">0</span>
              </div>
            </div>
          </div>

          {/* Volume Analysis */}
          <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Volume Analysis</h3>
              <div className="flex items-center gap-2 text-xs">
                <button className="px-3 py-1 bg-blue-50 border border-blue-300 text-blue-600 rounded text-xs font-medium">This Week</button>
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded text-xs">This Month</button>
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded text-xs">This Year</button>
                <span className="text-slate-400 mx-1">|</span>
                <span className="text-slate-500">2026-07-06 → 2026-07-07</span>
              </div>
            </div>

            {/* Small stat cards */}
            <div className="grid grid-cols-3 gap-3 w-[480px] mb-4">
              <div className="border-t-2 border-blue-400 pt-2">
                <div className="text-xs text-slate-400">Inbound Orders</div>
                <div className="text-lg font-bold text-slate-800">0</div>
              </div>
              <div className="border-t-2 border-purple-400 pt-2">
                <div className="text-xs text-slate-400">Drop Ship Orders</div>
                <div className="text-lg font-bold text-slate-800">4</div>
              </div>
              <div className="border-t-2 border-green-400 pt-2">
                <div className="text-xs text-slate-400">Bulk Transfer Orders</div>
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
                <text x="10" y="164" fill="#94a3b8" fontSize="10">0</text>
                {/* X axis labels */}
                <text x="150" y="210" fill="#94a3b8" fontSize="10" textAnchor="middle">2026-07-06</text>
                <text x="450" y="210" fill="#94a3b8" fontSize="10" textAnchor="middle">2026-07-07</text>
                {/* Data line (purple - drop ship) */}
                <line x1="60" y1="40" x2="600" y2="164" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />
                {/* Data line (green - bulk) */}
                <line x1="60" y1="164" x2="600" y2="164" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
                {/* Legend */}
                <rect x="460" y="10" width="8" height="3" fill="#a855f7" rx="1" />
                <text x="472" y="13" fill="#94a3b8" fontSize="8">Drop Ship</text>
                <rect x="530" y="10" width="8" height="3" fill="#22c55e" rx="1" />
                <text x="542" y="13" fill="#94a3b8" fontSize="8">Bulk Transfer</text>
              </svg>
            </div>
          </div>

          {/* Bottom 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {/* Announcements */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Announcements</h4>
              <div className="border border-slate-100 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-700 leading-relaxed">Federal Holiday: Memorial Day - Office Closure Notice</p>
                    <p className="text-xs text-slate-400 mt-1">2026-05-19</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Overseas</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">System</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Inventory</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Total In Stock</span>
                <span className="text-xl font-bold text-slate-800">204</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-slate-400">Active SKUs</span>
                <span className="text-base font-bold text-slate-800">2,020</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-green-100 rounded-full">
                  <div className="h-2 w-1/2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs text-slate-500">204</span>
              </div>
            </div>

            {/* Account Balance */}
            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Account Balance</h4>
              <div className="inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded mb-2">USD</div>
              <div className="text-xl font-bold text-red-500">-27,418.69</div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-slate-400">Credit Limit:</span>
                <span className="text-slate-700 font-semibold">1,000,000.00</span>
              </div>
              <div className="mt-3 text-right">
                <button className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 cursor-pointer">Services</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
