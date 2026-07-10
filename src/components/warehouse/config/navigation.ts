export interface NavItem {
  key: string;
  label: string;
  icon?: string;
  children?: NavItem[];
  isTopNav?: boolean;
}

export const topNavItems: NavItem[] = [
  { key: 'home', label: '首页', isTopNav: true },
  { key: 'returns', label: '退件', isTopNav: true },
  { key: 'outbound', label: '一件代发', isTopNav: true },
  { key: 'arrivalScan', label: '到仓扫描', isTopNav: true },
  { key: 'inbound', label: '入库管理', isTopNav: true },
  { key: 'putaway', label: '上架管理', isTopNav: true },
  { key: 'stockTransfer', label: '备货中转', isTopNav: true },
  { key: 'waves', label: '波次管理', isTopNav: true },
  { key: 'secondarySort', label: '二次分拣新版', isTopNav: true },
  { key: 'reviewVerify', label: '复核/验货', isTopNav: true },
];

export const sidebarNavItems: NavItem[] = [
  { key: 'home', label: '首页' },
  {
    key: 'inboundGroup', label: '入库', children: [
      { key: 'arrivalScan', label: '到仓扫描' },
      { key: 'inbound', label: '入库管理' },
      { key: 'putaway', label: '上架管理' },
      { key: 'newProduct', label: '新品维护' },
      { key: 'inboundClaim', label: '入库认领' },
    ],
  },
  {
    key: 'outboundGroup', label: '出库', children: [
      { key: 'outbound', label: '一件代发' },
      { key: 'stockTransfer', label: '备货中转' },
      { key: 'waves', label: '波次管理' },
      { key: 'secondarySort', label: '二次分拣' },
      { key: 'reviewVerify', label: '复核/验货' },
      { key: 'packageReview', label: '包裹复核' },
      { key: 'weighing', label: '称重' },
      { key: 'relabel', label: '换标' },
      { key: 'exchangeDoc', label: '换单' },
      { key: 'exceptionItems', label: '异常件' },
      { key: 'cutOrders', label: '截单' },
    ],
  },
  { key: 'returns', label: '退件' },
  { key: 'transit', label: '转运' },
  { key: 'workOrders', label: '工单' },
  {
    key: 'reportsGroup', label: '报表', children: [
      { key: 'inoutReport', label: '出入库报表' },
      { key: 'inventoryReport', label: '库存报表' },
      { key: 'operationReport', label: '操作报表' },
    ],
  },
  {
    key: 'fbaGroup', label: 'FBA退货', children: [
      { key: 'returnInbound', label: '退货入库' },
      { key: 'relabelService', label: '换标服务' },
      { key: 'returnOutbound', label: '退货出库' },
    ],
  },
  {
    key: 'warehouseGroup', label: '库内', children: [
      { key: 'inventory', label: '产品库存' },
      { key: 'boxInventory', label: '箱库存' },
      { key: 'returnStock', label: '退货库存' },
      { key: 'defective', label: '次品处理' },
      { key: 'cycleCount', label: '盘点' },
    ],
  },
  {
    key: 'basicDataGroup', label: '基础数据', children: [
      { key: 'productManagement', label: '产品管理' },
      { key: 'locationManage', label: '库位管理' },
      { key: 'zoneManage', label: '分区管理' },
      { key: 'packaging', label: '包装材料' },
      { key: 'pickingWall', label: '拣货墙' },
    ],
  },
];

export const pageLabels: Record<string, string> = {};
export const pageKeys: Record<string, string> = {};

[...topNavItems, ...sidebarNavItems].forEach(item => {
  pageLabels[item.key] = item.label;
  if (item.children) {
    item.children.forEach(child => {
      pageLabels[child.key] = child.label;
    });
  }
});
