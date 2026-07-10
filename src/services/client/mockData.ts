import type {
  PlatformOrder, InboundOrder, OutboundDropship, OutboundTransfer,
  InboundClaim, DefectiveItem, WorkOrder, ReturnOrder, Transshipment,
  FBAReturn, ProductInventory, CartonInventory, ReturnInventory,
  CombinedInventory, ProductAging, ClientProduct, AccountInfo,
  Transaction, TopUpRecord, PlatformAuth, OrderRule, ProductMapping,
  ClientAccount, ClientRole, Address, LoginLog, UnitSettings, Announcement
} from '../../types/client';

const now = new Date();
const today = now.toISOString().slice(0, 10);

const randomDate = (daysBack: number) => {
  const d = new Date(now.getTime() - Math.random() * daysBack * 86400000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const id = () => Math.random().toString(36).slice(2, 10);

// ===== Platform Orders =====
const platformStatuses = ['待处理', '待获取平台面单', '处理中', '已发货', '已取消', '异常'];
const platforms = ['Amazon', 'Shopify', 'eBay', 'Walmart', 'Shopee', 'Mercado', 'TikTok', 'Temu'];
const carriers = ['USPS', 'UPS', 'FedEx', 'DHL', 'Canada Post'];
const channels = ['USPS Ground', 'UPS Ground', 'FedEx Home', 'DHL Express', 'UPS SurePost'];
const warehouses = ['NO.1仓', 'NO.2仓', 'NO.3仓'];
const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'MX'];

export const mockPlatformOrders: PlatformOrder[] = Array.from({ length: 86 }, (_, i) => ({
  id: id(),
  orderNo: `OBS${String(3700000 + i)}RU`,
  platform: pick(platforms),
  status: pick(platformStatuses),
  recipient: `Recipient ${i + 1}`,
  sku: `SKU-${String(10000 + i)}`,
  qty: Math.floor(Math.random() * 20) + 1,
  totalWeight: +(Math.random() * 5).toFixed(2),
  channel: pick(channels),
  carrier: pick(carriers),
  createdTime: randomDate(30),
  country: pick(countries),
  trackingNo: Math.random() > 0.3 ? `TRK${String(1000000 + i)}` : '',
  warehouse: pick(warehouses),
  remark: Math.random() > 0.7 ? `Remark ${i}` : '',
}));

// ===== Inbound Orders =====
const inboundStatuses = ['草稿', '待审核', '待入库', '收货中', '已收货', '已上架', '已取消', '已驳回'];
const inboundTypes = ['常规入库', '备货中转入库'];

export const mockInboundOrders: InboundOrder[] = Array.from({ length: 45 }, (_, i) => ({
  id: id(),
  orderNo: `IB${String(3800000 + i)}`,
  type: pick(inboundTypes),
  status: pick(inboundStatuses),
  warehouse: pick(warehouses),
  sku: `SKU-${String(20000 + i)}`,
  qty: Math.floor(Math.random() * 500) + 10,
  receivedQty: Math.floor(Math.random() * 200),
  createdTime: randomDate(30),
  expectedTime: randomDate(15),
  remark: Math.random() > 0.6 ? `备注${i}` : '',
  carrier: pick(carriers),
  trackingNo: `TRK${String(2000000 + i)}`,
}));

// ===== Outbound Dropship =====
const dropshipStatuses = ['草稿', '仓库处理中', '已出库', '已取消', '异常'];

export const mockOutboundDropship: OutboundDropship[] = Array.from({ length: 62 }, (_, i) => ({
  id: id(),
  orderNo: `DS${String(3900000 + i)}`,
  status: pick(dropshipStatuses),
  platform: pick(platforms),
  recipient: `客户${i + 1}`,
  sku: `SKU-${String(30000 + i)}`,
  qty: Math.floor(Math.random() * 10) + 1,
  channel: pick(channels),
  carrier: pick(carriers),
  trackingNo: Math.random() > 0.2 ? `TRK${String(3000000 + i)}` : '',
  createdTime: randomDate(30),
  country: pick(countries),
  warehouse: pick(warehouses),
}));

// ===== Outbound Transfer =====
const transferStatuses = ['草稿', '仓库处理中', '已出库', '已取消', '异常'];
export const mockOutboundTransfer: OutboundTransfer[] = Array.from({ length: 28 }, (_, i) => ({
  id: id(),
  orderNo: `TF${String(4000000 + i)}`,
  status: pick(transferStatuses),
  fromWarehouse: 'NO.1仓',
  toWarehouse: pick(['NO.2仓', 'NO.3仓', 'FBA仓库']),
  sku: `SKU-${String(40000 + i)}`,
  qty: Math.floor(Math.random() * 200) + 20,
  createdTime: randomDate(30),
  expectedTime: randomDate(10),
  remark: Math.random() > 0.5 ? `中转${i}` : '',
}));

// ===== Inbound Claim =====
const claimStatuses = ['待认领', '已认领', '已处理', '已过期'];
export const mockInboundClaims: InboundClaim[] = Array.from({ length: 18 }, (_, i) => ({
  id: id(),
  claimNo: `CL${String(4100000 + i)}`,
  status: pick(claimStatuses),
  warehouse: pick(warehouses),
  platform: pick(platforms),
  sku: `SKU-${String(50000 + i)}`,
  qty: Math.floor(Math.random() * 50) + 1,
  reason: pick(['无头包裹', '多收', '错误入库', '其他']),
  createdTime: randomDate(30),
  resolvedTime: Math.random() > 0.5 ? randomDate(15) : '',
}));

// ===== Defective =====
const defectiveStatuses = ['草稿', '仓库处理中', '已完成', '已取消'];
export const mockDefectiveItems: DefectiveItem[] = Array.from({ length: 15 }, (_, i) => ({
  id: id(),
  orderNo: `DF${String(4200000 + i)}`,
  status: pick(defectiveStatuses),
  warehouse: pick(warehouses),
  sku: `SKU-${String(60000 + i)}`,
  qty: Math.floor(Math.random() * 20) + 1,
  defectType: pick(['破损', '过期', '标签错误', '外观瑕疵', '功能故障']),
  createdTime: randomDate(30),
  resolvedTime: Math.random() > 0.4 ? randomDate(15) : '',
  remark: '',
}));

// ===== Work Orders =====
const workOrderStatuses = ['待审核', '已审核', '处理完成', '作废'];
const workOrderTypes = ['贴标', '重新包装', '质检', '盘点', '移库', '其他'];
export const mockWorkOrders: WorkOrder[] = Array.from({ length: 22 }, (_, i) => ({
  id: id(),
  orderNo: `WO${String(4300000 + i)}`,
  status: pick(workOrderStatuses),
  type: pick(workOrderTypes),
  warehouse: pick(warehouses),
  description: `工单描述${i + 1}`,
  createdTime: randomDate(30),
  completedTime: Math.random() > 0.5 ? randomDate(10) : '',
  assignee: `操作员${Math.floor(Math.random() * 10) + 1}`,
}));

// ===== Returns =====
const returnStatuses = ['草稿', '待入库', '处理中', '已完成', '已取消'];
const returnTypes = ['平台退件', '买家退件', '服务商退件'];
export const mockReturns: ReturnOrder[] = Array.from({ length: 35 }, (_, i) => ({
  id: id(),
  returnNo: `RT${String(4400000 + i)}`,
  status: pick(returnStatuses),
  type: pick(returnTypes),
  platform: pick(platforms),
  warehouse: pick(warehouses),
  sku: `SKU-${String(70000 + i)}`,
  qty: Math.floor(Math.random() * 5) + 1,
  reason: pick(['尺寸不合适', '产品质量问题', '发错货', '不想要了', '其他']),
  createdTime: randomDate(30),
  completedTime: Math.random() > 0.4 ? randomDate(15) : '',
  customerName: `客户${i}`,
}));

// ===== Transshipment =====
const transshipmentStatuses = ['草稿', '待处理', '运输中', '已完成', '已取消'];
export const mockTransshipments: Transshipment[] = Array.from({ length: 20 }, (_, i) => ({
  id: id(),
  orderNo: `TS${String(4500000 + i)}`,
  status: pick(transshipmentStatuses),
  fromWarehouse: pick(warehouses),
  toWarehouse: pick(['FBA仓', 'NO.2仓', '海外仓']),
  sku: `SKU-${String(80000 + i)}`,
  qty: Math.floor(Math.random() * 100) + 10,
  createdTime: randomDate(30),
  carrier: pick(carriers),
  trackingNo: `TRK${String(4000000 + i)}`,
}));

// ===== FBA Returns =====
const fbaStatuses = ['待处理', '处理中', '已完成', '已取消'];
const fbaConditions = ['Like New', 'Good', 'Acceptable', 'Damaged'];

const fbaReturnInbound: FBAReturn[] = Array.from({ length: 25 }, (_, i) => ({
  id: id(), returnNo: `FBA-IN-${String(4600000 + i)}`,
  status: pick(fbaStatuses), sku: `SKU-FBA-${i}`,
  qty: Math.floor(Math.random() * 10) + 1, warehouse: pick(warehouses),
  fnsku: `FNSKU${String(50000 + i)}`, asin: `ASIN${String(60000 + i)}`,
  condition: pick(fbaConditions), createdTime: randomDate(30),
  completedTime: Math.random() > 0.4 ? randomDate(15) : '', remark: '',
}));

const fbaRelabel: FBAReturn[] = Array.from({ length: 18 }, (_, i) => ({
  id: id(), returnNo: `FBA-RL-${String(4700000 + i)}`,
  status: pick(fbaStatuses), sku: `SKU-FBA-${i + 100}`,
  qty: Math.floor(Math.random() * 10) + 1, warehouse: pick(warehouses),
  fnsku: `FNSKU${String(70000 + i)}`, asin: `ASIN${String(80000 + i)}`,
  condition: pick(fbaConditions), createdTime: randomDate(30),
  completedTime: Math.random() > 0.4 ? randomDate(15) : '', remark: '',
}));

const fbaOutbound: FBAReturn[] = Array.from({ length: 20 }, (_, i) => ({
  id: id(), returnNo: `FBA-OUT-${String(4800000 + i)}`,
  status: pick(fbaStatuses), sku: `SKU-FBA-${i + 200}`,
  qty: Math.floor(Math.random() * 10) + 1, warehouse: pick(warehouses),
  fnsku: `FNSKU${String(90000 + i)}`, asin: `ASIN${String(100000 + i)}`,
  condition: pick(fbaConditions), createdTime: randomDate(30),
  completedTime: Math.random() > 0.4 ? randomDate(15) : '', remark: '',
}));

export const mockFBAReturns = { inbound: fbaReturnInbound, relabel: fbaRelabel, outbound: fbaOutbound };

// ===== Inventory =====
const categories = ['电子产品', '服装', '家居用品', '美妆', '食品', '玩具', '办公用品', '运动器材'];
const attributes = ['常规', '易燃', '易碎', '冷藏', '危险品', '贵重物品'];

export const mockProductInventory: ProductInventory[] = Array.from({ length: 120 }, (_, i) => {
  const total = Math.floor(Math.random() * 5000) + 10;
  const available = Math.floor(total * (0.5 + Math.random() * 0.4));
  const locked = Math.floor(Math.random() * 100);
  const inTransit = Math.floor(Math.random() * 50);
  const warning = Math.floor(total * 0.1);
  return {
    id: id(), image: '', sku: `SKU-INV-${String(10000 + i)}`,
    name: `产品名称${i + 1}`, category: pick(categories),
    warehouse: pick(warehouses), attributes: pick(attributes),
    totalStock: total, availableStock: available, warningStock: warning,
    warningDiff: available - warning, lockedStock: locked,
    inTransit: inTransit, total: total + inTransit,
  };
});

export const mockCartonInventory: CartonInventory[] = Array.from({ length: 50 }, (_, i) => ({
  id: id(), cartonNo: `CTN${String(50000 + i)}`,
  sku: `SKU-INV-${String(10000 + Math.floor(Math.random() * 100))}`,
  warehouse: pick(warehouses), location: `A-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 100)}`,
  qty: Math.floor(Math.random() * 50) + 1,
  status: pick(['在库', '已分配', '已出库']),
  createdTime: randomDate(30),
}));

export const mockReturnInventory: ReturnInventory[] = Array.from({ length: 30 }, (_, i) => ({
  id: id(), sku: `SKU-RET-${i}`, name: `退货产品${i}`,
  warehouse: pick(warehouses), qty: Math.floor(Math.random() * 100) + 1,
  sellableQty: Math.floor(Math.random() * 60), unsellableQty: Math.floor(Math.random() * 40),
  createdTime: randomDate(30),
}));

export const mockCombinedInventory: CombinedInventory[] = Array.from({ length: 80 }, (_, i) => ({
  id: id(), sku: `SKU-COMB-${i}`, name: `综合产品${i}`,
  productStock: Math.floor(Math.random() * 500),
  cartonStock: Math.floor(Math.random() * 200),
  returnStock: Math.floor(Math.random() * 100),
  total: Math.floor(Math.random() * 800),
}));

export const mockProductAging: ProductAging[] = Array.from({ length: 60 }, (_, i) => ({
  id: id(), sku: `SKU-AGE-${i}`, name: `库龄产品${i}`,
  warehouse: pick(warehouses), qty: Math.floor(Math.random() * 200) + 1,
  daysInStock: Math.floor(Math.random() * 365) + 1,
  lastMoveTime: randomDate(30), location: `B-${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 50)}`,
}));

// ===== Products =====
const productStatuses = ['草稿', '审核中', '已审核', '已驳回', '废弃'];
export const mockClientProducts: ClientProduct[] = Array.from({ length: 65 }, (_, i) => ({
  id: id(), image: '', sku: `PROD-SKU-${String(20000 + i)}`,
  name: `产品名称${i + 1}`, category: pick(categories),
  brand: `品牌${Math.floor(Math.random() * 10)}`,
  status: pick(productStatuses), warehouse: pick(warehouses),
  totalStock: Math.floor(Math.random() * 1000),
  price: +(Math.random() * 100).toFixed(2),
  createdTime: randomDate(60), barcode: `BAR${String(30000 + i)}`,
  weight: +(Math.random() * 5).toFixed(2),
  length: +(Math.random() * 50).toFixed(1),
  width: +(Math.random() * 30).toFixed(1),
  height: +(Math.random() * 20).toFixed(1),
}));

// ===== Account =====
export const mockAccount: AccountInfo = {
  balance: 152386.50, creditLimit: 500000.00,
  warningBalance: 50000.00, restrictedAmount: 0,
  orderableAmount: 347613.50, currency: 'USD',
};

export const mockTransactions: Transaction[] = Array.from({ length: 40 }, (_, i) => ({
  id: id(), type: pick(['充值', '出库扣费', '入库费', '仓储费', '退件费', '其他']),
  amount: +(Math.random() * 10000 - 5000).toFixed(2),
  balance: +(Math.random() * 200000).toFixed(2),
  description: `交易描述${i + 1}`,
  createdTime: randomDate(60),
}));

export const mockTopUpRecords: TopUpRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: id(), amount: +(Math.random() * 50000 + 1000).toFixed(2),
  method: pick(['银行转账', '信用卡', 'PayPal', '支付宝']),
  status: pick(['成功', '处理中', '失败']), createdTime: randomDate(60),
  remark: '',
}));

