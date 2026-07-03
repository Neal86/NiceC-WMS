import { useState, useEffect } from 'react';
import { authApi, inventoryApi, outboundApi, logApi } from '../api';
import { WMSAIWidget } from './wms-ai-assistant/WMSAIWidget';
import { 
  Package, ClipboardList, Truck, RotateCcw, AlertTriangle, 
  CheckCircle2, Clock, BarChart3, LogOut, Warehouse as WarehouseIcon,
  Scan, ArrowDownToLine, ArrowUpFromLine, PackageCheck, FileText
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
          {activeTab === 'today' ? (
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
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">
                {quickActions.find(a => a.tab === activeTab)?.label || activeTab}
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                此功能模块正在开发中。仓库操作员可通过此页面完成日常仓内操作。
              </p>
              <button
                onClick={() => setActiveTab('today')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                返回今日任务
              </button>
            </div>
          )}
        </div>
      </div>

      <WMSAIWidget />
    </div>
  );
}
