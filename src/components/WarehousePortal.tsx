import React, { useState } from 'react';
import { HelpCircle, Search } from 'lucide-react';

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
  createdAt: string;
  urgent: boolean;
}

const mockOrders: WorkOrder[] = [
  { id: '1', orderNo: 'WO260706-00A', title: 'B0B1Q5W7BL / X00399WPLH @许典', priority: '普通', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '翻新+全家福', createdAt: '2026-07-06 15:53:29', urgent: true },
  { id: '2', orderNo: 'WO260706-009', title: 'B0BTCXMBVC / X003OUJ019 @郭雅', priority: '普通', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '翻新+全家福', createdAt: '2026-07-06 15:50:25', urgent: false },
  { id: '3', orderNo: 'WO260706-008', title: 'B0B9S1PV7X / X003CRSBAF @郭雅', priority: '普通', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '翻新+全家福', createdAt: '2026-07-06 15:48:56', urgent: true },
  { id: '4', orderNo: 'WO260705-007', title: 'B0CFG3L2V1 / X00412KLMN @李明', priority: '紧急', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '翻新', createdAt: '2026-07-05 14:30:12', urgent: true },
  { id: '5', orderNo: 'WO260705-006', title: 'B0D8F2N9R5 / X00387PQRS @王芳', priority: '普通', customer: 'GlobalEcom(1108552)', type: '全家福', createdAt: '2026-07-05 11:22:45', urgent: false },
  { id: '6', orderNo: 'WO260704-005', title: 'B0E1G4M6T8 / X00355TUVW @赵强', priority: '普通', customer: 'Zonestar(1108099)', type: '翻新+全家福', createdAt: '2026-07-04 09:15:33', urgent: false },
  { id: '7', orderNo: 'WO260704-004', title: 'B0F2H5K7L9 / X00399WPLH @陈静', priority: '紧急', customer: 'Tochtech(1108045)', type: '翻新', createdAt: '2026-07-04 08:05:20', urgent: true },
  { id: '8', orderNo: 'WO260703-003', title: 'B0G3J6L8M2 / X00400ABCD @刘伟', priority: '普通', customer: 'Apex(1108210)', type: '全家福', createdAt: '2026-07-03 16:42:18', urgent: false },
  { id: '9', orderNo: 'WO260702-002', title: 'B0H4K7M9N1 / X00288EFGH @孙莉', priority: '普通', customer: 'Yukon(1108037)', type: '翻新+全家福', createdAt: '2026-07-02 10:30:05', urgent: false },
  { id: '10', orderNo: 'WO260701-001', title: 'B0I5L8N2P3 / X00311IJKL @周涛', priority: '紧急', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '翻新', createdAt: '2026-07-01 13:55:42', urgent: false },
  { id: '11', orderNo: 'WO260630-00C', title: 'B0J6M9P3Q4 / X00344MNOP @吴霞', priority: '普通', customer: 'GlobalEcom(1108552)', type: '全家福', createdAt: '2026-06-30 11:20:33', urgent: false },
  { id: '12', orderNo: 'WO260630-00B', title: 'B0K7N1Q4R5 / X00366QRST @郑斌', priority: '普通', customer: 'Zonestar(1108099)', type: '翻新+全家福', createdAt: '2026-06-30 09:10:15', urgent: false },
  { id: '13', orderNo: 'WO260629-00A', title: 'B0L8P2R5S6 / X00377UVWX @马云', priority: '普通', customer: 'Tochtech(1108045)', type: '翻新', createdAt: '2026-06-29 17:45:08', urgent: false },
  { id: '14', orderNo: 'WO260629-00B', title: 'B0M9Q3S6T7 / X00388YZAB @林雪', priority: '紧急', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '翻新+全家福', createdAt: '2026-06-29 08:22:55', urgent: true },
  { id: '15', orderNo: 'WO260629-00C', title: 'B0N1R4T7U8 / X00399WPLH @黄海', priority: '普通', customer: '锐一旧货(RUIYI-USED)(1108016)', type: '全家福', createdAt: '2026-06-29 06:11:30', urgent: false },
];