// ===== Platform Auth =====
const platformNames = ['Amazon', 'Mercado', 'Shopee', 'Newegg', 'Walmart', 'Shopify', 'Shopline', 'eBay', 'Lazada', 'Wayfair', 'TikTok', 'Shein', 'Temu', 'Rakuten', 'Yahoo'];
const erpNames = ['领星ERP', '马帮ERP', '通途', '易仓ERP', '积加ERP', '鲸汇ERP', '旺店通ERP', '聚水潭ERP', '妙手ERP', 'LinsGeek ERP', '店小秘'];

export const mockPlatformAuths: PlatformAuth[] = [
  ...platformNames.map((p, i) => ({
    id: id(), platform: p, type: 'platform' as const,
    storeName: `${p}店铺${i + 1}`, account: `account@${p.toLowerCase()}.com`,
    status: (i % 3 === 0 ? 'inactive' : 'active') as 'active' | 'inactive',
    syncStatus: pick(['已同步', '同步中', '同步失败', '未同步']),
    lastSyncTime: randomDate(7), createdTime: randomDate(90),
  })),
  ...erpNames.map((p, i) => ({
    id: id(), platform: p, type: 'erp' as const,
    storeName: `${p}`, account: `erp_account_${i}@${p}.com`,
    status: (i % 4 === 0 ? 'inactive' : 'active') as 'active' | 'inactive',
    syncStatus: pick(['已同步', '同步中', '同步失败', '未同步']),
    lastSyncTime: randomDate(7), createdTime: randomDate(90),
  })),
];

