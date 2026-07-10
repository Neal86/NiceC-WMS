import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Download, Upload, Plus, Search, RotateCcw, RefreshCw } from 'lucide-react';
import DataTable, { Column } from './DataTable';
import FormModal from './FormModal';
import StatusBadge from './StatusBadge';
import { StatusTabs, ActionButton, SearchInput, DateRangeFilter } from './PageLayout';

interface GenericListPageProps<T extends { id: string }> {
  title: string;
  service: {
    list: (params?: any) => Promise<{ data: T[]; total: number; page: number; pageSize: number }>;
    create?: (item: any) => Promise<T>;
    update?: (id: string, updates: Partial<T>) => Promise<T | null>;
    delete?: (id: string) => Promise<boolean>;
  };
  columns: Column<T>[];
  statusTabs?: { label: string; key: string }[];
  typeOptions?: { label: string; value: string }[];
  searchPlaceholder?: string;
  renderForm?: (item: T | null, onChange: (updates: any) => void) => React.ReactNode;
  getId?: (item: T) => string;
  emptyMessage?: string;
  pageSize?: number;
  hideActions?: boolean;
  extraActions?: React.ReactNode;
}

export default function GenericListPage<T extends { id: string }>({
  title, service, columns, statusTabs, typeOptions,
  searchPlaceholder, renderForm, getId = (item: T) => item.id,
  emptyMessage = '暂无数据', pageSize = 20, hideActions = false,
  extraActions,
}: GenericListPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [detailItem, setDetailItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await service.list({
        page, pageSize,
        status: status || undefined,
        type: type || undefined,
        search: search || undefined,
      });
      setData(result.data as T[]);
      setTotal(result.total);
    } finally { setLoading(false); }
  }, [page, pageSize, status, type, search, service]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (item: T) => {
    setEditItem(item);
    setFormData({ ...item });
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormData({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!service.create || !service.update) return;
    try {
      if (editItem) {
        await service.update(editItem.id, formData);
      } else {
        await service.create(formData);
      }
      setFormOpen(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!service.delete) return;
    try { await service.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleView = (item: T) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleExport = () => {
    const header = columns.map(c => c.title).join(',');
    const rows = data.map(r => columns.map(c => String((r as any)[c.key] ?? '')).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2">
          {extraActions}
          <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" onClick={handleExport} variant="default" />
          {!hideActions && service.create && (
            <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建" onClick={handleCreate} />
          )}
        </div>
      </div>

      {statusTabs && (
        <StatusTabs tabs={statusTabs} activeTab={status} onChange={v => { setStatus(v); setPage(1); }} />
      )}

      <div className="bg-white p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {statusTabs && (
            <></>
          )}
          {typeOptions && (
            <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
              className="w-28 h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700">
              <option value="">全部类型</option>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={searchPlaceholder || `搜索${title}...`} />
          <DateRangeFilter start={dateStart} end={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} />
          <ActionButton icon={<Search className="w-3.5 h-3.5" />} label="查询" onClick={() => load()} />
          <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="重置" onClick={() => { setStatus(''); setType(''); setSearch(''); setDateStart(''); setDateEnd(''); setPage(1); }} variant="default" />
          <ActionButton icon={<RefreshCw className="w-3.5 h-3.5" />} label="刷新" onClick={() => load()} variant="default" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        selectedIds={selectedIds}
        onSelectAll={checked => setSelectedIds(checked ? data.map(getId) : [])}
        onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
        onEdit={service.update ? handleEdit : undefined}
        onDelete={service.delete ? handleDelete : undefined}
        onView={handleView}
        getId={getId}
        emptyMessage={emptyMessage || `暂无${title}数据`}
      />

      {renderForm && service.create && (
        <FormModal open={formOpen} title={editItem ? `编辑${title}` : `新建${title}`} onClose={() => setFormOpen(false)} onSubmit={handleSave}>
          {renderForm(editItem, setFormData)}
        </FormModal>
      )}

      <FormModal open={detailOpen} title={`${title}详情`} onClose={() => setDetailOpen(false)} width="600px">
        {detailItem && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {columns.map(col => (
              <div key={col.key}>
                <span className="text-slate-400">{col.title}: </span>
                <span className="text-slate-700 font-medium">{(detailItem as any)[col.key] ?? '-'}</span>
              </div>
            ))}
          </div>
        )}
      </FormModal>
    </div>
  );
}