const sidebarMenu = [
  { label: '首页', children: false },
  { label: '入库', children: true, subs: ['到仓扫描', '入库管理', '上架管理', '新品维护', '入库认领'] },
  { label: '出库', children: false },
  { label: '退件', children: false },
  { label: '转运', children: false },
  { label: '工单', children: false },
  { label: '报表', children: false },
  { label: 'FBA退货', children: false },
  { label: '库内', children: false },
  { label: '基础数据', children: false },
];

const statusTabs = ['全部', '待审核 (47)', '已审核 (2)', '处理完成', '已作废'];

export default function WarehousePortal({ currentUser, onLogout }: WarehousePortalProps) {
  const [activeSidebar, setActiveSidebar] = useState('工单');
  const [expandedMenu, setExpandedMenu] = useState<string>('入库');
  const [activeStatusTab, setActiveStatusTab] = useState('待审核 (47)');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;
  const totalItems = 47;

  const toggleExpand = (label: string) => {
    setExpandedMenu(prev => prev === label ? '' : label);
  };

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
        <div className="flex items-center h-full ml-6 gap-1">
          <div className="text-white/80 px-5 h-12 flex items-center text-xs">首页</div>
          <div className="text-white/80 px-5 h-12 flex items-center text-xs">一件代发出库详情</div>
          <div className="bg-white text-slate-900 rounded-t-md px-8 h-12 flex items-center text-xs font-medium">工单</div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs px-4">
          <HelpCircle className="w-4 h-4 text-white/70" />
          <span className="text-white/70">neal@nicec.net</span>
          <span className="text-white/70">NC - NO.1仓 - 92503</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[136px] bg-[#071226] shrink-0 overflow-y-auto">
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
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between ${
                      isActive ? 'bg-blue-600 text-white rounded mx-1 px-3' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.children && (
                      <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
                  onClick={() => setActiveStatusTab(tab)}
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
              <option>客户名称/代码</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>工单类型</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>紧急程度</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>回复状态</option>
            </select>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>附件</option>
            </select>
            <div className="relative">
              <input placeholder="工单标题" className="h-8 text-xs border border-slate-200 rounded pl-2 pr-7 bg-white text-slate-600 w-[140px]" />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
            <select className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600">
              <option>创建时间</option>
            </select>
            <span className="text-xs text-slate-500 whitespace-nowrap">2026-04-08 → 2026-07-09</span>
            <button className="h-8 px-3 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50">重置</button>
          </div>

          {/* Action bar */}
          <div className="h-[52px] bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <button className="h-8 px-4 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">工单类型管理</button>
              <button className="h-8 px-3 text-xs bg-white border border-slate-200 rounded text-slate-600">导出 v</button>
            </div>
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
                  <th className="w-[120px] px-3 py-3 text-left font-medium text-slate-500">工单号</th>
                  <th className="w-[360px] px-3 py-3 text-left font-medium text-slate-500">工单标题</th>
                  <th className="w-[120px] px-3 py-3 text-left font-medium text-slate-500">紧急程度</th>
                  <th className="w-[280px] px-3 py-3 text-left font-medium text-slate-500">客户</th>
                  <th className="w-[200px] px-3 py-3 text-left font-medium text-slate-500">工单类型</th>
                  <th className="w-[180px] px-3 py-3 text-left font-medium text-slate-500">创建时间</th>
                  <th className="w-[120px] px-3 py-3 text-left font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {mockOrders.map((order) => (
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
                      <span className={`${order.priority === '紧急' ? 'text-red-500' : 'text-slate-500'}`}>{order.priority}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{order.customer}</td>
                    <td className="px-3 py-3 text-slate-600">{order.type}</td>
                    <td className="px-3 py-3 text-slate-500">{order.createdAt}</td>
                    <td className="px-3 py-3"><span className="text-blue-600 cursor-pointer hover:underline">审核</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="h-12 border-t border-slate-200 flex items-center justify-end px-4 gap-3 text-xs text-slate-500 shrink-0 bg-white">
            <span>共{totalItems}条</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded hover:bg-slate-100">&lt;</button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2 py-1 rounded ${p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
              <button className="px-2 py-1 rounded hover:bg-slate-100">&gt;</button>
            </div>
            <span>20条/页</span>
            <div className="flex items-center gap-1">
              <span>前往</span>
              <input className="w-8 h-6 border border-slate-200 rounded text-center text-xs" defaultValue={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