// ===== Order Rules =====
export const mockOrderRules: OrderRule[] = Array.from({ length: 15 }, (_, i) => ({
  id: id(), name: `订单规则${i + 1}`, platform: pick(platforms),
  priority: i + 1, status: i % 4 === 0 ? 'inactive' : 'active',
  condition: `条件${i + 1}`, action: `动作${i + 1}`,
  createdTime: randomDate(60), updatedTime: randomDate(10),
}));

// ===== Product Mapping =====
export const mockProductMappings: ProductMapping[] = Array.from({ length: 50 }, (_, i) => ({
  id: id(), platformSku: `PLAT-SKU-${i}`, systemSku: `SYS-SKU-${i}`,
  productName: `产品${i}`, platform: pick(platforms),
  status: i % 3 === 0 ? 'unmatched' : 'matched',
  createdTime: randomDate(60),
}));

// ===== Accounts =====
export const mockClientAccounts: ClientAccount[] = Array.from({ length: 12 }, (_, i) => ({
  id: id(), username: `user${i + 1}`, email: `user${i + 1}@example.com`,
  role: pick(['管理员', '运营', '财务', '客服']),
  status: i % 5 === 0 ? 'inactive' : 'active',
  lastLogin: randomDate(7), createdTime: randomDate(90),
}));

