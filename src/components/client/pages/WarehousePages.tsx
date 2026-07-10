import GenericListPage from '../shared/GenericListPage';
import StatusBadge from '../shared/StatusBadge';
import { clientService } from '../../../services/client/clientService';
import type { InboundOrder, OutboundDropship, OutboundTransfer, InboundClaim, DefectiveItem, WorkOrder } from '../../../types/client';

const timeCol = (key: string) => (item: any) => <span className="text-slate-500">{item[key] || '-'}</span>;
const skuCol = (key: string) => (item: any) => <span className="font-mono text-slate-600">{item[key]}</span>;
const qtyCol = (key: string) => (item: any) => <span className="font-semibold text-slate-800">{item[key]}</span>;
const orderNoCol = (key: string) => (item: any) => <span className="font-mono font-semibold text-blue-600">{item[key]}</span>;
const statusCol = (key: string) => (item: any) => <StatusBadge status={item[key]} />;

// ===== Inbound =====
const inboundStatusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '待审核', key: '待审核' },
  { label: '待入库', key: '待入库' },
  { label: '收货中', key: '收货中' },
  { label: '已收货', key: '已收货' },
  { label: '已上架', key: '已上架' },
  { label: '已取消', key: '已取消' },
  { label: '已驳回', key: '已驳回' },
];

const inboundTypeOptions = [
  { label: '常规入库', value: '常规入库' },
  { label: '备货中转入库', value: '备货中转入库' },
];

const inboundColumns = [
  { key: 'orderNo', title: '入库单号', width: '130px', render: orderNoCol('orderNo') },
  { key: 'type', title: '类型', width: '90px' },
  { key: 'status', title: '状态', width: '90px', render: statusCol('status') },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'receivedQty', title: '已收', width: '60px', render: qtyCol('receivedQty') },
  { key: 'carrier', title: '承运商', width: '80px' },
  { key: 'trackingNo', title: '跟踪号', width: '120px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'remark', title: '备注', width: '100px' },
];

