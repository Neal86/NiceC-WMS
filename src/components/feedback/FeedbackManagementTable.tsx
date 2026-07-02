import React, { useState, useEffect } from 'react';
import { Search, RotateCw, Inbox, ChevronLeft, ChevronRight, Eye, ClipboardList, Filter } from 'lucide-react';
import { Feedback } from '../../types';
import { FeedbackStatusBadge } from './FeedbackStatusBadge';
import { FeedbackPriorityBadge } from './FeedbackPriorityBadge';
import { FeedbackDetailDrawer } from './FeedbackDetailDrawer';

const FEEDBACK_TYPES = [
  'All Types',
  'Bug Report',
  'Feature Request',
  'Data Issue',
  'UI/UX Suggestion',
  'Integration Issue',
  'Warehouse Operation Issue',
  'Inventory Issue',
  'Order Issue',
  'Billing Issue',
  'Other'
];

const STATUSES = ['All Statuses', 'New', 'In Review', 'Planned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['All Priorities', 'Low', 'Medium', 'High', 'Critical'];

const WAREHOUSES = [
  'All Warehouses',
  'LA Warehouse',
  'Ontario Warehouse',
  'New Jersey Warehouse',
  'Dallas Warehouse',
  'Amazon FBA Transit Area'
];

const OPERATION_SCOPES = [
  'All Operations',
  'Inbound',
  'Outbound',
  'Inventory',
  'Returns',
  'FBA Transfer',
  'Billing',
  'Exceptions'
];

export const FeedbackManagementTable: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [selectedScope, setSelectedScope] = useState('All Operations');

  // Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer state
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (selectedType !== 'All Types') params.append('type', selectedType);
      if (selectedStatus !== 'All Statuses') params.append('status', selectedStatus);
      if (selectedPriority !== 'All Priorities') params.append('priority', selectedPriority);
      if (selectedWarehouse !== 'All Warehouses') params.append('warehouseId', selectedWarehouse);
      if (selectedScope !== 'All Operations') params.append('operationScope', selectedScope);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Sort descending by date
        data.sort((a: Feedback, b: Feedback) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFeedbacks(data);
      } else {
        throw new Error('Failed to load feedback records.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    setPage(1); // Reset page on filter change
  }, [selectedType, selectedStatus, selectedPriority, selectedWarehouse, selectedScope]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedbacks();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedType('All Types');
    setSelectedStatus('All Statuses');
    setSelectedPriority('All Priorities');
    setSelectedWarehouse('All Warehouses');
    setSelectedScope('All Operations');
  };

  // Pagination slicing
  const totalItems = feedbacks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedFeedbacks = feedbacks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-gray-800">WMS Feedback Management</h2>
              <p className="text-[10px] text-gray-500">
                Track, triage, and resolve warehouse operator suggestions, bug reports, and anomalies.
              </p>
            </div>
          </div>
          <button
            onClick={fetchFeedbacks}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 text-gray-700 transition-all cursor-pointer shadow-xs active:scale-95 duration-100"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Selection Panel */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px] font-semibold text-gray-600">
          {/* Type Select */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              {FEEDBACK_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Priority Select */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Select */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium">Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              {WAREHOUSES.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Scope Select */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium">Operation Scope</label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              {OPERATION_SCOPES.map(scope => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col justify-end">
            <label className="block text-[10px] text-gray-400 mb-1 font-medium">Search Keyword</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg bg-white text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
          </form>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-20">
            <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading WMS Feedback state...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-semibold">{error}</div>
        ) : paginatedFeedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 py-20">
            <Inbox className="w-12 h-12 text-gray-300" />
            <p className="text-xs font-semibold">No feedback records found matching the active filters.</p>
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-500 border-b border-gray-150 font-bold text-[10px] tracking-wider uppercase">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Related Scope</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
              {paginatedFeedbacks.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[10px] text-gray-400">{item.id.substring(3)}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate">
                    <div className="font-bold text-gray-800">{item.title}</div>
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">{item.description}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">{item.contactEmail}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                      {item.operationScope || 'All Operations'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{item.warehouseId || 'All Warehouses'}</td>
                  <td className="py-3.5 px-4">
                    <FeedbackPriorityBadge priority={item.priority} />
                  </td>
                  <td className="py-3.5 px-4">
                    <FeedbackStatusBadge status={item.status} />
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{item.assignedToUsername || 'Unassigned'}</td>
                  <td className="py-3.5 px-4 text-gray-400 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedFeedbackId(item.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {feedbacks.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-600 shrink-0">
          <div>
            Showing <span className="font-bold text-gray-800">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-gray-800">{Math.min(page * pageSize, totalItems)}</span> of{' '}
            <span className="font-bold text-gray-800">{totalItems}</span> feedback reports
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded bg-white text-xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded bg-white disabled:opacity-50 hover:bg-gray-50 text-gray-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-500 px-1">
                Page <span className="font-bold text-gray-800">{page}</span> of <span className="font-bold text-gray-800">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-200 rounded bg-white disabled:opacity-50 hover:bg-gray-50 text-gray-500 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      {selectedFeedbackId && (
        <FeedbackDetailDrawer
          feedbackId={selectedFeedbackId}
          onClose={() => setSelectedFeedbackId(null)}
          onUpdateSuccess={fetchFeedbacks}
        />
      )}
    </div>
  );
};
