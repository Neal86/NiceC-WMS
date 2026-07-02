import React, { useState } from 'react';
import { 
  Search, RefreshCw, Plus, Check, FileSpreadsheet, Trash2, 
  ChevronDown, HelpCircle, ArrowRight, Eye, Calendar, Tag, ShieldAlert,
  SlidersHorizontal, Upload, Download, PackageOpen, LayoutGrid
} from 'lucide-react';

interface InboundOrder {
  id: string;
  orderNo: string;
  remark: string;
  receivedBoxes: number;
  totalBoxes: number;
  totalProducts: number;
  skusSummary: string;
  isNewSku: boolean;
  refNo: string;
  trackingNo: string;
  arrivalMethod: string;
  eta: string;
  client: string;
  inboundType: string;
  createdAt: string;
  status: 'PENDING' | 'RECEIVING' | 'RECEIVED' | 'SHELVING' | 'CANCELLED';
  hasWarning?: boolean;
}

const INITIAL_INBOUND_ORDERS: InboundOrder[] = [
  {
    id: 'IB010260630RS',
    orderNo: 'IB010260630RS',
    remark: 'PO260514002',
    receivedBoxes: 0,
    totalBoxes: 444,
    totalProducts: 444,
    skusSummary: '多个(12)',
    isNewSku: false,
    refNo: 'OWS260612001',
    trackingNo: 'TRHU8645010',
    arrivalMethod: '货柜 (40HQ)',
    eta: '-',
    client: '泉州之道 - Rocket-一件代发 (1108028)',
    inboundType: '常规入库',
    createdAt: '2026-06-30 14:58:54',
    status: 'PENDING',
    hasWarning: false
  },
  {
    id: 'IB026260629RT',
    orderNo: 'IB026260629RT',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 100,
    totalProducts: 100,
    skusSummary: 'FA-zuoyitao006-BlackFS * 100',
    isNewSku: false,
    refNo: 'OWS260629004',
    trackingNo: '-',
    arrivalMethod: '箱',
    eta: '-',
    client: '之道 - 悠悠(1108026)',
    inboundType: '常规入库',
    createdAt: '2026-06-29 17:49:18',
    status: 'PENDING',
    hasWarning: true
  },
  {
    id: 'IB022260626RS',
    orderNo: 'IB022260626RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 9,
    totalProducts: 410,
    skusSummary: '多个(5)',
    isNewSku: false,
    refNo: '-',
    trackingNo: '-',
    arrivalMethod: '箱',
    eta: '-',
    client: 'YANGZHOU(1108014)',
    inboundType: '常规入库',
    createdAt: '2026-06-29 17:04:46',
    status: 'PENDING',
    hasWarning: false
  },
  {
    id: 'IB026260629RS',
    orderNo: 'IB026260629RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 1370,
    totalProducts: 1370,
    skusSummary: '多个(29)',
    isNewSku: false,
    refNo: 'OWS260629003',
    trackingNo: '-',
    arrivalMethod: '箱',
    eta: '-',
    client: '之道 - 悠悠(1108026)',
    inboundType: '常规入库',
    createdAt: '2026-06-29 16:40:40',
    status: 'PENDING',
    hasWarning: true
  },
  {
    id: 'IB022260617RS',
    orderNo: 'IB022260617RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 8,
    totalProducts: 238,
    skusSummary: '多个(4)',
    isNewSku: false,
    refNo: '-',
    trackingNo: '-',
    arrivalMethod: '箱',
    eta: '-',
    client: 'YANGZHOU(1108014)',
    inboundType: '常规入库',
    createdAt: '2026-06-22 11:38:13',
    status: 'PENDING',
    hasWarning: false
  },
  {
    id: 'IB022260617RT',
    orderNo: 'IB022260617RT',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 7,
    totalProducts: 230,
    skusSummary: '多个(2)',
    isNewSku: false,
    refNo: '-',
    trackingNo: '-',
    arrivalMethod: '箱',
    eta: '-',
    client: 'YANGZHOU(1108014)',
    inboundType: '常规入库',
    createdAt: '2026-06-22 11:38:13',
    status: 'PENDING',
    hasWarning: false
  },
  {
    id: 'IB040260621RS',
    orderNo: 'IB040260621RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 1,
    totalProducts: 1,
    skusSummary: 'X0048Z29FX * 1',
    isNewSku: true,
    refNo: '-',
    trackingNo: 'TBA332011696',
    arrivalMethod: '快递包裹',
    eta: '-',
    client: 'JIDONG(1108034)',
    inboundType: '常规入库',
    createdAt: '2026-06-21 16:31:01',
    status: 'RECEIVING',
    hasWarning: false
  },
  {
    id: 'IB012260618RS',
    orderNo: 'IB012260618RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 5,
    totalProducts: 90,
    skusSummary: '多个(2)',
    isNewSku: false,
    refNo: '-',
    trackingNo: '-',
    arrivalMethod: '箱',
    eta: '-',
    client: '杭州唯典(1108018)',
    inboundType: '备货中转入库',
    createdAt: '2026-06-18 14:56:36',
    status: 'PENDING',
    hasWarning: false
  },
  {
    id: 'IB026260617RS',
    orderNo: 'IB026260617RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 1411,
    totalProducts: 1411,
    skusSummary: '多个(33)',
    isNewSku: true,
    refNo: 'OWS260611001',
    trackingNo: 'TXGU8520310',
    arrivalMethod: '箱',
    eta: '-',
    client: '之道 - 悠悠(1108026)',
    inboundType: '常规入库',
    createdAt: '2026-06-17 11:28:26',
    status: 'PENDING',
    hasWarning: true
  },
  {
    id: 'IB018260612RS',
    orderNo: 'IB018260612RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 4,
    totalProducts: 100,
    skusSummary: 'X004N164TT * 100',
    isNewSku: false,
    refNo: '-',
    trackingNo: '-',
    arrivalMethod: '快递包裹',
    eta: '-',
    client: '天旭01(1108013)',
    inboundType: '常规入库',
    createdAt: '2026-06-12 13:30:15',
    status: 'PENDING',
    hasWarning: false
  },
  {
    id: 'IB009260609RS',
    orderNo: 'IB009260609RS',
    remark: '-',
    receivedBoxes: 0,
    totalBoxes: 30,
    totalProducts: 278,
    skusSummary: '多个(11)',
    isNewSku: true,
    refNo: 'IB014260609RS',
    trackingNo: '990260600046',
    arrivalMethod: '托盘/平板',
    eta: '2026-06-30',
    client: 'ASD(1108009)',
    inboundType: '常规入库',
    createdAt: '2026-06-09 17:10:39',
    status: 'RECEIVING',
    hasWarning: false
  }
];