// ===== Roles =====
export const mockClientRoles: ClientRole[] = Array.from({ length: 8 }, (_, i) => ({
  id: id(), name: `角色${i + 1}`, description: `角色描述${i + 1}`,
  accountCount: Math.floor(Math.random() * 10),
  permissions: ['order:view', 'order:edit', 'inventory:view', 'product:view', 'setting:view'].slice(0, Math.floor(Math.random() * 5) + 1),
  updatedBy: `admin${i}`, updatedTime: randomDate(15),
}));

// ===== Addresses =====
const addressTypes: Address['type'][] = ['warehouse', 'fba', 'return', 'other'];
export const mockAddresses: Address[] = Array.from({ length: 25 }, (_, i) => ({
  id: id(), type: pick(addressTypes),
  name: `地址${i + 1}`, contact: `联系人${i}`,
  phone: `+1${String(1000000000 + Math.floor(Math.random() * 900000000))}`,
  address: `${Math.floor(Math.random() * 1000)} ${pick(['Main St', 'Oak Ave', 'Broadway', 'Market St'])}`,
  city: pick(['Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix']),
  state: pick(['CA', 'NY', 'TX', 'IL', 'AZ']), country: 'US',
  zipCode: String(90000 + Math.floor(Math.random() * 9999)),
  isDefault: i === 0,
}));

