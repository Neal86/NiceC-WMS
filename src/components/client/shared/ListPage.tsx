import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Upload, RefreshCw, Search, RotateCcw } from 'lucide-react';
import DataTable, { Column } from './DataTable';
import FormModal from './FormModal';
import StatusBadge from './StatusBadge';
import { SearchInput, SelectFilter, DateRangeFilter, ActionButton } from './PageLayout';

interface ListPageProps<T extends { id: string }> {
  title: string;
  service: {
    list: (params?: any) => Promise<{ data: T[]; total: number; page: number; pageSize: number }>;
    create?: (item: any) => Promise<T>;
    update?: (id: string, updates: Partial<T>) => Promise<T | null>;
    delete?: (id: string) => Promise<boolean>;
  };
  columns: Column<T>[];
  statusOptions?: { label: string; value: string }[];
  typeOptions?: { label: string; value: string }[];
  defaultStatus?: string;
  defaultType?: string;
  searchFields?: (keyof T)[];
  renderForm?: (item: T | null, onChange: (updates: any) => void) => React.ReactNode;
  getId?: (item: T) => string;
  emptyMessage?: string;
  onExport?: (items: T[]) => void;
  onImport?: () => void;
  onCreate?: () => void;
  extraActions?: React.ReactNode;
  pageSize?: number;
}

export default function ListPage<T extends { id: string; status?: string; type?: string; createdTime?: string }>({
  title, service, columns, statusOptions, typeOptions,
  defaultStatus = '', defaultType = '', searchFields,
  renderForm, getId = (item: T) => item.id, emptyMessage = '暂无数据',
  onExport, onImport, onCreate, extraActions, pageSize = 20,
}: ListPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(defaultStatus);
  const [type, setType] = useState(defaultType);
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await service.list({ page, pageSize, status: status || undefined, type: type || undefined, search: search || undefined });
      setData(result.data as T[]);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, type, search, service]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (item: T) => {
    setEditItem(item);
    setFormData({ ...item });
    setFormOpen(true);
  };

  const handleCreate = () => {
    if (onCreate) { onCreate(); return; }
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
    try {
      await service.delete(id);
      load();
    } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    if (onExport) onExport(data);
  };

  const handleReset = () => {
    setStatus('');
    setType('');
    setSearch('');
    setDateStart('');
    setDateEnd('');
    setPage(1);
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2">
          {extraActions}
          {onImport && <ActionButton icon={<Upload className="w-3.5 h-3.5" />} label="导入" onClick={onImport} variant="default" />}
          <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" onClick={handleExport} variant="default" />
          <ActionButton icon={<Plus className="w-3.5 h-3.5" />} label="新建" onClick={handleCreate} />
        </div>
      </div>

      <div className="bg-white p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {statusOptions && (
            <SelectFilter value={status} onChange={v => { setStatus(v); setPage(1); }}
              options={statusOptions} placeholder="全部状态" />
          )}
          {typeOptions && (
            <SelectFilter value={type} onChange={v => { setType(v); setPage(1); }}
              options={typeOptions} placeholder="全部类型" />
          )}
          {searchFields && (
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={`搜索${title}...`} />
          )}
          <DateRangeFilter start={dateStart} end={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} />
          <ActionButton icon={<Search className="w-3.5 h-3.5" />} label="查询" onClick={() => load()} />
          <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="重置" onClick={handleReset} variant="default" />
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
        getId={getId}
        emptyMessage={emptyMessage}
      />

      {renderForm && service.create && (
        <FormModal
          open={formOpen}
          title={editItem ? `编辑${title}` : `新建${title}`}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSave}
        >
          {renderForm(editItem, setFormData)}
        </FormModal>
      )}
    </div>
  );
}