export function InboundPage() {
  return (
    <GenericListPage
      title="入库"
      service={clientService.inboundOrders}
      columns={inboundColumns}
      statusTabs={inboundStatusTabs}
      typeOptions={inboundTypeOptions}
      searchPlaceholder="搜索入库单号/SKU..."
      renderForm={(item, onChange) => (
        <div className="space-y-3">
          <div><label className="text-slate-400">入库单号</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={item?.orderNo || ''} onChange={e => onChange({ orderNo: e.target.value })} /></div>
          <div><label className="text-slate-400">SKU</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={item?.sku || ''} onChange={e => onChange({ sku: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">数量</label><input type="number" className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={item?.qty || ''} onChange={e => onChange({ qty: +e.target.value })} /></div>
            <div><label className="text-slate-400">仓库</label>
              <select className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={item?.warehouse || ''} onChange={e => onChange({ warehouse: e.target.value })}>
                <option>NO.1仓</option><option>NO.2仓</option><option>NO.3仓</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400">承运商</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={item?.carrier || ''} onChange={e => onChange({ carrier: e.target.value })} /></div>
            <div><label className="text-slate-400">跟踪号</label><input className="w-full mt-1 h-7 px-2 border border-slate-300 rounded text-[11px]" value={item?.trackingNo || ''} onChange={e => onChange({ trackingNo: e.target.value })} /></div>
          </div>
          <div><label className="text-slate-400">备注</label><textarea className="w-full mt-1 h-16 px-2 border border-slate-300 rounded text-[11px]" value={item?.remark || ''} onChange={e => onChange({ remark: e.target.value })} /></div>
        </div>
      )}
    />
  );
}

// ===== Dropship =====
const dropshipStatusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '仓库处理中', key: '仓库处理中' },
  { label: '已出库', key: '已出库' },
  { label: '已取消', key: '已取消' },
  { label: '异常', key: '异常' },
];

const dropshipColumns = [
  { key: 'orderNo', title: '出库单号', width: '130px', render: orderNoCol('orderNo') },
  { key: 'status', title: '状态', width: '100px', render: statusCol('status') },
  { key: 'platform', title: '平台', width: '80px' },
  { key: 'recipient', title: '收件人', width: '100px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'channel', title: '物流渠道', width: '110px' },
  { key: 'carrier', title: '承运商', width: '90px' },
  { key: 'trackingNo', title: '跟踪号', width: '120px' },
  { key: 'country', title: '目的国', width: '70px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
];

export function DropshipPage() {
  return (
    <GenericListPage
      title="一件代发出库"
      service={clientService.outboundDropship}
      columns={dropshipColumns}
      statusTabs={dropshipStatusTabs}
      searchPlaceholder="搜索单号/SKU..."
    />
  );
}

// ===== Transfer =====
const transferStatusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '仓库处理中', key: '仓库处理中' },
  { label: '已出库', key: '已出库' },
  { label: '已取消', key: '已取消' },
  { label: '异常', key: '异常' },
];

const transferColumns = [
  { key: 'orderNo', title: '中转单号', width: '130px', render: orderNoCol('orderNo') },
  { key: 'status', title: '状态', width: '100px', render: statusCol('status') },
  { key: 'fromWarehouse', title: '发出仓库', width: '90px' },
  { key: 'toWarehouse', title: '目的仓库', width: '90px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'expectedTime', title: '预计到达', width: '150px', render: timeCol('expectedTime') },
  { key: 'remark', title: '备注', width: '100px' },
];

export function TransferPage() {
  return (
    <GenericListPage
      title="备货中转出库"
      service={clientService.outboundTransfer}
      columns={transferColumns}
      statusTabs={transferStatusTabs}
      searchPlaceholder="搜索中转单号/SKU..."
    />
  );
}

// ===== Inbound Claim =====
const claimStatusTabs = [
  { label: '全部', key: '' },
  { label: '待认领', key: '待认领' },
  { label: '已认领', key: '已认领' },
  { label: '已处理', key: '已处理' },
  { label: '已过期', key: '已过期' },
];

const claimColumns = [
  { key: 'claimNo', title: '认领单号', width: '130px', render: orderNoCol('claimNo') },
  { key: 'status', title: '状态', width: '90px', render: statusCol('status') },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'platform', title: '平台', width: '80px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'reason', title: '原因', width: '100px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'resolvedTime', title: '处理时间', width: '150px', render: timeCol('resolvedTime') },
];

export function InboundClaimPage() {
  return (
    <GenericListPage
      title="入库认领"
      service={clientService.inboundClaims}
      columns={claimColumns}
      statusTabs={claimStatusTabs}
      searchPlaceholder="搜索认领单号/SKU..."
    />
  );
}

// ===== Defective =====
const defectiveStatusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '仓库处理中', key: '仓库处理中' },
  { label: '已完成', key: '已完成' },
  { label: '已取消', key: '已取消' },
];

const defectiveColumns = [
  { key: 'orderNo', title: '处理单号', width: '130px', render: orderNoCol('orderNo') },
  { key: 'status', title: '状态', width: '100px', render: statusCol('status') },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'defectType', title: '次品类型', width: '100px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'resolvedTime', title: '处理时间', width: '150px', render: timeCol('resolvedTime') },
];

export function DefectivePage() {
  return (
    <GenericListPage
      title="次品处理"
      service={clientService.defectiveItems}
      columns={defectiveColumns}
      statusTabs={defectiveStatusTabs}
      searchPlaceholder="搜索处理单号/SKU..."
    />
  );
}

// ===== Work Orders =====
const workOrderStatusTabs = [
  { label: '全部', key: '' },
  { label: '待审核', key: '待审核' },
  { label: '已审核', key: '已审核' },
  { label: '处理完成', key: '处理完成' },
  { label: '作废', key: '作废' },
];

const workOrderColumns = [
  { key: 'orderNo', title: '工单号', width: '130px', render: orderNoCol('orderNo') },
  { key: 'status', title: '状态', width: '90px', render: statusCol('status') },
  { key: 'type', title: '工单类型', width: '90px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'description', title: '描述', width: '150px' },
  { key: 'assignee', title: '负责人', width: '80px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'completedTime', title: '完成时间', width: '150px', render: timeCol('completedTime') },
];

export function WorkOrderPage() {
  return (
    <GenericListPage
      title="工单"
      service={clientService.workOrders}
      columns={workOrderColumns}
      statusTabs={workOrderStatusTabs}
      searchPlaceholder="搜索工单号..."
    />
  );
}
