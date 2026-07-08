import React, { useState } from 'react';
import { 
  Search, RefreshCw, Printer, FileSpreadsheet, Settings, 
  HelpCircle, SlidersHorizontal, Check, Plus, Filter, Eye, Download
} from 'lucide-react';

interface PutawayTask {
  id: string;
  taskNo: string; // PAS...
  inboundNo: string; // IB...
  inboundType: string;
  client: string;
  productCount: number;
  skusSummary: string;
  createdAt: string;
  putawayAt: string;
  status: '待上架' | '上架中' | '已上架';
}

const INITIAL_PUTAWAY_TASKS: PutawayTask[] = [
  {
    id: 'pa_1',
    taskNo: 'PAS026260630RT',
    inboundNo: 'IB026260522RU',
    inboundType: '常规入库',
    client: '之道 - 悠悠(1108026)',
    productCount: 10,
    skusSummary: 'FA-zuoyitao005-BlackWhiteFS * 10',
    createdAt: '2026-06-30 09:59:31',
    putawayAt: '2026-06-30 09:59:49',
    status: '已上架'
  },
  {
    id: 'pa_2',
    taskNo: 'PAS026260630RS',
    inboundNo: 'IB026260522RU',
    inboundType: '常规入库',
    client: '之道 - 悠悠(1108026)',
    productCount: 10,
    skusSummary: 'FA-zuoyitao005-BlackFS * 10',
    createdAt: '2026-06-30 09:56:54',
    putawayAt: '2026-06-30 10:00:03',
    status: '已上架'
  },
  {
    id: 'pa_3',
    taskNo: 'PAS022260624RS',
    inboundNo: 'IB022260529RS',
    inboundType: '常规入库',
    client: 'YANGZHOU(1108022)',
    productCount: 679,
    skusSummary: '多个(10)',
    createdAt: '2026-06-24 05:57:51',
    putawayAt: '2026-06-24 06:01:52',
    status: '已上架'
  },
  {
    id: 'pa_4',
    taskNo: 'PAS038260624RS',
    inboundNo: 'IB038260517RS',
    inboundType: '常规入库',
    client: '微彩微(1108038)',
    productCount: 510,
    skusSummary: 'PEAKX6-hei * 510',
    createdAt: '2026-06-24 05:53:51',
    putawayAt: '2026-06-24 05:54:31',
    status: '已上架'
  },
  {
    id: 'pa_5',
    taskNo: 'PAS018260624RS',
    inboundNo: 'IB018260611RS',
    inboundType: '常规入库',
    client: '天旭01(1108018)',
    productCount: 50,
    skusSummary: 'ruanguan * 50',
    createdAt: '2026-06-24 04:40:43',
    putawayAt: '2026-06-24 04:44:21',
    status: '已上架'
  },
  {
    id: 'pa_6',
    taskNo: 'PAS022260623RS',
    inboundNo: 'IB022260529RT',
    inboundType: '常规入库',
    client: 'YANGZHOU(1108022)',
    productCount: 493,
    skusSummary: '多个(8)',
    createdAt: '2026-06-23 02:36:07',
    putawayAt: '2026-06-23 02:39:27',
    status: '已上架'
  },
  {
    id: 'pa_7',
    taskNo: 'PAS018260623RS',
    inboundNo: 'IB018260615RS',
    inboundType: '常规入库',
    client: '天旭01(1108018)',
    productCount: 150,
    skusSummary: '多个(6)',
    createdAt: '2026-06-23 01:37:48',
    putawayAt: '2026-06-23 01:52:35',
    status: '已上架'
  },
  {
    id: 'pa_8',
    taskNo: 'PAS012260618RS',
    inboundNo: 'IB012260429RS',
    inboundType: '备货中转入库',
    client: '杭州唯典(1108012)',
    productCount: 84,
    skusSummary: '多个(2)',
    createdAt: '2026-06-18 09:20:43',
    putawayAt: '2026-06-18 09:22:45',
    status: '已上架'
  },
  {
    id: 'pa_9',
    taskNo: 'PAS040260617RZ',
    inboundNo: 'IB040260505RW',
    inboundType: '常规入库',
    client: 'JIDONG(1108040)',
    productCount: 180,
    skusSummary: 'X004H5PZ1J * 180',
    createdAt: '2026-06-17 09:13:02',
    putawayAt: '2026-06-17 09:13:45',
    status: '已上架'
  },
  {
    id: 'pa_10',
    taskNo: 'PAS040260617RY',
    inboundNo: 'IB040260505S0',
    inboundType: '常规入库',
    client: 'JIDONG(1108040)',
    productCount: 90,
    skusSummary: 'X003YV8FJV * 90',
    createdAt: '2026-06-17 09:12:55',
    putawayAt: '2026-06-17 09:14:02',
    status: '已上架'
  }
];

