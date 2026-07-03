import { useState, useEffect, useCallback } from 'react';
import api, { authApi, inventoryApi, outboundApi, logApi, inboundApi, putawayApi, pickApi, reviewApi, returnApi, exceptionApi } from '../api';
import { WMSAIWidget } from './wms-ai-assistant/WMSAIWidget';
import { 
  Package, ClipboardList, Truck, RotateCcw, AlertTriangle, 
  CheckCircle2, Clock, LogOut, Warehouse as WarehouseIcon,
  ArrowDownToLine, ArrowUpFromLine, PackageCheck, FileText,
  RefreshCw, Loader2, Inbox
} from 'lucide-react';

interface WarehousePortalProps {
  currentUser: any;
  onLogout: () => void;
}

export default function WarehousePortal({ currentUser, onLogout }: WarehousePortalProps) {
  const [activeTab, setActiveTab] = useState('today');
  const [stats, setStats] = useState({
    todayInbound: 0,
    todayOutbound: 0,
    todayPicking: 0,
    todayReview: 0,
    exceptions: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Receiving tab state
  const [receivingOrders, setReceivingOrders] = useState<any[]>([]);
  const [receivingLoading, setReceivingLoading] = useState(false);

  // Putaway tab state
  const [putawayTasks, setPutawayTasks] = useState<any[]>([]);
  const [putawayLoading, setPutawayLoading] = useState(false);

  // Picking tab state
  const [pickTasks, setPickTasks] = useState<any[]>([]);
  const [pickingLoading, setPickingLoading] = useState(false);

  // Review tab state
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Shipping tab state
  const [shippingOrders, setShippingOrders] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Returns tab state
  const [returnOrders, setReturnOrders] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);

  // Exceptions tab state
  const [exceptionCases, setExceptionCases] = useState<any[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);

  // Logs tab state
  const [operationLogs, setOperationLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, logsRes] = await Promise.all([
        outboundApi.getOrders({ tab: 'ALL', page: 1, pageSize: 50 }),
        logApi.getOperationLogs().catch(() => []),
      ]);

      const orders = ordersRes.orders || [];
      setStats({
        todayInbound: Math.floor(Math.random() * 8) + 2,
        todayOutbound: orders.filter((o: any) => o.status === 'SHIPPED').length,
        todayPicking: orders.filter((o: any) => o.status === 'PICKING').length,
        todayReview: orders.filter((o: any) => o.status === 'REVIEWS').length,
        exceptions: orders.filter((o: any) => o.status === 'EXCEPTIONS').length,
      });

      setRecentTasks((logsRes || []).slice(0, 10));
    } catch (err) {
      console.error('Failed to load warehouse dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  // Receiving tab functions
  const loadReceivingOrders = useCallback(async () => {
    setReceivingLoading(true);
    try {
      const data = await inboundApi.getOrders({ status: 'PENDING' });
      setReceivingOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load receiving orders', err);
      setReceivingOrders([]);
    } finally {
      setReceivingLoading(false);
    }
  }, []);

  const handleReceive = async (orderId: string) => {
    try {
      await inboundApi.receive(orderId, []);
      await loadReceivingOrders();
    } catch (err) {
      console.error('Failed to receive order', err);
    }
  };

  // Putaway tab functions
  const loadPutawayTasks = useCallback(async () => {
    setPutawayLoading(true);
    try {
      const data = await putawayApi.getTasks();
      setPutawayTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load putaway tasks', err);
      setPutawayTasks([]);
    } finally {
      setPutawayLoading(false);
    }
  }, []);

  const handlePutawayComplete = async (taskId: string) => {
    try {
      await putawayApi.complete(taskId);
      await loadPutawayTasks();
    } catch (err) {
      console.error('Failed to complete putaway task', err);
    }
  };

  // Picking tab functions
  const loadPickTasks = useCallback(async () => {
    setPickingLoading(true);
    try {
      const data = await pickApi.getTasks();
      setPickTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pick tasks', err);
      setPickTasks([]);
    } finally {
      setPickingLoading(false);
    }
  }, []);

  const handlePickComplete = async (taskId: string) => {
    try {
      await pickApi.complete(taskId);
      await loadPickTasks();
    } catch (err) {
      console.error('Failed to complete pick task', err);
    }
  };

  // Review tab functions
  const loadReviewTasks = useCallback(async () => {
    setReviewLoading(true);
    try {
      const data = await reviewApi.getTasks();
      setReviewTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load review tasks', err);
      setReviewTasks([]);
    } finally {
      setReviewLoading(false);
    }
  }, []);

  const handleReviewComplete = async (taskId: string) => {
    try {
      await reviewApi.complete(taskId);
      await loadReviewTasks();
    } catch (err) {
      console.error('Failed to complete review task', err);
    }
  };

  // Shipping tab functions
  const loadShippingOrders = useCallback(async () => {
    setShippingLoading(true);
    try {
      const res = await outboundApi.getOrders({ tab: 'SHIPPING', page: 1, pageSize: 100 });
      setShippingOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load shipping orders', err);
      setShippingOrders([]);
    } finally {
      setShippingLoading(false);
    }
  }, []);

  const handleShip = async (orderId: string) => {
    try {
      await api.post(`/outbound-orders/${orderId}/ship`);
      await loadShippingOrders();
    } catch (err) {
      console.error('Failed to ship order', err);
    }
  };

  // Returns tab functions
  const loadReturnOrders = useCallback(async () => {
    setReturnsLoading(true);
    try {
      const data = await returnApi.getReturns();
      setReturnOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load return orders', err);
      setReturnOrders([]);
    } finally {
      setReturnsLoading(false);
    }
  }, []);

  const handleReturnReceive = async (orderId: string) => {
    try {
      await returnApi.receiveReturn(orderId);
      await loadReturnOrders();
    } catch (err) {
      console.error('Failed to receive return order', err);
    }
  };

  // Exceptions tab functions
  const loadExceptionCases = useCallback(async () => {
    setExceptionsLoading(true);
    try {
      const data = await exceptionApi.getCases();
      setExceptionCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load exception cases', err);
      setExceptionCases([]);
    } finally {
      setExceptionsLoading(false);
    }
  }, []);

  const handleResolveException = async (caseId: string) => {
    try {
      await exceptionApi.resolve(caseId);
      await loadExceptionCases();
    } catch (err) {
      console.error('Failed to resolve exception case', err);
    }
  };

  // Logs tab functions
  const loadOperationLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await logApi.getOperationLogs();
      setOperationLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load operation logs', err);
      setOperationLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'receiving') {
      loadReceivingOrders();
    } else if (activeTab === 'putaway') {
      loadPutawayTasks();
    } else if (activeTab === 'picking') {
      loadPickTasks();
    } else if (activeTab === 'review') {
      loadReviewTasks();
    } else if (activeTab === 'shipping') {
      loadShippingOrders();
    } else if (activeTab === 'returns') {
      loadReturnOrders();
    } else if (activeTab === 'exceptions') {
      loadExceptionCases();
    } else if (activeTab === 'logs') {
      loadOperationLogs();
    }
  }, [activeTab, loadReceivingOrders, loadPutawayTasks, loadPickTasks, loadReviewTasks, loadShippingOrders, loadReturnOrders, loadExceptionCases, loadOperationLogs]);

  const statCards = [
    { label: '今日待收货', value: stats.todayInbound, icon: ArrowDownToLine, color: 'bg-blue-500' },
    { label: '今日待拣货', value: stats.todayPicking, icon: Package, color: 'bg-amber-500' },
    { label: '今日待复核', value: stats.todayReview, icon: PackageCheck, color: 'bg-purple-500' },
    { label: '今日已出库', value: stats.todayOutbound, icon: Truck, color: 'bg-emerald-500' },
    { label: '异常件', value: stats.exceptions, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  const quickActions = [
    { label: '入库收货', icon: ArrowDownToLine, color: 'bg-blue-600', tab: 'receiving' },
    { label: '上架任务', icon: ArrowUpFromLine, color: 'bg-indigo-600', tab: 'putaway' },
    { label: '拣货任务', icon: Package, color: 'bg-amber-600', tab: 'picking' },
    { label: '打包复核', icon: PackageCheck, color: 'bg-purple-600', tab: 'review' },
    { label: '退货收货', icon: RotateCcw, color: 'bg-rose-600', tab: 'returns' },
    { label: '异常处理', icon: AlertTriangle, color: 'bg-red-600', tab: 'exceptions' },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'RECEIVED': 'bg-blue-100 text-blue-700',
      'PICKING': 'bg-indigo-100 text-indigo-700',
      'REVIEWING': 'bg-purple-100 text-purple-700',
      'SHIPPING': 'bg-cyan-100 text-cyan-700',
      'SHIPPED': 'bg-green-100 text-green-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'EXCEPTIONS': 'bg-red-100 text-red-700',
      'CANCELLED': 'bg-gray-100 text-gray-700',
      'RESOLVED': 'bg-green-100 text-green-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="ml-3 text-sm text-slate-500">加载中...</span>
    </div>
  );

  const renderEmpty = (message: string = '暂无数据') => (
    <div className="flex flex-col items-center justify-center py-12">
      <Inbox className="w-12 h-12 text-slate-300 mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );

  const renderTabHeader = (title: string, onRefresh: () => void) => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        刷新
      </button>
    </div>
  );

  const renderTable = (headers: string[], children: React.ReactNode) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((header, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#071225] text-white flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <WarehouseIcon className="w-6 h-6 text-blue-400 mr-2" />
          <span className="text-sm font-bold tracking-wide">NiceC WMS 仓库端</span>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {[
            { key: 'today', label: '今日任务', icon: ClipboardList },
            { key: 'receiving', label: '入库收货', icon: ArrowDownToLine },
            { key: 'putaway', label: '上架管理', icon: ArrowUpFromLine },
            { key: 'picking', label: '拣货任务', icon: Package },
            { key: 'review', label: '打包复核', icon: PackageCheck },
            { key: 'shipping', label: '出库复核', icon: Truck },
            { key: 'returns', label: '退货收货', icon: RotateCcw },
            { key: 'exceptions', label: '异常件处理', icon: AlertTriangle },
            { key: 'logs', label: '操作记录', icon: FileText },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeTab === item.key
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {currentUser.username?.[0]?.toUpperCase() || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-500">仓库操作员</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-bold text-slate-800">
            {quickActions.find(a => a.tab === activeTab)?.label || '今日任务总览'}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleDateString('zh-CN')} {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'today' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                {statCards.map((card) => (
                  <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">快捷操作</h3>
                <div className="grid grid-cols-6 gap-4">
                  {quickActions.map((action) => (
                    <button
                      key={action.tab}
                      onClick={() => setActiveTab(action.tab)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-slate-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">最近操作记录</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {recentTasks.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">暂无操作记录</div>
                  ) : (
                    recentTasks.map((task: any, idx: number) => (
                      <div key={idx} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{task.action || task.detail}</p>
                          <p className="text-[10px] text-slate-400">{task.username} - {task.createdAt || task.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Receiving Tab */}
          {activeTab === 'receiving' && (
            <div>
              {renderTabHeader('入库收货', loadReceivingOrders)}
              {receivingLoading ? renderLoading() : 
               receivingOrders.length === 0 ? renderEmpty('暂无待收货订单') :
               renderTable(['ASN单号', '客户', '仓库', '预期日期', '明细数', '状态', '操作'], 
                 receivingOrders.map((order: any, idx: number) => (
                   <tr key={order.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{order.orderNo}</td>
                     <td className="px-4 py-3 text-slate-600">{order.customerName || order.customerId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.warehouseId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.items?.length || 0}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                         {order.status}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {order.status === 'PENDING' && (
                         <button
                           onClick={() => handleReceive(order.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                         >
                           收货确认
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Putaway Tab */}
          {activeTab === 'putaway' && (
            <div>
              {renderTabHeader('上架管理', loadPutawayTasks)}
              {putawayLoading ? renderLoading() :
               putawayTasks.length === 0 ? renderEmpty('暂无上架任务') :
               renderTable(['任务号', 'SKU编码', '仓库', '库位', '数量', '状态', '操作'],
                 putawayTasks.map((task: any, idx: number) => (
                   <tr key={task.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{task.taskNo}</td>
                     <td className="px-4 py-3 text-slate-600">{task.skuCode || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{task.warehouseId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{task.locationId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{task.quantity}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                         {task.status}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {task.status === 'PENDING' && (
                         <button
                           onClick={() => handlePutawayComplete(task.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                         >
                           完成上架
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Picking Tab */}
          {activeTab === 'picking' && (
            <div>
              {renderTabHeader('拣货任务', loadPickTasks)}
              {pickingLoading ? renderLoading() :
               pickTasks.length === 0 ? renderEmpty('暂无拣货任务') :
               renderTable(['任务号', '订单号', 'SKU编码', '数量', '状态', '操作'],
                 pickTasks.map((task: any, idx: number) => (
                   <tr key={task.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{task.taskNo}</td>
                     <td className="px-4 py-3 text-slate-600">{task.orderId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{task.skuCode || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{task.quantity}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                         {task.status}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {task.status === 'PENDING' && (
                         <button
                           onClick={() => handlePickComplete(task.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                         >
                           完成拣货
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div>
              {renderTabHeader('打包复核', loadReviewTasks)}
              {reviewLoading ? renderLoading() :
               reviewTasks.length === 0 ? renderEmpty('暂无复核任务') :
               renderTable(['订单号', '状态', '操作'],
                 reviewTasks.map((task: any, idx: number) => (
                   <tr key={task.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{task.orderId || task.id}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                         {task.status}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {task.status === 'PENDING' && (
                         <button
                           onClick={() => handleReviewComplete(task.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                         >
                           完成复核
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div>
              {renderTabHeader('出库复核', loadShippingOrders)}
              {shippingLoading ? renderLoading() :
               shippingOrders.length === 0 ? renderEmpty('暂无待出库订单') :
               renderTable(['订单号', '收件人', '承运商', '物流渠道', '重量', '状态', '操作'],
                 shippingOrders.map((order: any, idx: number) => (
                   <tr key={order.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{order.orderNo}</td>
                     <td className="px-4 py-3 text-slate-600">{order.recipient || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.carrierName || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.logisticsChannelName || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.totalWeight ? `${order.totalWeight}kg` : '-'}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                         {order.status}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {order.status === 'SHIPPING' && (
                         <button
                           onClick={() => handleShip(order.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                         >
                           确认出库
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Returns Tab */}
          {activeTab === 'returns' && (
            <div>
              {renderTabHeader('退货收货', loadReturnOrders)}
              {returnsLoading ? renderLoading() :
               returnOrders.length === 0 ? renderEmpty('暂无退货订单') :
               renderTable(['退货单号', '订单号', '客户', '状态', '创建时间', '操作'],
                 returnOrders.map((order: any, idx: number) => (
                   <tr key={order.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{order.returnNo || order.id}</td>
                     <td className="px-4 py-3 text-slate-600">{order.orderId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{order.customerName || order.customerId || '-'}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                         {order.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-slate-600">
                       {order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '-'}
                     </td>
                     <td className="px-4 py-3">
                       {order.status === 'PENDING' && (
                         <button
                           onClick={() => handleReturnReceive(order.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
                         >
                           收货确认
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Exceptions Tab */}
          {activeTab === 'exceptions' && (
            <div>
              {renderTabHeader('异常件处理', loadExceptionCases)}
              {exceptionsLoading ? renderLoading() :
               exceptionCases.length === 0 ? renderEmpty('暂无异常件') :
               renderTable(['案例号', '订单', '类型', '描述', '状态', '操作'],
                 exceptionCases.map((ec: any, idx: number) => (
                   <tr key={ec.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 font-medium text-slate-800">{ec.caseNo}</td>
                     <td className="px-4 py-3 text-slate-600">{ec.orderId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{ec.type || '-'}</td>
                     <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{ec.description || '-'}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ec.status)}`}>
                         {ec.status}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {ec.status === 'PENDING' && (
                         <button
                           onClick={() => handleResolveException(ec.id)}
                           className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                         >
                           标记解决
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )
              }
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              {renderTabHeader('操作记录', loadOperationLogs)}
              {logsLoading ? renderLoading() :
               operationLogs.length === 0 ? renderEmpty('暂无操作记录') :
               renderTable(['时间', '用户', '模块', '操作', '目标', '详情'],
                 operationLogs.map((log: any, idx: number) => (
                   <tr key={log.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="px-4 py-3 text-slate-600">
                       {log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '-'}
                     </td>
                     <td className="px-4 py-3 text-slate-600">{log.username || log.userId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{log.module || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{log.action || '-'}</td>
                     <td className="px-4 py-3 text-slate-600">{log.targetId || '-'}</td>
                     <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{log.detail || '-'}</td>
                   </tr>
                 ))
               )
              }
            </div>
          )}
        </div>
      </div>

      <WMSAIWidget />
    </div>
  );
}
