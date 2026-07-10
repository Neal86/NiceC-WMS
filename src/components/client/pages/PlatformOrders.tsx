import { useState, useEffect, useCallback } from 'react';
import { Download, Upload, Plus, Search, RotateCcw, Calendar, ChevronDown, Eye, FileText } from 'lucide-react';
import DataTable, { Column } from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';
import FormModal from '../shared/FormModal';
import { clientService } from '../../../services/client/clientService';
import type { PlatformOrder } from '../../../types/client';
import { StatusTabs, ActionButton, SearchInput, DateRangeFilter } from '../shared/PageLayout';

const statusTabs = [
  { label: '全部', key: '' },
  { label: '待处理', key: '待处理' },
  { label: '待获取平台面单', key: '待获取平台面单' },
  { label: '处理中', key: '处理中' },
  { label: '已发货', key: '已发货' },
  { label: '已取消', key: '已取消' },
  { label: '异常', key: '异常' },
];

const columns: Column<PlatformOrder>[] = [
  { key: 'orderNo', title: '订单号', width: '140px', render: item => <span className="font-mono font-semibold text-blue-600">{item.orderNo}</span> },
  { key: 'platform', title: '平台', width: '80px' },
  { key: 'status', title: '状态', width: '110px', render: item => <StatusBadge status={item.status} /> },
  { key: 'recipient', title: '收件人', width: '100px' },
  { key: 'sku', title: 'SKU', width: '120px' },
  { key: 'qty', title: '数量', width: '60px' },
  { key: 'channel', title: '物流渠道', width: '110px' },
  { key: 'carrier', title: '承运商', width: '90px' },
  { key: 'trackingNo', title: '跟踪号', width: '120px', render: item => <span className="font-mono text-slate-500">{item.trackingNo || '-'}</span> },
  { key: 'country', title: '目的国', width: '70px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

export default function PlatformOrders() {
  const [data, setData] = useState<PlatformOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<PlatformOrder | null>(null);

  const load = useCallback(async () => {
    const result = await clientService.platformOrders.list({ page, pageSize: 20, status: status || undefined, search: search || undefined });
    setData(result.data as PlatformOrder[]);
    setTotal(result.total);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const csv = [columns.map(c => c.title).join(','), ...data.map(r => columns.map(c => (r as any)[c.key] ?? '').join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = '平台订单.csv'; a.click();
  };

  const handleView = (item: PlatformOrder) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">平台订单</h2>
        <div className="flex items-center gap-2">
          <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" onClick={handleExport} variant="default" />
        </div>
      </div>

      <StatusTabs tabs={statusTabs} activeTab={status} onChange={v => { setStatus(v); setPage(1); }} />

      <div className="bg-white px-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="搜索订单号/SKU..." />
          <DateRangeFilter start={dateStart} end={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} />
          <ActionButton icon={<Search className="w-3.5 h-3.5" />} label="查询" onClick={() => load()} />
          <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="重置" onClick={() => { setStatus(''); setSearch(''); setDateStart(''); setDateEnd(''); setPage(1); }} variant="default" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        selectedIds={selectedIds}
        onSelectAll={checked => setSelectedIds(checked ? data.map(d => d.id) : [])}
        onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
        onView={handleView}
        getId={d => d.id}
        emptyMessage="暂无平台订单数据" />

      <FormModal open={detailOpen} title="订单详情" onClose={() => setDetailOpen(false)} width="600px">
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
