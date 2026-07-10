import GenericListPage from '../shared/GenericListPage';
import StatusBadge from '../shared/StatusBadge';
import { clientService } from '../../../services/client/clientService';
import type { ReturnOrder, Transshipment } from '../../../types/client';

const timeCol = (key: string) => (item: any) => <span className="text-slate-500">{item[key] || '-'}</span>;
const skuCol = (key: string) => (item: any) => <span className="font-mono text-slate-600">{item[key]}</span>;
const qtyCol = (key: string) => (item: any) => <span className="font-semibold text-slate-800">{item[key]}</span>;
const orderNoCol = (key: string) => (item: any) => <span className="font-mono font-semibold text-blue-600">{item[key]}</span>;
const statusCol = (key: string) => (item: any) => <StatusBadge status={item[key]} />;

// ===== Returns =====
const returnStatusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '待入库', key: '待入库' },
  { label: '处理中', key: '处理中' },
  { label: '已完成', key: '已完成' },
  { label: '已取消', key: '已取消' },
];

const returnTypeOptions = [
  { label: '平台退件', value: '平台退件' },
  { label: '买家退件', value: '买家退件' },
  { label: '服务商退件', value: '服务商退件' },
];

const returnColumns = [
  { key: 'returnNo', title: '退件单号', width: '130px', render: orderNoCol('returnNo') },
  { key: 'status', title: '状态', width: '90px', render: statusCol('status') },
  { key: 'type', title: '退件类型', width: '90px' },
  { key: 'platform', title: '平台', width: '80px' },
  { key: 'warehouse', title: '仓库', width: '80px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'reason', title: '退件原因', width: '120px' },
  { key: 'customerName', title: '客户', width: '90px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
  { key: 'completedTime', title: '完成时间', width: '150px', render: timeCol('completedTime') },
];

export function ReturnsPage() {
  return (
    <GenericListPage
      title="退件"
      service={clientService.returns}
      columns={returnColumns}
      statusTabs={returnStatusTabs}
      typeOptions={returnTypeOptions}
      searchPlaceholder="搜索退件单号/SKU..."
    />
  );
}

// ===== Transshipment =====
const transshipmentStatusTabs = [
  { label: '全部', key: '' },
  { label: '草稿', key: '草稿' },
  { label: '待处理', key: '待处理' },
  { label: '运输中', key: '运输中' },
  { label: '已完成', key: '已完成' },
  { label: '已取消', key: '已取消' },
];

const transshipmentColumns = [
  { key: 'orderNo', title: '转运单号', width: '130px', render: orderNoCol('orderNo') },
  { key: 'status', title: '状态', width: '90px', render: statusCol('status') },
  { key: 'fromWarehouse', title: '发出仓库', width: '90px' },
  { key: 'toWarehouse', title: '目的仓库', width: '90px' },
  { key: 'sku', title: 'SKU', width: '120px', render: skuCol('sku') },
  { key: 'qty', title: '数量', width: '60px', render: qtyCol('qty') },
  { key: 'carrier', title: '承运商', width: '90px' },
  { key: 'trackingNo', title: '跟踪号', width: '120px' },
  { key: 'createdTime', title: '创建时间', width: '150px', render: timeCol('createdTime') },
];

export function TransshipmentPage() {
  return (
    <GenericListPage
      title="转运"
      service={clientService.transshipments}
      columns={transshipmentColumns}
      statusTabs={transshipmentStatusTabs}
      searchPlaceholder="搜索转运单号/SKU..."
    />
  );
}
