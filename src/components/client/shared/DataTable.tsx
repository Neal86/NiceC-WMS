import React from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, ChevronDown, Eye, Edit, Trash2, Download } from 'lucide-react';

export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  minWidth?: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  selectedIds?: string[];
  onSelectAll?: (checked: boolean) => void;
  onSelectRow?: (id: string, checked: boolean) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  onExport?: () => void;
  onAction?: (action: string, item: T) => void;
  getId: (item: T) => string;
  emptyMessage?: string;
  actions?: { label: string; action: string; icon?: React.ReactNode }[];
  stickyRight?: boolean;
  rowClassName?: (item: T) => string;
  extraActions?: React.ReactNode;
}

export default function DataTable<T>({
  columns, data, total, page, pageSize, onPageChange, onPageSizeChange,
  selectedIds = [], onSelectAll, onSelectRow, onEdit, onDelete, onView,
  onExport, onAction, getId, emptyMessage = '暂无数据', actions, stickyRight = true,
  rowClassName, extraActions,
}: DataTableProps<T>) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = data.length > 0 && data.every(d => selectedIds.includes(getId(d)));

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none">
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-[11px] text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#f5f7fa] text-slate-600 font-semibold sticky top-0 border-b border-slate-200 shadow-sm z-10 h-8">
            <tr>
              {(onSelectAll || onSelectRow) && (
                <th className="w-9 text-center px-2">
                  <input type="checkbox" checked={allSelected} onChange={e => onSelectAll?.(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer" />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} className="px-3 py-1.5 whitespace-nowrap" style={{ width: col.width, minWidth: col.minWidth }}>
                  {col.title}
                  {col.sortable && <span className="ml-1 text-slate-300">⇅</span>}
                </th>
              ))}
              {(actions || onEdit || onDelete || onView || onAction || extraActions) && (
                <th className={`px-3 py-1.5 w-[95px] text-center ${stickyRight ? 'sticky right-0 bg-[#f5f7fa] border-l border-slate-200' : ''}`}>操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-1.5 justify-center">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(item => {
                const id = getId(item);
                const isSelected = selectedIds.includes(id);
                return (
                  <tr key={id} className={`hover:bg-slate-50/70 transition-colors cursor-pointer h-7.5 ${isSelected ? 'bg-blue-50/30' : ''} ${rowClassName?.(item) || ''}`}
                    onClick={() => onView?.(item)}>
                    {(onSelectAll || onSelectRow) && (
                      <td className="text-center px-2" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={e => onSelectRow?.(id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer" />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className="px-3 py-1.5 truncate max-w-[200px]" style={{ minWidth: col.minWidth }}>
                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
                      </td>
                    ))}
                    {(actions || onEdit || onDelete || onView || onAction || extraActions) && (
                      <td className={`px-3 text-center ${stickyRight ? 'sticky right-0 bg-white border-l border-slate-100 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]' : ''}`}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {onEdit && (
                            <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">编辑</button>
                          )}
                          {(onEdit || onView) && <span className="text-slate-300">|</span>}
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === id ? null : id); }}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold">
                              <span>操作</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {openMenuId === id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                                <ul className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded shadow-lg py-1 z-30 text-[10px] text-slate-700 text-left">
                                  {onView && (
                                    <li><button onClick={() => { onView(item); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5">
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />查看详情</button></li>
                                  )}
                                  {onEdit && (
                                    <li><button onClick={() => { onEdit(item); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5">
                                      <Edit className="w-3.5 h-3.5 text-slate-400" />编辑</button></li>
                                  )}
                                  {actions?.map(a => (
                                    <li key={a.action}><button onClick={() => { onAction?.(a.action, item); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5">
                                      {a.icon || <Download className="w-3.5 h-3.5 text-slate-400" />}{a.label}</button></li>
                                  ))}
                                  {onDelete && (
                                    <>
                                      <li className="border-t border-slate-100 my-1" />
                                      <li><button onClick={() => { if (confirm('确认删除？')) onDelete(id); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5 font-semibold">
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />删除</button></li>
                                    </>
                                  )}
                                </ul>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="h-8 bg-slate-50 border-t border-slate-200 px-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
          <span className="text-slate-500">总计</span>
          <span className="font-bold text-slate-800 font-mono text-xs">{total}</span>
          {extraActions && <div className="ml-4">{extraActions}</div>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>共 {total} 条</span>
          <div className="flex items-center gap-1">
            <button onClick={() => page > 1 && onPageChange(page - 1)} disabled={page === 1}
              className="p-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="font-mono text-slate-700">第 <strong className="font-bold">{page}</strong> / {totalPages} 页</span>
            <button onClick={() => page < totalPages && onPageChange(page + 1)} disabled={page === totalPages}
              className="p-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
