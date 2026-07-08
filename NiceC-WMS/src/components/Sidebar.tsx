import { useState } from 'react';
import NiceCLogo from './NiceCLogo';
import { 
  Home, LogIn, LogOut, RefreshCw, Clipboard, BarChart2, 
  CornerDownLeft, Truck, Layers, Settings, ChevronDown, ChevronRight, Box
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onMenuSelect: (menu: string) => void;
}

export default function Sidebar({ activeMenu, onMenuSelect }: SidebarProps) {
  // Outbound (出库) is expanded by default to reflect the screenshot context
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    inbound: false,
    outbound: true,
    returns: false,
    transit: false,
    workOrder: false,
    reports: false,
    fba: false,
    inventory: false,
    basicData: false,
  });

  const toggleExpand = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const menuItems = [
    { key: 'home', label: '首页', icon: Home, expandable: false },
    { 
      key: 'inbound', 
      label: '入库', 
      icon: LogIn, 
      expandable: true,
      children: ['到仓扫描', '入库管理', '上架管理', '新品维护', '入库认领'] 
    },
    { 
      key: 'outbound', 
      label: '出库', 
      icon: LogOut, 
      expandable: true,
      children: ['一件代发', '大货出库', '波次管理', '面单管理'] 
    },
    { 
      key: 'returns', 
      label: '退件', 
      icon: CornerDownLeft, 
      expandable: true,
      children: ['退件认领', '退件质检', '退件入库']
    },
    { key: 'transit', label: '转运', icon: Truck, expandable: false },
    { key: 'workOrder', label: '工单', icon: Clipboard, expandable: false },
    { key: 'reports', label: '报表', icon: BarChart2, expandable: false },
    { key: 'feedback', label: '反馈管理', icon: Clipboard, expandable: false },
    { key: 'fba', label: 'FBA退货', icon: RefreshCw, expandable: false },
    { key: 'inventory', label: '库内', icon: Layers, expandable: true, children: ['产品库存', '箱库存', '退货库存', '次品处理', '盘点'] },
    { key: 'basicData', label: '基础数据', icon: Settings, expandable: true, children: ['产品', '库区', '库位', '包材', '播种墙'] }
  ];

  return (
    <aside id="sidebar-panel" className="w-[190px] min-h-screen bg-[#071225] text-slate-300 flex flex-col flex-shrink-0 z-20 select-none border-r border-slate-900 font-sans text-xs">
      {/* Brand logo at top */}
      <div className="h-11 bg-[#061e3d] flex items-center px-3.5 gap-2 border-b border-slate-900/40">
        <NiceCLogo size={22} />
        <span className="font-bold text-white tracking-wider text-sm">NiceC WMS</span>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {menuItems.map((item) => {
          const isExpanded = expandedMenus[item.key];
          
          return (
            <div key={item.key} className="mb-0.5">
              {/* Parent Item */}
              <button
                onClick={() => {
                  if (item.expandable) {
                    toggleExpand(item.key);
                  } else {
                    onMenuSelect(item.label);
                  }
                }}
                className={`w-full py-2.5 px-4 flex items-center justify-between text-left hover:bg-[#0c203b] hover:text-white transition-colors duration-150 ${
                  activeMenu === item.label && !item.expandable ? 'bg-blue-600/90 text-white font-medium' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-[12px]">{item.label}</span>
                </div>
                {item.expandable && (
                  isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Collapsible Children */}
              {item.expandable && isExpanded && item.children && (
                <div className="bg-[#040b17] py-1 pl-9 pr-2 space-y-0.5 border-l-2 border-blue-600/30">
                  {item.children.map((child) => {
                    const isActive = activeMenu === child;
                    return (
                      <button
                        key={child}
                        onClick={() => onMenuSelect(child)}
                        className={`w-full py-1.5 px-2 text-left rounded hover:text-white hover:bg-[#0c203b] transition-colors ${
                          isActive ? 'text-blue-400 font-medium bg-blue-900/20' : 'text-slate-400'
                        }`}
                      >
                        {child}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 bg-[#040b17] border-t border-slate-900/50 flex flex-col gap-1.5 text-[10px] text-slate-500 text-center font-mono">
        <div>SERVER_ONLINE : 3000</div>
        <div>UTC 2026-06-29</div>
      </div>
    </aside>
  );
}
