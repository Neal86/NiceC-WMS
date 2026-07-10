import { ReactNode } from 'react';
import { Download, Upload, Plus, RefreshCw, Search, RotateCcw, Calendar, ChevronDown } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  tabs?: { label: string; key: string }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      {children}
    </div>
  );
}

export function ActionButton({ icon, label, onClick, variant = 'primary' }: { icon?: ReactNode; label: string; onClick?: () => void; variant?: 'primary' | 'default' | 'danger' }) {
  const base = 'h-7 px-3 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer';
  const colors = variant === 'primary' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm' :
    variant === 'danger' ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' :
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300';
  return <button onClick={onClick} className={`${base} ${colors}`}>{icon}{label}</button>;
}

export function SearchInput({ value, onChange, placeholder = '搜索...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-48 h-7 pl-7 pr-2 border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400" />
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-32 h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700">
        <option value="">{placeholder || '全部'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export function DateRangeFilter({ start, end, onStartChange, onEndChange }: { start: string; end: string; onStartChange: (v: string) => void; onEndChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded h-7 px-1.5 text-slate-600">
      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <input type="date" value={start} onChange={e => onStartChange(e.target.value)}
        className="bg-transparent border-none text-[10px] w-24 p-0 text-slate-600 focus:outline-none font-mono" />
      <span className="text-slate-300">~</span>
      <input type="date" value={end} onChange={e => onEndChange(e.target.value)}
        className="bg-transparent border-none text-[10px] w-24 p-0 text-slate-600 focus:outline-none font-mono" />
    </div>
  );
}

export function StatusTabs({ tabs, activeTab, onChange }: { tabs: { label: string; key: string }[]; activeTab?: string; onChange: (key: string) => void }) {
  return (
    <div className="flex items-center border-b border-slate-200 mb-3 bg-white rounded-t-md">
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === tab.key ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function PageLayout({ title, children, tabs, activeTab, onTabChange, actions }: PageLayoutProps) {
  return (
    <div className="bg-white rounded-md border border-slate-200">
      <PageHeader title={title} actions={actions} />
      {tabs && onTabChange && <StatusTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />}
      <div className="p-0">{children}</div>
    </div>
  );
}
