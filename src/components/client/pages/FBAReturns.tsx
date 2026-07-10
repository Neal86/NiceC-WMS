import GenericListPage from '../shared/GenericListPage';
import StatusBadge from '../shared/StatusBadge';
import { clientService } from '../../../services/client/clientService';

const timeCol = (key: string) => (item: any) => <span className="text-slate-500">{item[key] || '-'}</span>;
const skuCol = (key: string) => (item: any) => <span className="font-mono text-slate-600">{item[key]}</span>;
const qtyCol = (key: string) => (item: any) => <span className="font-semibold text-slate-800">{item[key]}</span>;
const orderNoCol = (key: string) => (item: any) => <span className="font-mono font-semibold text-blue-600">{item[key]}</span>;
const statusCol = (key: string) => (item: any) => <StatusBadge status={item[key]} />;

const fbaStatusTabs = [
  { label: '全部', key: '' },
  { label: '待处理', key: '待处理' },
  { label: '处理中', key: '处理中' },
  { label: '已完成', key: '已完成' },
  { label: '已取消', key: '已取消' },
];

const fbaColumns = [
  { key: 'returnNo', title: '退货单号', width: '140px', render: orderNoCol('returnNo') },
  { key: 'status', title: '状态', width: '90px', render: statusCol('status') },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'fnsku', title: 'FNSKU', width: '120px' },
  { key: 'asin', title: 'ASIN', width: '120px' },
  { key: 'condition', title: '状况', width: '90px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'completedTime', title: '完成时间', width: '150px', render: timeCol('completedTime') },
];

const fbaForm = (item: any, onChange: (u: any) => void) => (
  <div className="space-y-3">
    <div><label className="text-slate-400">SKU</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.sku || ''} onChange={e => onChange({ sku: e.target.value })} /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="text-slate-400">数量</label><input type="number" className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.qty || ''} onChange={e => onChange({ qty: +e.target.value })} /></div>
      <div><label className="text-slate-400">仓库</label>
        <select className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.warehouse || ''} onChange={e => onChange({ warehouse: e.target.value })}>
          <option>NO.1仓</option><option>NO.2仓</option><option>NO.3仓</option>
        </select></div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div><label className="text-slate-400">FNSKU</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.fnsku || ''} onChange={e => onChange({ fnsku: e.target.value })} /></div>
      <div><label className="text-slate-400">ASIN</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.asin || ''} onChange={e => onChange({ asin: e.target.value })} /></div>
      <div><label className="text-slate-400">状况</label>
        <select className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.condition || ''} onChange={e => onChange({ condition: e.target.value })}>
          <option>Like New</option><option>Good</option><option>Acceptable</option><option>Damaged</option>
        </select></div>
    </div>
    <div><label className="text-slate-400">备注</label><textarea className="w-full mt-1 h-16 px-2 border border-slate-300 rounded text-[11px]" defaultValue={item?.remark || ''} onChange={e => onChange({ remark: e.target.value })} /></div>
  </div>
);

export function FBAReturnInboundPage() {
  return (
    <GenericListPage
      title="FBA退货入库"
      service={clientService.fbaReturnInbound}
      columns={fbaColumns}
      statusTabs={fbaStatusTabs}
      searchPlaceholder="搜索退货单号/SKU..."
      renderForm={fbaForm}
    />
  );
}

export function FBAReturnRelabelPage() {
  return (
    <GenericListPage
      title="FBA退货换标"
      service={clientService.fbaReturnRelabel}
      columns={fbaColumns}
      statusTabs={fbaStatusTabs}
      searchPlaceholder="搜索换标单号/SKU..."
      renderForm={fbaForm}
    />
  );
}

export function FBAReturnOutboundPage() {
  return (
    <GenericListPage
      title="FBA退货出库"
      service={clientService.fbaReturnOutbound}
      columns={fbaColumns}
      statusTabs={fbaStatusTabs}
      searchPlaceholder="搜索出库单号/SKU..."
      renderForm={fbaForm}
    />
  );
}
