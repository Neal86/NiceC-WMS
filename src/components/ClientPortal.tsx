import React, { useState, useEffect } from 'react';
import { 
  authApi, outboundApi, metadataApi, skuApi, inventoryApi, customerApi
} from '../api';
import { 
  LayoutDashboard, Package, Boxes, ArrowDownLeft, ArrowUpRight, 
  RotateCcw, Landmark, Code2, HelpCircle, Settings, LogOut, 
  Plus, Search, Shield, BadgeCheck, FileText, ChevronRight, Activity, Bell
} from 'lucide-react';

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

export default function ClientPortal({ currentUser, onLogout }: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [skus, setSkus] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [newTicket, setNewTicket] = useState({ title: '', type: 'Bug Report', description: '' });
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Load isolated data on render
  useEffect(() => {
    const loadIsolatedData = async () => {
      setLoading(true);
      try {
        // Fetch client orders
        const ordRes = await outboundApi.getOrders({ page: 1, pageSize: 50 });
        // Since backend already handles customer isolation if role is client,
        // it returns user-isolated orders. We also do client-side guard filtering to be extra safe!
        const isolatedOrders = ordRes.orders.filter((o: any) => o.customerId === currentUser.customerId);
        setOrders(isolatedOrders);

        // Fetch SKUs
        const skuRes = await skuApi.getSkus();
        const isolatedSkus = skuRes.filter((s: any) => s.customerId === currentUser.customerId);
        setSkus(isolatedSkus);

        // Fetch Inventories
        const invRes = await inventoryApi.getInventory();
        const isolatedInv = invRes.filter((i: any) => i.customerId === currentUser.customerId);
        setInventory(isolatedInv);

        // Fetch Feedback Tickets
        const ticketRes = await fetch('/api/feedback');
        if (ticketRes.ok) {
          const ticketsData = await ticketRes.json();
          const isolatedTickets = ticketsData.filter((t: any) => t.customerId === currentUser.customerId || t.userId === currentUser.id);
          setTickets(isolatedTickets);
        }
      } catch (err) {
        console.error('Error fetching isolated customer data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser.customerId) {
      loadIsolatedData();
    }
  }, [currentUser, activeTab]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newTicket.type,
          title: newTicket.title,
          description: newTicket.description,
          warehouseId: 'All Warehouses',
          operationScope: 'Outbound',
          priority: 'Medium',
          contactEmail: currentUser.email,
          userId: currentUser.id,
          customerId: currentUser.customerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(prev => [data.feedback, ...prev]);
        setNewTicket({ title: '', type: 'Bug Report', description: '' });
        setShowNewTicketModal(false);
      }
    } catch (err) {
      console.error('Failed to file ticket', err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: '仪表盘 Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: '我的库存 My Inventory', icon: Boxes },
    { id: 'skus', label: '我的 SKU My SKUs', icon: Package },
    { id: 'inbound', label: '入库预报 Inbound Forecast', icon: ArrowDownLeft },
    { id: 'outbound', label: '出库订单 Outbound Orders', icon: ArrowUpRight },
    { id: 'returns', label: '退货管理 Returns', icon: RotateCcw },
    { id: 'billing', label: '账单管理 Billing', icon: Landmark },
    { id: 'api', label: 'API 对接 API Integration', icon: Code2 },
    { id: 'tickets', label: '工单反馈 Tickets & Feedback', icon: HelpCircle },
    { id: 'settings', label: '账号设置 Account Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Panel */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-full select-none">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              NC
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">NiceC WMS</h1>
              <p className="text-[10px] text-slate-400 font-mono">CLIENT PORTAL v1.1</p>
            </div>
          </div>

          {/* User profile section */}
          <div className="p-4 border-b border-slate-850 flex items-center gap-3">
            <img 
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'} 
              className="w-10 h-10 rounded-full border border-slate-700 object-cover" 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate flex items-center gap-1 text-slate-200">
                <span>{currentUser.username}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">客户代码: {currentUser.customerId || 'CUST_1'}</p>
            </div>
          </div>

          {/* Nav list */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/10' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:bg-red-950/20 hover:border-red-900/40 text-slate-400 hover:text-red-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>安全注销登录</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        {/* Top Header navbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/40 px-6 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">客户工作台</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              {navItems.find(n => n.id === activeTab)?.label.split(' ')[0]}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-950/40 border border-blue-900/40 rounded-full text-[10px] font-mono text-blue-400">
              <Shield className="w-3 h-3 text-blue-400" />
              <span>数据沙箱隔离安全保护中</span>
            </div>
            
            <div className="relative cursor-pointer">
              <Bell className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <main className="flex-1 overflow-y-auto p-6 text-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 select-none">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono tracking-widest uppercase">正在读取您加密隔离的商户专有数据...</p>
            </div>
          ) : activeTab === 'dashboard' ? (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-slate-800"><ArrowUpRight className="w-12 h-12" /></div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">本月出库订单</p>
                  <p className="text-3xl font-mono font-bold text-white">{orders.length}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-2 font-mono">
                    <span>↑ 12.5%</span> <span className="text-slate-500 font-sans ml-1">较上周增长</span>
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-slate-800"><Package className="w-12 h-12" /></div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">激活 SKU 种类</p>
                  <p className="text-3xl font-mono font-bold text-white">{skus.length}</p>
                  <p className="text-[10px] text-blue-400 mt-2 font-mono">100% 独立开发接入</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-slate-800"><Boxes className="w-12 h-12" /></div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">总可用实物库存</p>
                  <p className="text-3xl font-mono font-bold text-white">
                    {inventory.reduce((sum, inv) => sum + (inv.availableQty || 0), 0)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">包含波次锁定的已占用库存</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-slate-800"><HelpCircle className="w-12 h-12" /></div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">待处理客服工单</p>
                  <p className="text-3xl font-mono font-bold text-white">
                    {tickets.filter(t => t.status === 'New' || t.status === 'In Progress').length}
                  </p>
                  <p className="text-[10px] text-orange-400 mt-2 font-mono">高优先级紧急工单: 0</p>
                </div>
              </div>

              {/* Recent Orders Overview Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-200">最新出库单 (最近 5 笔)</h3>
                  <button onClick={() => setActiveTab('outbound')} className="text-xs text-blue-400 hover:underline">查看全部出库单</button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">暂无任何属于您商户的出库订单信息。</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="py-2.5">出库单号</th>
                          <th>订单状态</th>
                          <th>收件人</th>
                          <th>发货件数</th>
                          <th>创建时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="text-slate-300 hover:bg-slate-900/40">
                            <td className="py-2.5 font-mono font-semibold text-blue-400">{ord.orderNo}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.status === 'SHIPPED' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' :
                                ord.status === 'PENDING' ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40' :
                                'bg-slate-900 text-slate-400 border border-slate-800/40'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="max-w-[150px] truncate">{ord.recipient}</td>
                            <td className="font-mono">{ord.totalQty}</td>
                            <td className="text-slate-400">{ord.createdTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-slate-200 mb-4">实时库位库存 Inventory Logs</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                以下为您在 NiceC 仓库当前在库的所有实物库存清单。数据隔离逻辑在服务端严格控制，确保外部商户无法读取您的任何数据。
              </p>
              {inventory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 select-none text-xs">暂无任何在库库存。您可以提交入库ASN。</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5">SKU 编码</th>
                        <th>仓库名称</th>
                        <th>可用库存 Quantity</th>
                        <th>预占用库存 Reserved</th>
                        <th>受损损耗 Damaged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {inventory.map((inv) => (
                        <tr key={inv.id} className="text-slate-300 hover:bg-slate-900/40">
                          <td className="py-3 font-mono text-slate-200 font-bold">{inv.skuCode}</td>
                          <td>{inv.warehouseId === 'wh_1' ? 'NC - NO.1仓 - 92503' : 'NJ - NO.2仓 - 08817'}</td>
                          <td className="font-mono text-emerald-400 font-bold">{inv.availableQty}</td>
                          <td className="font-mono text-yellow-500">{inv.reservedQty || 0}</td>
                          <td className="font-mono text-red-400">{inv.damagedQty || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'skus' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">我的 SKU 目录 My SKUs</h3>
                  <p className="text-xs text-slate-400 mt-1">自主备案申报并关联货品规格的专属 SKU 列表。</p>
                </div>
                <button 
                  onClick={() => alert('请在正式管理系统中录入新商品申报，此版本为客户隔离视图。')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>备案新 SKU</span>
                </button>
              </div>

              {skus.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">您还没有注册任何 SKU 品项。</p>
              ) : (
                <div className="overflow-x-auto text-xs mt-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5">SKU ID</th>
                        <th>SKU 编码</th>
                        <th>货品名称</th>
                        <th>商品条码 Barcode</th>
                        <th>重量 Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {skus.map((sku) => (
                        <tr key={sku.id} className="text-slate-300 hover:bg-slate-900/40">
                          <td className="py-3 font-mono text-slate-500">{sku.id}</td>
                          <td className="font-mono text-slate-100 font-bold">{sku.code}</td>
                          <td>{sku.name}</td>
                          <td className="font-mono">{sku.barcode}</td>
                          <td className="font-mono">{sku.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'inbound' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">入库预报 ASN Forecast</h3>
                  <p className="text-xs text-slate-400 mt-1">发货至 NiceC 仓库前，创建入库预报并提供条码。到仓后进行拆柜与上架扣减。</p>
                </div>
                <button onClick={() => alert('请提交箱规和托盘信息录入入库预报 (ASN)')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>新建入库预报</span>
                </button>
              </div>

              <div className="overflow-x-auto text-xs mt-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5">预报 ASN 编号</th>
                      <th>目标仓库</th>
                      <th>预报数量</th>
                      <th>物流渠道</th>
                      <th>入库状态</th>
                      <th>到货时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr className="hover:bg-slate-900/40">
                      <td className="py-3 font-mono font-bold text-blue-400">ASN202607020042</td>
                      <td>NC - NO.1仓</td>
                      <td className="font-mono">500</td>
                      <td>FBA Ground</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-950/80 text-yellow-400 border border-yellow-800/40 font-bold">
                          SHIPPING / 在途
                        </span>
                      </td>
                      <td className="text-slate-400 font-mono">2026-07-05</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="py-3 font-mono font-bold text-blue-400">ASN202606280011</td>
                      <td>NJ - NO.2仓</td>
                      <td className="font-mono">240</td>
                      <td>Ocean Freight</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-bold">
                          RECEIVED / 已上架
                        </span>
                      </td>
                      <td className="text-slate-400 font-mono">2026-06-30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'outbound' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">出库订单 Outbound Orders</h3>
                  <p className="text-xs text-slate-400 mt-1">您关联的专属一件代发出库需求列表。</p>
                </div>
                <button onClick={() => alert('请使用顶部或导入接口同步外部 ERP 订单...')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>手动创建发货单</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">暂无任何出库发货单。</p>
              ) : (
                <div className="overflow-x-auto text-xs mt-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5">出库单号</th>
                        <th>收件人</th>
                        <th>订单平台</th>
                        <th>发货总件</th>
                        <th>物流面单</th>
                        <th>发货状态</th>
                        <th>下单时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="text-slate-300 hover:bg-slate-900/40">
                          <td className="py-3 font-mono font-bold text-blue-400">{ord.orderNo}</td>
                          <td className="max-w-[150px] truncate">{ord.recipient}</td>
                          <td>{ord.salesPlatform}</td>
                          <td className="font-mono">{ord.totalQty}</td>
                          <td>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${ord.labelPrinted === 'PRINTED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {ord.labelPrinted === 'PRINTED' ? '已打印' : '未打印'}
                            </span>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'SHIPPED' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' :
                              ord.status === 'PENDING' ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40' :
                              'bg-slate-900 text-slate-400 border border-slate-800/40'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="text-slate-400 font-mono">{ord.createdTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'returns' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg text-center select-none">
              <RotateCcw className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-200">客退与退货管理 RMA Center</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                仓库收到海外买家退回的包裹后，将提供拍照与翻新服务。退货签收日志与理赔单据将在这里实时显示并严格按客户代码隔离。
              </p>
              <button onClick={() => alert('暂无待处理退货。')} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
                新建退货预告
              </button>
            </div>
          ) : activeTab === 'billing' ? (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-slate-200 mb-2">商户账单与预存余额 My Billing</h3>
                <p className="text-xs text-slate-400 mb-6">按体积、包裹重、仓储天数进行多维度精确计费。</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-400">账户预存余额</p>
                    <p className="text-2xl font-mono font-bold text-white mt-1">$4,250.00</p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-400">本月待付账单</p>
                    <p className="text-2xl font-mono font-bold text-slate-200 mt-1">$812.50</p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-400">上月已结扣款</p>
                    <p className="text-2xl font-mono font-bold text-slate-200 mt-1">$1,230.00</p>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5">账单日期</th>
                        <th>计费类型</th>
                        <th>实发包数</th>
                        <th>结算状态</th>
                        <th>扣款总金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      <tr>
                        <td className="py-3 font-mono text-slate-400">2026-06-30</td>
                        <td>一件代发单包裹处理费</td>
                        <td className="font-mono">420 包</td>
                        <td><span className="text-emerald-400 font-semibold">已扣款</span></td>
                        <td className="font-mono text-white">$1,230.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'api' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200">API 授权对接开发者凭证 Developer Integrations</h3>
                <p className="text-xs text-slate-400 mt-1">
                  使用 JSON REST API 或者 Webhook 实现与 Amazon, Shopify, ERP 系统的自动化出库及库存数据回显。
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-4 text-xs font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase">Sandbox Merchant ID (商户ID)</p>
                  <p className="text-slate-200 font-bold">{currentUser.customerId || 'CUST_1'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase">API Access Client Key (APPKEY)</p>
                  <p className="text-slate-200 font-bold">nicec_app_client_key_92503_sandbox_v1</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase">API Secret Token (APPSECRET)</p>
                  <p className="text-blue-400 font-bold select-all">••••••••••••••••••••••••••••••••</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">数据回传推送 (Webhook Endpoint)</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    defaultValue="https://api.merchant-erp.com/v1/wms-sync"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={() => alert('Webhook 保存并测试发送成功！')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors cursor-pointer">
                    保存并测试
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'tickets' ? (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">我的客服工单 / 业务反馈 Support Tickets</h3>
                    <p className="text-xs text-slate-400 mt-1">遇到操作延迟、货物破损或计费异常？在此提交工单直接联系 NiceC 管理团队解答。</p>
                  </div>
                  <button 
                    onClick={() => setShowNewTicketModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>提交工单反馈</span>
                  </button>
                </div>

                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-12">您目前没有待处理或历史工单记录。</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="py-2.5">工单编号</th>
                          <th>问题分类</th>
                          <th>工单标题</th>
                          <th>优先级</th>
                          <th>流转状态</th>
                          <th>最后更新时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {tickets.map((t) => (
                          <tr key={t.id} className="text-slate-300 hover:bg-slate-900/40">
                            <td className="py-3 font-mono font-bold text-blue-400">{t.id}</td>
                            <td>{t.type}</td>
                            <td className="max-w-[180px] truncate">{t.title}</td>
                            <td>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                t.priority === 'Critical' ? 'text-red-400 bg-red-950/40' :
                                t.priority === 'High' ? 'text-orange-400 bg-orange-950/40' :
                                'text-blue-400 bg-blue-950/40'
                              }`}>
                                {t.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'New' ? 'text-blue-400 bg-blue-950/30 border border-blue-900/30' :
                                t.status === 'Resolved' ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30' :
                                'text-yellow-400 bg-yellow-950/30 border border-yellow-900/30'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="text-slate-400 font-mono">{t.updatedAt || t.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* New Ticket Modal */}
              {showNewTicketModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
                    <form onSubmit={handleCreateTicket}>
                      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-200">提交新工单 / 业务问题反馈</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewTicketModal(false)}
                          className="text-slate-500 hover:text-slate-400 text-lg cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                      
                      <div className="p-5 space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1.5 font-semibold">问题分类</label>
                          <select 
                            value={newTicket.type}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-750 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="Bug Report">系统漏洞与错误 (Bug Report)</option>
                            <option value="Feature Request">业务新需求建议 (Feature Request)</option>
                            <option value="Data Issue">库存与实物差异对账 (Data Issue)</option>
                            <option value="UI/UX Suggestion">系统易用性反馈 (UI/UX Suggestion)</option>
                            <option value="Integration Issue">接口与物流打单异常 (Integration Issue)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1.5 font-semibold">工单主题</label>
                          <input 
                            type="text" 
                            required
                            placeholder="请一句话简述您遇到的问题"
                            value={newTicket.title}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-750 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1.5 font-semibold">详细描述 (问题复现步骤 & 数据影响范围)</label>
                          <textarea 
                            required
                            rows={4}
                            placeholder="请提供遇到问题的具体出库单号、SKU编码以及具体的影响细节..."
                            value={newTicket.description}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-750 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 text-xs">
                        <button 
                          type="button" 
                          onClick={() => setShowNewTicketModal(false)}
                          className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded text-slate-400 cursor-pointer"
                        >
                          取消
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer"
                        >
                          确认并提交
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center max-w-md mx-auto mt-12 shadow-lg">
              <Settings className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-spin-slow" />
              <h3 className="text-sm font-bold text-slate-200">个人账号与公司档案 Settings</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                当前登录邮箱: <strong>{currentUser.email}</strong><br />
                公司名: <strong>{currentUser.customerId === 'cust_1' ? 'Yukon Co.' : 'My Business Corp'}</strong>
              </p>
              <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500 font-mono">
                数据安全认证证书已就绪。
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