export default function PutawayManager() {
  const [tasks, setTasks] = useState<PutawayTask[]>(INITIAL_PUTAWAY_TASKS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROGRESS' | 'DONE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'NORMAL' | 'TRANSIT'>('ALL');
  const [clientSearch, setClientSearch] = useState('');
  const [taskSearchType, setTaskSearchType] = useState('taskNo');
  const [taskSearchVal, setTaskSearchVal] = useState('');
  const [dateStart, setDateStart] = useState('2026-03-30');
  const [dateEnd, setDateEnd] = useState('2026-07-01');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReset = () => {
    setTypeFilter('ALL');
    setClientSearch('');
    setTaskSearchType('taskNo');
    setTaskSearchVal('');
    setDateStart('2026-03-30');
    setDateEnd('2026-07-01');
    showToast('已重置所有上架单筛选条件', 'info');
  };

  const filteredTasks = tasks.filter(t => {
    // 1. Completion tabs
    if (activeTab === 'PENDING' && t.status !== '待上架') return false;
    if (activeTab === 'PROGRESS' && t.status !== '上架中') return false;
    if (activeTab === 'DONE' && t.status !== '已上架') return false;

    // 2. Inbound Type filter
    if (typeFilter === 'NORMAL' && t.inboundType !== '常规入库') return false;
    if (typeFilter === 'TRANSIT' && t.inboundType !== '备货中转入库') return false;

    // 3. Client Filter
    if (clientSearch && !t.client.toLowerCase().includes(clientSearch.toLowerCase())) return false;

    // 4. Task No or Inbound No search
    if (taskSearchVal) {
      const searchLower = taskSearchVal.toLowerCase();
      if (taskSearchType === 'taskNo' && !t.taskNo.toLowerCase().includes(searchLower)) return false;
      if (taskSearchType === 'inboundNo' && !t.inboundNo.toLowerCase().includes(searchLower)) return false;
    }

    // 5. Date filter
    const taskDate = t.createdAt.split(' ')[0];
    if (dateStart && taskDate < dateStart) return false;
    if (dateEnd && taskDate > dateEnd) return false;

    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTasks.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePrint = (taskNo: string) => {
    showToast(`正在发送上架单 ${taskNo} 的上架标签打印指令...`, 'success');
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) {
      showToast('请选择需要打印的记录', 'error');
      return;
    }
    showToast(`成功发送 ${selectedIds.length} 份上架单的批量标签打印请求！`, 'success');
  };

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans text-[12px] text-slate-700 select-none">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4.5 py-2.5 rounded shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header Status Tabs */}
      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center shrink-0">
        <div className="flex gap-4">
          {[
            { key: 'ALL', label: `全部 (${tasks.length})` },
            { key: 'PENDING', label: `待上架 (${tasks.filter(t => t.status === '待上架').length})` },
            { key: 'PROGRESS', label: `上架中 (${tasks.filter(t => t.status === '上架中').length})` },
            { key: 'DONE', label: `已上架 (${tasks.filter(t => t.status === '已上架').length})` }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`h-9.5 px-1 hover:text-blue-600 border-b-2 font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  isActive ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Filter Controls */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
        
        {/* Type Buttons */}
        <div className="flex border border-slate-300 rounded overflow-hidden">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`h-7 px-3 font-semibold transition-colors cursor-pointer ${
              typeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setTypeFilter('NORMAL')}
            className={`h-7 px-3 border-l border-slate-300 font-semibold transition-colors cursor-pointer ${
              typeFilter === 'NORMAL' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            常规入库
          </button>
          <button
            onClick={() => setTypeFilter('TRANSIT')}
            className={`h-7 px-3 border-l border-slate-300 font-semibold transition-colors cursor-pointer ${
              typeFilter === 'TRANSIT' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            备货中转入库
          </button>
        </div>

        {/* Client filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="客户名称/代码"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="h-7 w-36 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Search selectors */}
        <div className="flex items-center border border-slate-300 rounded overflow-hidden h-7">
          <select
            value={taskSearchType}
            onChange={(e) => setTaskSearchType(e.target.value)}
            className="h-full px-1 bg-slate-50 text-slate-600 border-r border-slate-300 outline-none font-semibold cursor-pointer"
          >
            <option value="taskNo">上架单号</option>
            <option value="inboundNo">入库单号</option>
          </select>
          <input
            type="text"
            placeholder="请输入单号..."
            value={taskSearchVal}
            onChange={(e) => setTaskSearchVal(e.target.value)}
            className="h-full px-2 w-44 outline-none"
          />
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[11px] font-semibold">创建时间:</span>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="h-7 px-2 border border-slate-300 rounded text-slate-700 outline-none"
          />
          <span>至</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="h-7 px-2 border border-slate-300 rounded text-slate-700 outline-none"
          />
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="h-7 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded font-bold transition-all cursor-pointer"
        >
          重置
        </button>

      </div>

      {/* 3. Actions Row */}
      <div className="h-9 bg-[#f9fafb] border-b border-slate-200 px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('请在“到仓扫描”或“入库管理”界面进行一键入库触发，系统将在此处全自动按库区策略生成上架单。')}
            className="h-6 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>生成上架单</span>
          </button>
          
          <button
            onClick={handleBulkPrint}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>批量打印标签</span>
          </button>

          <button
            onClick={() => alert('已经开始导出当前过滤列表的上架记录Excel...')}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>导出上架单</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>共找到 {filteredTasks.length} 条上架计划</span>
          <RefreshCw
            onClick={() => {
              setTasks(INITIAL_PUTAWAY_TASKS);
              showToast('已拉取最新上架指令列表', 'success');
            }}
            className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer transition-all"
          />
        </div>
      </div>

      {/* 4. Table Grid */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full border-collapse bg-white select-none text-left table-fixed">
          <thead>
            <tr className="bg-[#f5f7fa] text-slate-500 font-semibold border-b border-slate-200 text-[10.5px] h-8 sticky top-0 z-10">
              <th className="w-9 text-center border-r border-slate-200/60">
                <input
                  type="checkbox"
                  checked={filteredTasks.length > 0 && selectedIds.length === filteredTasks.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="w-40 px-2 border-r border-slate-200/60">上架单号</th>
              <th className="w-40 px-2 border-r border-slate-200/60">入库单号</th>
              <th className="w-28 px-2 border-r border-slate-200/60 text-center">入库类型</th>
              <th className="w-52 px-2 border-r border-slate-200/60">客户</th>
              <th className="w-24 px-2 border-r border-slate-200/60 text-right">产品数量</th>
              <th className="w-56 px-2 border-r border-slate-200/60">SKU * 数量</th>
              <th className="w-36 px-2 border-r border-slate-200/60">创建时间</th>
              <th className="w-36 px-2 border-r border-slate-200/60">上架时间</th>
              <th className="w-20 px-2 border-r border-slate-200/60 text-center">状态</th>
              <th className="w-24 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-[11px]">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="h-40 text-center text-slate-400 font-medium">
                  未找到任何匹配的上架单记录
                </td>
              </tr>
            ) : (
              filteredTasks.map(t => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/80 h-9.5 transition-colors ${
                      isSelected ? 'bg-blue-500/[0.03]' : ''
                    }`}
                  >
                    <td className="text-center border-r border-slate-100">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(t.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono font-bold text-blue-600 hover:underline cursor-pointer">
                      {t.taskNo}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-600">
                      {t.inboundNo}
                    </td>
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        t.inboundType === '常规入库' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {t.inboundType}
                      </span>
                    </td>
                    <td className="px-2 border-r border-slate-100 truncate text-slate-500" title={t.client}>
                      {t.client}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-700 text-right font-medium">
                      {t.productCount}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 truncate" title={t.skusSummary}>
                      {t.skusSummary}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400">
                      {t.createdAt}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400">
                      {t.putawayAt || '-'}
                    </td>
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === '已上架' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === '上架中' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handlePrint(t.taskNo)}
                        className="text-blue-600 hover:text-blue-800 font-bold transition-all cursor-pointer"
                      >
                        打印
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