export default function InboundManager() {
  const [orders, setOrders] = useState<InboundOrder[]>(INITIAL_INBOUND_ORDERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL'); // ALL, PENDING, RECEIVING, RECEIVED, SHELVING, CANCELLED
  const [searchQuery, setSearchQuery] = useState('');
  const [inboundTypeFilter, setInboundTypeFilter] = useState('全部');
  const [clientFilter, setClientFilter] = useState('');
  const [arrivalMethodFilter, setArrivalMethodFilter] = useState('全部');
  
  // Modals
  const [detailOrder, setDetailOrder] = useState<InboundOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Form State
  const [newOrder, setNewOrder] = useState({
    orderNo: '',
    remark: '',
    totalBoxes: 1,
    totalProducts: 10,
    skusSummary: '',
    refNo: '',
    trackingNo: '',
    arrivalMethod: '箱',
    client: '之道 - 悠悠(1108026)',
    inboundType: '常规入库'
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter computation
  const filteredOrders = orders.filter(order => {
    // 1. Status Tab filter
    if (activeTab === 'PENDING' && order.status !== 'PENDING') return false;
    if (activeTab === 'RECEIVING' && order.status !== 'RECEIVING') return false;
    if (activeTab === 'RECEIVED' && order.status !== 'RECEIVED') return false;
    if (activeTab === 'SHELVING' && order.status !== 'SHELVING') return false;
    if (activeTab === 'CANCELLED' && order.status !== 'CANCELLED') return false;

    // 2. Search box (orderNo, trackingNo, refNo)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNo = order.orderNo.toLowerCase().includes(q);
      const matchTrack = order.trackingNo.toLowerCase().includes(q);
      const matchRef = order.refNo.toLowerCase().includes(q);
      if (!matchNo && !matchTrack && !matchRef) return false;
    }

    // 3. Inbound Type filter
    if (inboundTypeFilter !== '全部' && order.inboundType !== inboundTypeFilter) return false;

    // 4. Arriving Method filter
    if (arrivalMethodFilter !== '全部' && order.arrivalMethod !== arrivalMethodFilter) return false;

    // 5. Client filter
    if (clientFilter) {
      if (!order.client.toLowerCase().includes(clientFilter.toLowerCase())) return false;
    }

    return true;
  });

  const tabCounts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    RECEIVING: orders.filter(o => o.status === 'RECEIVING').length,
    RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
    SHELVING: orders.filter(o => o.status === 'SHELVING').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  };

  // Handle checking row
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Perform Receive (收货)
  const handleReceiveOrder = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        showToast(`入库单 ${o.orderNo} 开始清点收货，箱数已同步为 ${o.totalBoxes}/${o.totalBoxes}`, 'success');
        return {
          ...o,
          status: 'RECEIVED',
          receivedBoxes: o.totalBoxes
        };
      }
      return o;
    }));
  };

  // Batch Shelving (批量上架)
  const handleBatchShelving = () => {
    if (selectedIds.length === 0) {
      showToast('请至少勾选一个收货完成的入库单进行上架。', 'error');
      return;
    }
    setOrders(prev => prev.map(o => {
      if (selectedIds.includes(o.id)) {
        return { ...o, status: 'SHELVING' };
      }
      return o;
    }));
    showToast(`批量上架操作成功！已将 ${selectedIds.length} 个入库单分配到对应库位。`, 'success');
    setSelectedIds([]);
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('是否确定删除该入库单？此操作不可逆。')) {
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      showToast('入库单已安全移除', 'info');
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.orderNo) {
      showToast('请输入入库单号', 'error');
      return;
    }

    const created: InboundOrder = {
      id: newOrder.orderNo,
      orderNo: newOrder.orderNo,
      remark: newOrder.remark || '-',
      receivedBoxes: 0,
      totalBoxes: Number(newOrder.totalBoxes) || 1,
      totalProducts: Number(newOrder.totalProducts) || 10,
      skusSummary: newOrder.skusSummary || '常规测试SKU * ' + newOrder.totalProducts,
      isNewSku: false,
      refNo: newOrder.refNo || '-',
      trackingNo: newOrder.trackingNo || '-',
      arrivalMethod: newOrder.arrivalMethod,
      eta: '-',
      client: newOrder.client,
      inboundType: newOrder.inboundType,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'PENDING'
    };

    setOrders(prev => [created, ...prev]);
    setCreateOpen(false);
    showToast(`入库单 ${created.orderNo} 预报成功！`, 'success');
    
    // Reset form
    setNewOrder({
      orderNo: '',
      remark: '',
      totalBoxes: 1,
      totalProducts: 10,
      skusSummary: '',
      refNo: '',
      trackingNo: '',
      arrivalMethod: '箱',
      client: '之道 - 悠悠(1108026)',
      inboundType: '常规入库'
    });
  };

  const generateAutoNo = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setNewOrder(prev => ({
      ...prev,
      orderNo: `IB0${randomNum}RS`
    }));
  };

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none text-[12px] text-slate-700">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4.5 py-2.5 rounded shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <span className="font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header with exact style */}
      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center select-none text-[11px] font-medium text-slate-500">
        <div className="flex gap-4">
          {[
            { key: 'ALL', label: '全部' },
            { key: 'PENDING', label: `待入库 (${tabCounts.PENDING})` },
            { key: 'RECEIVING', label: `收货中 (${tabCounts.RECEIVING})` },
            { key: 'RECEIVED', label: `已收货 (${tabCounts.RECEIVED})` },
            { key: 'SHELVING', label: '已上架' },
            { key: 'CANCELLED', label: '已取消' }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`h-9.5 px-1 hover:text-blue-600 border-b-2 transition-all cursor-pointer relative flex items-center gap-1 ${
                  isActive ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top advanced filters row */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
        
        {/* Filter items */}
        <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
          <span className="text-slate-400">入库类型:</span>
          <select 
            value={inboundTypeFilter} 
            onChange={(e) => setInboundTypeFilter(e.target.value)}
            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="全部">全部</option>
            <option value="常规入库">常规入库</option>
            <option value="备货中转入库">备货中转入库</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
          <span className="text-slate-400">到仓方式:</span>
          <select 
            value={arrivalMethodFilter} 
            onChange={(e) => setArrivalMethodFilter(e.target.value)}
            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="全部">全部</option>
            <option value="货柜 (40HQ)">货柜 (40HQ)</option>
            <option value="箱">箱</option>
            <option value="快递包裹">快递包裹</option>
            <option value="托盘/平板">托盘/平板</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="客户名称/代码"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-7 w-40 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="搜入库单号 / 跟踪号 / 参考单号"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-60 pl-7 pr-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Calendar className="w-3.5 h-3.5" />
          <span>2026-03-30 ➔ 2026-07-01</span>
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            setSearchQuery('');
            setInboundTypeFilter('全部');
            setClientFilter('');
            setArrivalMethodFilter('全部');
            showToast('已重置搜索过滤选项', 'info');
          }}
          className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded text-[11px] font-semibold transition-all cursor-pointer"
        >
          重置
        </button>
      </div>

      {/* 3. Action toolbar */}
      <div className="h-9 bg-[#f9fafb] border-b border-slate-200 px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCreateOpen(true)}
            className="h-6 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>到仓收货预报</span>
          </button>

          <button
            onClick={handleBatchShelving}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <PackageOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>批量上架商品</span>
          </button>

          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                showToast('请选择入库单进行打印。', 'error');
                return;
              }
              alert(`已向条码打印机发送 ${selectedIds.length} 批次的商品标签打印请求！`);
            }}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>打印条码</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => {
              alert('开始导出入库数据为Excel表。');
            }}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>导出表格</span>
          </button>
        </div>

        <div className="text-slate-400 flex items-center gap-2">
          <span>共找到 {filteredOrders.length} 个入库单</span>
          <RefreshCw 
            onClick={() => {
              setOrders(INITIAL_INBOUND_ORDERS);
              showToast('已拉取最新领星入库数据', 'success');
            }}
            className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer animate-spin-hover" 
          />
        </div>
      </div>

      {/* 4. Main Spreadsheet Grid Table */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full text-left border-collapse bg-white select-none table-fixed">
          <thead>
            <tr className="bg-[#f5f7fa] text-slate-500 font-semibold border-b border-slate-200 text-[10.5px] h-8 sticky top-0 z-10">
              <th className="w-8 text-center border-r border-slate-200/60">
                <input 
                  type="checkbox" 
                  checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
              </th>
              <th className="w-36 px-2 border-r border-slate-200/60">入库单号</th>
              <th className="w-24 px-2 border-r border-slate-200/60">备注</th>
              <th className="w-28 px-2 border-r border-slate-200/60">已收箱数/总箱数</th>
              <th className="w-20 px-2 border-r border-slate-200/60 text-right">产品数量</th>
              <th className="w-56 px-2 border-r border-slate-200/60">SKU * 数量</th>
              <th className="w-32 px-2 border-r border-slate-200/60">参考单号</th>
              <th className="w-36 px-2 border-r border-slate-200/60">跟踪号/货柜号</th>
              <th className="w-24 px-2 border-r border-slate-200/60">到仓方式</th>
              <th className="w-24 px-2 border-r border-slate-200/60 text-center">状态</th>
              <th className="w-48 px-2 border-r border-slate-200/60">客户</th>
              <th className="w-28 px-2 border-r border-slate-200/60">入库类型</th>
              <th className="w-36 px-2 border-r border-slate-200/60">创建时间</th>
              <th className="w-24 px-2 text-center sticky right-0 bg-[#f5f7fa] border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-[11px]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={14} className="h-40 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <LayoutGrid className="w-8 h-8 text-slate-300 animate-pulse" />
                    <span>暂无符合过滤条件的入库单</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                return (
                  <tr 
                    key={order.id}
                    className={`hover:bg-slate-50/80 h-9.5 transition-colors ${
                      isSelected ? 'bg-blue-500/[0.03]' : ''
                    }`}
                  >
                    <td className="text-center border-r border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectRow(order.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-blue-600 font-bold truncate">
                      <div className="flex items-center gap-1">
                        {order.hasWarning && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" title="需要重点核对" />
                        )}
                        <button 
                          onClick={() => setDetailOrder(order)} 
                          className="hover:underline text-left cursor-pointer text-[11px] truncate flex-1"
                        >
                          {order.orderNo}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 border-r border-slate-100 truncate text-slate-500" title={order.remark}>{order.remark}</td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-600 font-semibold">
                      <span className={order.receivedBoxes === order.totalBoxes && order.totalBoxes > 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        {order.receivedBoxes}
                      </span>
                      <span> / {order.totalBoxes}</span>
                    </td>
                    <td className="px-2 border-r border-slate-100 text-right font-mono font-medium text-slate-800">{order.totalProducts}</td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-600 truncate" title={order.skusSummary}>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{order.skusSummary}</span>
                        {order.isNewSku && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded scale-90 select-none uppercase">NEW</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 truncate" title={order.refNo}>{order.refNo}</td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 truncate" title={order.trackingNo}>{order.trackingNo}</td>
                    <td className="px-2 border-r border-slate-100 text-slate-600 font-semibold">{order.arrivalMethod}</td>
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'SHELVING' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.status === 'RECEIVED' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        order.status === 'RECEIVING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        order.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        'bg-blue-50 text-blue-700 border border-blue-150'
                      }`}>
                        {
                          order.status === 'SHELVING' ? '已上架' :
                          order.status === 'RECEIVED' ? '已收货' :
                          order.status === 'RECEIVING' ? '收货中' :
                          order.status === 'CANCELLED' ? '已取消' :
                          '待入库'
                        }
                      </span>
                    </td>
                    <td className="px-2 border-r border-slate-100 truncate text-slate-500" title={order.client}>{order.client}</td>
                    <td className="px-2 border-r border-slate-100 font-medium text-slate-600">{order.inboundType}</td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400" title={order.createdAt}>{order.createdAt}</td>
                    
                    {/* Operations Column */}
                    <td className="px-2 text-center sticky right-0 bg-white border-l border-slate-100 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-center gap-1">
                        {order.status === 'PENDING' || order.status === 'RECEIVING' ? (
                          <button
                            onClick={() => handleReceiveOrder(order.id)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition-all cursor-pointer"
                          >
                            收货
                          </button>
                        ) : order.status === 'RECEIVED' ? (
                          <button
                            onClick={() => {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'SHELVING' } : o));
                              showToast(`入库单 ${order.orderNo} 上架分配成功！`, 'success');
                            }}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold transition-all cursor-pointer"
                          >
                            分配上架
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">已归档</span>
                        )}
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-500 hover:text-red-700 font-medium transition-all cursor-pointer"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Overlay Drawer/Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-[550px] bg-white h-full shadow-2xl flex flex-col p-5 animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-800">入库预报详情 - {detailOrder.orderNo}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  detailOrder.status === 'SHELVING' ? 'bg-emerald-100 text-emerald-800' :
                  detailOrder.status === 'RECEIVED' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {detailOrder.status === 'SHELVING' ? '上架完成' : detailOrder.status === 'RECEIVED' ? '收货清点完毕' : '待处理'}
                </span>
              </div>
              <button 
                onClick={() => setDetailOrder(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              
              {/* Box Info */}
              <div className="bg-blue-50/60 rounded-lg p-3 border border-blue-100 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-slate-400 mb-1 scale-95 origin-left">已收箱数/总箱数</div>
                  <div className="font-mono text-base font-extrabold text-slate-700">
                    {detailOrder.receivedBoxes} / {detailOrder.totalBoxes} 箱
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1 scale-95 origin-left">预报产品总数</div>
                  <div className="font-mono text-base font-extrabold text-slate-700">
                    {detailOrder.totalProducts} 件
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1 scale-95 origin-left">入库类型</div>
                  <div className="text-base font-bold text-slate-700">{detailOrder.inboundType}</div>
                </div>
              </div>

              {/* Client & Logistics Details */}
              <div className="border border-slate-150 rounded-lg p-3 space-y-2">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <span>基本预报参数</span>
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">客户名称：</span>
                    <span className="font-medium text-slate-800">{detailOrder.client}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">参考单号：</span>
                    <span className="font-mono text-slate-800">{detailOrder.refNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">跟踪单号：</span>
                    <span className="font-mono text-slate-800">{detailOrder.trackingNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">到仓方式：</span>
                    <span className="font-semibold text-slate-800">{detailOrder.arrivalMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">创建时间：</span>
                    <span className="font-mono text-slate-800">{detailOrder.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">业务备注：</span>
                    <span className="text-slate-800 italic">{detailOrder.remark}</span>
                  </div>
                </div>
              </div>

              {/* SKU Breakdown */}
              <div className="border border-slate-150 rounded-lg p-3">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
                    <span>入库商品条目清单</span>
                  </span>
                  <span className="text-blue-600 font-bold">{detailOrder.skusSummary}</span>
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div>
                      <div className="font-mono text-slate-800 font-bold">{detailOrder.skusSummary.split('*')[0].trim()}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">高精度匹配条码：NiceC-BAR-99214A</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-700">{detailOrder.totalProducts} 件</div>
                      <div className="text-[10px] text-emerald-600 font-bold">正品保证</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="border border-slate-150 rounded-lg p-3">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">流转跟踪节点</h3>
                <div className="mt-3 space-y-3 pl-2.5 relative border-l border-slate-200 ml-1">
                  <div className="relative">
                    <span className="absolute -left-4 w-2 h-2 bg-emerald-500 rounded-full" />
                    <div className="font-bold text-slate-700 scale-95 origin-left">系统预报发布成功</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{detailOrder.createdAt} - neal@nicec.net</div>
                  </div>
                  {detailOrder.status !== 'PENDING' && (
                    <div className="relative">
                      <span className="absolute -left-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <div className="font-bold text-slate-700 scale-95 origin-left">到仓清点收货中 (更新箱数为 {detailOrder.totalBoxes})</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">2026-06-30 16:11:00 - WMS_SCANNER</div>
                    </div>
                  )}
                  {detailOrder.status === 'SHELVING' && (
                    <div className="relative">
                      <span className="absolute -left-4 w-2 h-2 bg-indigo-500 rounded-full" />
                      <div className="font-bold text-slate-700 scale-95 origin-left">已分配完成上架 (货架：ZONE-A-04-03)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">2026-06-30 17:30:20 - WMS_AUTO_ZONE</div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setDetailOrder(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
              >
                关闭窗口
              </button>
              {detailOrder.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleReceiveOrder(detailOrder.id);
                    setDetailOrder(null);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold cursor-pointer"
                >
                  确认收货
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Create Inbound Order Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <form 
            onSubmit={handleCreateOrder}
            className="w-[500px] bg-white rounded-xl shadow-2xl p-6 border border-slate-200 text-xs text-slate-700 space-y-4 animate-in zoom-in-95 duration-150"
          >
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="text-sm font-extrabold text-slate-800">建立入库预报单 (Inbound Forecast)</span>
              <button 
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Order Number Row */}
              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 font-semibold flex justify-between items-center">
                  <span>入库预报单号 <span className="text-red-500">*</span></span>
                  <button 
                    type="button" 
                    onClick={generateAutoNo}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    自动分配单号
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="例如: IB010260630RS"
                  required
                  value={newOrder.orderNo}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, orderNo: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Inbound Type */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">入库业务类型</label>
                <select
                  value={newOrder.inboundType}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, inboundType: e.target.value }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="常规入库">常规入库</option>
                  <option value="备货中转入库">备货中转入库</option>
                </select>
              </div>

              {/* Client select */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">客户主体</label>
                <select
                  value={newOrder.client}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="之道 - 悠悠(1108026)">之道 - 悠悠(1108026)</option>
                  <option value="泉州之道 - Rocket-一件代发 (1108028)">泉州之道 - Rocket (1108028)</option>
                  <option value="YANGZHOU(1108014)">YANGZHOU (1108014)</option>
                  <option value="天旭01(1108013)">天旭01 (1108013)</option>
                </select>
              </div>

              {/* Total boxes */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">预报到货总箱数</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newOrder.totalBoxes}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, totalBoxes: Number(e.target.value) }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Total products */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">预报产品总件数</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newOrder.totalProducts}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, totalProducts: Number(e.target.value) }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* SKU summaries */}
              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 font-semibold">SKU 组合描述</label>
                <input
                  type="text"
                  placeholder="例如: FA-zuoyitao006-BlackFS * 100 或者 多个(12)"
                  required
                  value={newOrder.skusSummary}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, skusSummary: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Reference number */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">参考业务单号</label>
                <input
                  type="text"
                  placeholder="OWS 开头参考号 (选填)"
                  value={newOrder.refNo}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, refNo: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Tracking number */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">物理跟踪号</label>
                <input
                  type="text"
                  placeholder="快递运单或海运集装箱号 (选填)"
                  value={newOrder.trackingNo}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, trackingNo: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Arriving method */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">到仓配送方式</label>
                <select
                  value={newOrder.arrivalMethod}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, arrivalMethod: e.target.value }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="箱">普通纸箱 (SP)</option>
                  <option value="货柜 (40HQ)">整箱海运货柜 (FCL-40HQ)</option>
                  <option value="快递包裹">快递包裹 (LTL)</option>
                  <option value="托盘/平板">卡车打托托盘 (Pallet)</option>
                </select>
              </div>

              {/* Remark */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">业务备注说明</label>
                <input
                  type="text"
                  placeholder="采购订单备注 (选填)"
                  value={newOrder.remark}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, remark: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="border-t border-slate-200 pt-3.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10"
              >
                提交预报
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
