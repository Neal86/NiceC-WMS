import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Warehouse, RotateCcw, ArrowLeftRight,
  Undo2, Box, PackageSearch, BarChart3, CreditCard, Settings, ChevronDown,
  LogOut, HelpCircle, ClipboardList, ShieldAlert, Wrench, ScanLine,
  Archive, Boxes, ClipboardCheck, AlertTriangle, User, BookOpen,
  History, Ruler, FileText, Store, SlidersHorizontal, Puzzle,
  Users, MapPin, LogIn, ShoppingCart
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
  onClick?: () => void;
}

const menuItems: SidebarItem[] = [
  { label: '首页', path: '/client', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: '平台订单', path: '/client/orders', icon: <ShoppingCart className="w-4 h-4" /> },
  {
    label: '仓储服务', icon: <Warehouse className="w-4 h-4" />,
    children: [
      { label: '入库', path: '/client/inbound', icon: <Package className="w-3.5 h-3.5" /> },
      { label: '一件代发出库', path: '/client/outbound/dropship', icon: <Truck className="w-3.5 h-3.5" /> },
      { label: '备货中转出库', path: '/client/outbound/transfer', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
      { label: '入库认领', path: '/client/inbound-claim', icon: <ClipboardList className="w-3.5 h-3.5" /> },
      { label: '次品处理', path: '/client/defective-processing', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { label: '工单', path: '/client/work-orders', icon: <Wrench className="w-3.5 h-3.5" /> },
    ],
  },
  { label: '退件', path: '/client/returns', icon: <Undo2 className="w-4 h-4" /> },
  { label: '转运', path: '/client/transshipment', icon: <RotateCcw className="w-4 h-4" /> },
  {
    label: 'FBA退货', icon: <Undo2 className="w-4 h-4" />,
    children: [
      { label: '退货入库', path: '/client/fba-returns/inbound', icon: <Package className="w-3.5 h-3.5" /> },
      { label: '退货换标', path: '/client/fba-returns/relabel', icon: <ScanLine className="w-3.5 h-3.5" /> },
      { label: '退货出库', path: '/client/fba-returns/outbound', icon: <Truck className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: '库存', icon: <Box className="w-4 h-4" />,
    children: [
      { label: '产品库存', path: '/client/inventory/products', icon: <PackageSearch className="w-3.5 h-3.5" /> },
      { label: '箱库存', path: '/client/inventory/cartons', icon: <Boxes className="w-3.5 h-3.5" /> },
      { label: '退货库存', path: '/client/inventory/returns', icon: <Undo2 className="w-3.5 h-3.5" /> },
      { label: '综合库存', path: '/client/inventory/combined', icon: <Archive className="w-3.5 h-3.5" /> },
      { label: '产品库龄', path: '/client/inventory/product-aging', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
      { label: '箱库龄', path: '/client/inventory/carton-aging', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
      { label: '退货库龄', path: '/client/inventory/return-aging', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: '产品管理', icon: <PackageSearch className="w-4 h-4" />,
    children: [
      { label: '产品', path: '/client/products', icon: <Package className="w-3.5 h-3.5" /> },
    ],
  },
  { label: '统计分析', path: '/client/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  {
    label: '账户&账单', icon: <CreditCard className="w-4 h-4" />,
    children: [
      { label: '我的账户', path: '/client/account', icon: <User className="w-3.5 h-3.5" /> },
      { label: '业务流水', path: '/client/account/transactions', icon: <FileText className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: '系统设置', icon: <Settings className="w-4 h-4" />,
    children: [
      { label: '平台授权', path: '/client/settings/platform-auth', icon: <Store className="w-3.5 h-3.5" /> },
      { label: '平台订单规则', path: '/client/settings/order-rules', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
      { label: '产品配对', path: '/client/settings/product-mapping', icon: <Puzzle className="w-3.5 h-3.5" /> },
      { label: '账号管理', path: '/client/settings/accounts', icon: <Users className="w-3.5 h-3.5" /> },
      { label: '角色管理', path: '/client/settings/roles', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { label: '地址簿', path: '/client/settings/address-book', icon: <MapPin className="w-3.5 h-3.5" /> },
      { label: '登录日志', path: '/client/settings/login-logs', icon: <LogIn className="w-3.5 h-3.5" /> },
      { label: '计量单位', path: '/client/settings/units', icon: <Ruler className="w-3.5 h-3.5" /> },
    ],
  },
];

interface ClientSidebarProps {
  onLogout: () => void;
}

export default function ClientSidebar({ onLogout }: ClientSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem('client_expanded_menus');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    sessionStorage.setItem('client_expanded_menus', JSON.stringify([...expandedMenus]));
  }, [expandedMenus]);

  const toggleExpand = (label: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const isActive = (path?: string) => location.pathname === path;
  const isParentActive = (item: SidebarItem) =>
    item.children?.some(child => child.path && location.pathname.startsWith(child.path)) ||
    (item.path && isActive(item.path));

  const renderItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const parentActive = isParentActive(item);
    const expanded = expandedMenus.has(item.label);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <div
            onClick={() => toggleExpand(item.label)}
            className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
              parentActive ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
          {expanded && item.children?.map(child => renderItem(child, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={item.path || item.label}
        onClick={() => item.path && navigate(item.path)}
        className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
          active ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600' : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {item.icon}
        <span>{item.label}</span>
      </div>
    );
  };

  return (
    <aside className="w-[200px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="h-11 flex items-center justify-center border-b border-slate-200 bg-white">
        <span className="text-sm font-bold text-[#062B66] tracking-wide">NiceC WMS</span>
      </div>
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-1">
        {menuItems.map(item => renderItem(item))}
      </nav>
      <div className="border-t border-slate-200 p-2">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded cursor-pointer">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>帮助中心</span>
        </div>
        <div onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded cursor-pointer">
          <LogOut className="w-3.5 h-3.5" />
          <span>退出登录</span>
        </div>
      </div>
    </aside>
  );
}