// ===== Login Logs =====
export const mockLoginLogs: LoginLog[] = Array.from({ length: 50 }, (_, i) => ({
  id: id(), source: pick(['Web', 'API', 'Mobile']),
  account: `user${Math.floor(Math.random() * 10) + 1}`,
  ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  device: pick(['Chrome/Windows', 'Safari/Mac', 'Firefox/Windows', 'Chrome/Mac', 'Mobile/iOS', 'Mobile/Android']),
  loginTime: randomDate(14), status: pick(['成功', '失败', '已登出']),
}));

// ===== Announcements =====
export const mockAnnouncements: Announcement[] = [
  { id: id(), title: 'Federal Holiday: Memorial Day - Office Closure Notice', date: '2026-05-19', tags: ['Overseas', 'System'] },
  { id: id(), title: 'System Upgrade Scheduled for June 15th', date: '2026-06-10', tags: ['System'] },
  { id: id(), title: 'New Carrier Partnership with DHL', date: '2026-06-05', tags: ['Logistics'] },
  { id: id(), title: 'Warehouse Inventory Count - Q3 Schedule', date: '2026-06-01', tags: ['Warehouse', 'Inventory'] },
];

// ===== Unit Settings =====
export const defaultUnitSettings: UnitSettings = {
  system: 'metric', weightUnit: 'kg', lengthUnit: 'cm',
};

// ===== Pagination helper =====
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const data = items.slice((page - 1) * pageSize, page * pageSize);
  return { data, total, totalPages, page, pageSize };
}

// ===== Filter helper =====
export function filterByStatus<T extends { status?: string }>(items: T[], status?: string) {
  if (!status || status === '全部' || status === 'all') return items;
  return items.filter(i => i.status === status);
}

export function filterByType<T extends { type?: string }>(items: T[], type?: string) {
  if (!type || type === '全部' || type === 'all') return items;
  return items.filter(i => i.type === type);
}

export function filterBySearch<T>(items: T[], search?: string, fields?: (keyof T)[]) {
  if (!search || !fields?.length) return items;
  const q = search.toLowerCase();
  return items.filter(i => fields.some(f => String(i[f]).toLowerCase().includes(q)));
}

export function filterByDateRange<T extends { createdTime?: string }>(items: T[], start?: string, end?: string) {
  if (!start && !end) return items;
  return items.filter(i => {
    if (!i.createdTime) return true;
    const d = new Date(i.createdTime).getTime();
    if (start && d < new Date(start).getTime()) return false;
    if (end && d > new Date(end + ' 23:59:59').getTime()) return false;
    return true;
  });
}

export function sortItems<T>(items: T[], field?: string, order?: 'asc' | 'desc') {
  if (!field) return items;
  return [...items].sort((a, b) => {
    const av = (a as any)[field] || '';
    const bv = (b as any)[field] || '';
    const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
    return order === 'desc' ? -cmp : cmp;
  });
}
