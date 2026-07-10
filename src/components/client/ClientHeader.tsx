import { useState, useEffect, useRef } from 'react';
import { Bell, HelpCircle, Download, User, ChevronDown, LogOut } from 'lucide-react';

interface ClientHeaderProps {
  currentUser: any;
  onLogout: () => void;
}

export default function ClientHeader({ currentUser, onLogout }: ClientHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-11 bg-[#062B66] text-white flex items-center justify-between px-3 select-none font-sans z-30 flex-shrink-0 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-wide text-slate-200">NiceC WMS - 客人端</span>
      </div>

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

        <div className="relative" ref={dropdownRef}>
          <div onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-white/10 rounded cursor-pointer transition-all">
            <div className="w-5.5 h-5.5 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-medium text-slate-200">
              {currentUser?.username || currentUser?.email || 'User'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white text-slate-800 rounded-lg shadow-xl py-1.5 border border-slate-200 z-50">
              <div className="px-3.5 py-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 pb-1.5 mb-1">
                CLIENT 权限
              </div>
              <button onClick={() => { setDropdownOpen(false); onLogout(); }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs text-red-600 flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                <span>注销登录</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/10 border border-white/15 px-3 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 text-white select-none shadow-sm">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>NC - NO.1仓</span>
        </div>
      </div>
    </header>
  );
}
