import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Search, LogOut } from 'lucide-react';
import {
  workOrderApi,
  outboundApi,
  inboundApi,
  pickApi,
  reviewApi,
  exceptionApi,
  relabelApi,
} from '../api';

interface WarehousePortalProps {
  currentUser: any;
  onLogout: () => void;
}

interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  priority: string;
  customer: string;
  type: string;
  status: string;
  createdAt: string;
  urgent: boolean;
}

const asArray = <T,>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.orders)) return value.orders;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const mapToWorkOrder = (item: any): WorkOrder => {
  const status = String(item.status || item.state || 'PENDING').toUpperCase();
  const priority = String(item.priority || item.urgency || '').toUpperCase();

  return {
    id: String(item.id || item.orderId || item.orderNo || Math.random()),
    orderNo: String(item.orderNo || item.workOrderNo || item.no || item.id || '-'),
    title: String(
      item.title ||
      item.remark ||
      item.recipient ||
      item.skuCode ||
      item.productName ||
      'Warehouse Task'
    ),
    priority: priority === 'URGENT' || priority === 'HIGH' || item.urgent ? '紧急' : '普通',
    customer: String(item.customerName || item.customerCode || item.customer?.name || item.customerId || '-'),
    type: String(item.type || item.orderType || item.operationType || 'Outbound'),
    status,
    createdAt: String(item.createdAt || item.createdTime || item.updatedAt || '-'),
    urgent: Boolean(item.urgent || priority === 'URGENT' || priority === 'HIGH'),
  };
};

const sidebarMenu = [
  { label: 'Dashboard', children: false },
  { label: 'Receiving', children: true, subs: ['Arrival Scan', 'Receiving Manage', 'Putaway', 'New Item Setup', 'Claim'] },
  { label: 'Picking', children: false },
  { label: 'Packing', children: false },
  { label: 'Weighing', children: false },
  { label: 'Review', children: false },
  { label: 'Shipping', children: false },
  { label: 'Returns', children: false },
  { label: 'Relabel', children: false },
  { label: 'Transfers', children: false },
  { label: 'Exceptions', children: false },
];

const statusTabLabels = ['All', 'Pending Review', 'Approved', 'Completed', 'Cancelled'];

