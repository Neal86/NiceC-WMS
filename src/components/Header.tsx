import { useState, useEffect, useRef } from 'react';
import { 
  Bell, HelpCircle, Download, User, ChevronDown, 
  LogOut, Menu, Shield, Crown
} from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLogout: () => void;
  activeMenu: string;
  onAdminPanelClick: () => void;
}

export default function Header({ currentUser, onLogout, activeMenu, onAdminPanelClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = String(currentUser?.role || '').toUpperCase();
  const showAdminPanel = role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_ADMIN' || currentUser?.permissions?.includes('view_admin_panel');

  return (
    <header id="top-header" className="h-11 bg-[#062B66] text-white flex items-center justify-between px-3 select-none font-sans z-30 flex-shrink-0 shadow-md">
      {/* Left side: Navigation / Opened Tabs */}
      <div className="flex items-center gap-2">
        <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-200">
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center text-xs h-11">
          <div className="px-3.5 h-full flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer hover:bg-black/10 transition-colors text-[11px]">
            <span>首页</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <div className="px-3.5 h-full flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer hover:bg-black/10 transition-colors text-[11px]">
            <span>一件代发出库详情</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <div className="px-4.5 h-full flex items-center gap-1.5 bg-white text-[#062B66] font-semibold border-b-2 border-blue-500 rounded-t-sm text-[11px] relative">
            <span>一件代发</span>
          </div>
        </div>
      </div>

      {/* Right side: Options and User Profile */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-3 text-slate-300">
          <button title="下载中心" className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
          </button>
          <button title="消息通知" className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors relative cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#062B66]"></span>
          </button>
          <button title="帮助与支持" className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-white/15"></div>

        {/* User Account Dropdown - click to open */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-white/10 rounded cursor-pointer transition-all"
          >
            <div className="w-5.5 h-5.5 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-200">
              {currentUser?.username || currentUser?.email || 'User'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white text-slate-800 rounded-lg shadow-xl py-1.5 border border-slate-200 z-50">
              <div className="px-3.5 py-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono border-b border-slate-100 pb-1.5 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>{role || 'USER'} 权限</span>
              </div>
              
              {showAdminPanel && (
                <button
                  onClick={() => { setDropdownOpen(false); onAdminPanelClick(); }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs text-slate-700 flex items-center gap-2 border-b border-slate-100 mb-1"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>管理员后台</span>
                </button>
              )}

              <button
                onClick={() => { setDropdownOpen(false); onLogout(); }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs text-red-600 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>注销登录</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/10 border border-white/15 px-3 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 text-white select-none shadow-sm cursor-pointer hover:bg-white/15 transition-all">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>NC - NO.1仓 - 92503</span>
          <ChevronDown className="w-3 h-3 text-slate-300" />
        </div>
      </div>
    </header>
  );
}