export default function WarehousePortal({ currentUser, onLogout }: WarehousePortalProps) {
  const [activeSidebar, setActiveSidebar] = useState('Dashboard');
  const [expandedMenu, setExpandedMenu] = useState<string>('');
  const [activeStatusTab, setActiveStatusTab] = useState('All (0)');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');

  const toggleExpand = (label: string) => {
    setExpandedMenu(prev => prev === label ? '' : label);
  };

  useEffect(() => {
    let mounted = true;

    const safe = async (fn: () => Promise<any>) => {
      try {
        return await fn();
      } catch (err) {
        console.warn('Warehouse API failed:', err);
        return [];
      }
    };

    const load = async () => {
      setLoading(true);
      setError('');

      const params = currentUser?.warehouseId
        ? { warehouseId: currentUser.warehouseId, pageSize: 200 }
        : { pageSize: 200 };

      const [
        workOrders,
        outboundOrders,
        inboundOrders,
        pickTasks,
        reviewTasks,
        exceptions,
        relabelOrders,
      ] = await Promise.all([
        safe(() => workOrderApi.getOrders(params)),
        safe(() => outboundApi.getOrders(params as any)),
        safe(() => inboundApi.getOrders(params)),
        safe(() => pickApi.getTasks(params)),
        safe(() => reviewApi.getTasks(params)),
        safe(() => exceptionApi.getCases(params)),
        safe(() => relabelApi.getOrders(params)),
      ]);

      if (!mounted) return;

      const merged = [
        ...asArray(workOrders),
        ...asArray(outboundOrders),
        ...asArray(inboundOrders),
        ...asArray(pickTasks),
        ...asArray(reviewTasks),
        ...asArray(exceptions),
        ...asArray(relabelOrders),
      ].map(mapToWorkOrder);

      const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());

      setOrders(unique);
      setLoading(false);
    };

    load().catch((err) => {
      if (!mounted) return;
      console.error(err);
      setError('Failed to load warehouse tasks.');
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [currentUser?.warehouseId]);

  const filteredOrders = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNo.toLowerCase().includes(q) ||
        order.title.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q);

      const tab = activeStatusTab.replace(/\s\(\d+\)$/, '');
      const status = order.status.toUpperCase();

      const matchesTab =
        tab === 'All' ||
        (tab === 'Pending Review' && ['PENDING', 'REVIEW', 'REVIEWS', 'NEW', 'CREATED'].includes(status)) ||
        (tab === 'Approved' && ['APPROVED', 'PICKING', 'READY'].includes(status)) ||
        (tab === 'Completed' && ['COMPLETED', 'SHIPPED', 'DONE'].includes(status)) ||
        (tab === 'Cancelled' && ['CANCELLED', 'CANCELED'].includes(status));

      return matchesSearch && matchesTab;
    });
  }, [orders, searchText, activeStatusTab]);

  const pageSize = 20;
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusTabs = statusTabLabels.map((label) => {
    const count = label === 'All'
      ? orders.length
      : orders.filter((order) => {
          const status = order.status.toUpperCase();
          if (label === 'Pending Review') return ['PENDING', 'REVIEW', 'REVIEWS', 'NEW', 'CREATED'].includes(status);
          if (label === 'Approved') return ['APPROVED', 'PICKING', 'READY'].includes(status);
          if (label === 'Completed') return ['COMPLETED', 'SHIPPED', 'DONE'].includes(status);
          if (label === 'Cancelled') return ['CANCELLED', 'CANCELED'].includes(status);
          return false;
        }).length;

    return `${label} (${count})`;
  });

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-12 bg-[#001b44] text-white flex items-center shrink-0">
        <div className="flex items-center gap-2 px-3">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center text-xs font-bold">NC</div>
          <span className="text-sm font-bold mr-4">NiceC WMS</span>
          <button className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <div className="flex items-center h-full ml-2 gap-1">
          <div className="bg-white text-slate-900 rounded-t-md px-6 h-12 flex items-center text-xs font-medium">Work Orders</div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs px-4">
          <HelpCircle className="w-4 h-4 text-white/70" />
          <span className="text-white/80 font-medium">{currentUser?.email || currentUser?.username || 'user'}</span>
          <span className="text-white/50">|</span>
          <span className="text-white/60">{currentUser?.warehouseId || 'Warehouse'}</span>
          <span className="text-white/50">|</span>
          <span className="text-white/60">OPERATOR</span>
          <button onClick={onLogout} className="text-white/70 hover:text-white cursor-pointer ml-1" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[150px] bg-[#071226] shrink-0 overflow-y-auto">
          <nav className="py-2">
            {sidebarMenu.map((item) => {
              const isActive = activeSidebar === item.label;
              const isExpanded = expandedMenu === item.label;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      setActiveSidebar(item.label);
                      if (item.children) toggleExpand(item.label);
                    }}
                    className={`w-full text-left py-2.5 text-xs flex items-center justify-between ${
                      isActive ? 'bg-blue-600 text-white font-medium border-r-2 border-blue-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${isActive ? 'px-3' : 'px-4'}`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.children && (
                      <svg className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    )}
                  </button>
                  {item.children && isExpanded && item.subs && (
                    <div className="pl-2">
                      {item.subs.map((sub) => (
                        <button
                          key={sub}
                          className="w-full text-left px-4 py-1.5 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Status Tabs */}
          <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-6 shrink-0">
            {statusTabs.map((tab) => {
              const isActive = activeStatusTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveStatusTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`text-xs h-full border-b-2 flex items-center ${
                    isActive
                      ? 'text-blue-600 border-blue-600 font-medium'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="h-[54px] border-b border-slate-200 flex items-center gap-2 px-3 shrink-0 flex-wrap">
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>Customer</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>Work Order Type</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>Priority</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>Reply Status</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>Attachments</option>
            </select>
            <div className="relative">
              <input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search title..."
                className="h-8 text-xs border border-slate-200 rounded pl-2 pr-7 bg-white text-slate-600 w-[140px]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>Created</option>
            </select>
            <span className="text-xs text-slate-500 whitespace-nowrap">Live</span>
            <button className="h-8 px-3 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50">Reset</button>
          </div>

          {/* Action bar */}
          <div className="h-[52px] bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <button className="h-8 px-4 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Manage Types</button>
              <button className="h-8 px-3 text-xs bg-white border border-slate-200 rounded text-slate-600">Export</button>
            </div>
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {loading ? 'Loading' : error ? 'Partial Data' : 'Live Data'}
            </span>
            <button className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-[1600px] w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-10 px-3 py-3 text-left"><input type="checkbox" className="rounded" /></th>
                  <th className="w-[120px] px-3 py-3 text-left font-medium text-slate-500">Order No.</th>
                  <th className="w-[360px] px-3 py-3 text-left font-medium text-slate-500">Title</th>
                  <th className="w-[120px] px-3 py-3 text-left font-medium text-slate-500">Priority</th>
                  <th className="w-[280px] px-3 py-3 text-left font-medium text-slate-500">Customer</th>
                  <th className="w-[200px] px-3 py-3 text-left font-medium text-slate-500">Type</th>
                  <th className="w-[180px] px-3 py-3 text-left font-medium text-slate-500">Created</th>
                  <th className="w-[120px] px-3 py-3 text-left font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">Loading warehouse tasks...</td></tr>
                ) : pageOrders.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">{error || 'No warehouse tasks found.'}</td></tr>
                ) : (
                  pageOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3"><input type="checkbox" className="rounded" /></td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1">
                          {order.urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />}
                          <span className="text-blue-600">{order.orderNo}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{order.title}</td>
                      <td className="px-3 py-3">
                        <span className={`${order.priority === '紧急' ? 'text-red-500' : 'text-slate-500'}`}>{order.priority === '紧急' ? 'Urgent' : 'Normal'}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{order.customer}</td>
                      <td className="px-3 py-3 text-slate-600">{order.type}</td>
                      <td className="px-3 py-3 text-slate-500">{order.createdAt}</td>
                      <td className="px-3 py-3"><span className="text-blue-600 cursor-pointer hover:underline">Review</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="h-12 border-t border-slate-200 flex items-center justify-end px-4 gap-3 text-xs text-slate-500 shrink-0 bg-white">
            <span>{totalItems} items</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2 py-1 rounded ${p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
            <span>20 / page</span>
            <div className="flex items-center gap-1">
              <span>Go to</span>
              <input className="w-8 h-6 border border-slate-200 rounded text-center text-xs" defaultValue={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
