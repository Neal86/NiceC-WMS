/** Client Portal Types */

export interface ClientStats {
  inboundPending: number;
  inboundToday: number;
  outboundPending: number;
  outboundToday: number;
  returnPending: number;
  returnToday: number;
  transshipmentPending: number;
  fbaReturnPending: number;
  inventoryTotal: number;
  activeSkus: number;
  balance: number;
  creditLimit: number;
  warningBalance: number;
  orderableAmount: number;
  totalAssets: number;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  tags: string[];
}

export interface PlatformOrder {
  id: string;
  orderNo: string;
  platform: string;
  status: string;
  recipient: string;
  sku: string;
  qty: number;
  totalWeight: number;
  channel: string;
  carrier: string;
  createdTime: string;
  country: string;
  trackingNo: string;
  warehouse: string;
  remark: string;
}

export interface InboundOrder {
  id: string;
  orderNo: string;
  type: string;
  status: string;
  warehouse: string;
  sku: string;
  qty: number;
  receivedQty: number;
  createdTime: string;
  expectedTime: string;
  remark: string;
  carrier: string;
  trackingNo: string;
}

export interface OutboundDropship {
  id: string;
  orderNo: string;
  status: string;
  platform: string;
  recipient: string;
  sku: string;
  qty: number;
  channel: string;
  carrier: string;
  trackingNo: string;
  createdTime: string;
  country: string;
  warehouse: string;
}

export interface OutboundTransfer {
  id: string;
  orderNo: string;
  status: string;
  fromWarehouse: string;
  toWarehouse: string;
  sku: string;
  qty: number;
  createdTime: string;
  expectedTime: string;
  remark: string;
}

export interface InboundClaim {
  id: string;
  claimNo: string;
  status: string;
  warehouse: string;
  platform: string;
  sku: string;
  qty: number;
  reason: string;
  createdTime: string;
  resolvedTime: string;
}

export interface DefectiveItem {
  id: string;
  orderNo: string;
  status: string;
  warehouse: string;
  sku: string;
  qty: number;
  defectType: string;
  createdTime: string;
  resolvedTime: string;
  remark: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  status: string;
  type: string;
  warehouse: string;
  description: string;
  createdTime: string;
  completedTime: string;
  assignee: string;
}

export interface ReturnOrder {
  id: string;
  returnNo: string;
  status: string;
  type: string;
  platform: string;
  warehouse: string;
  sku: string;
  qty: number;
  reason: string;
    createdTime: string;
  completedTime: string;
  customerName: string;
}

export interface Transshipment {
  id: string;
  orderNo: string;
  status: string;
  fromWarehouse: string;
  toWarehouse: string;
  sku: string;
  qty: number;
  createdTime: string;
  carrier: string;
  trackingNo: string;
}

export interface FBAReturn {
  id: string;
  returnNo: string;
  status: string;
  sku: string;
  qty: number;
  warehouse: string;
  fnsku: string;
  asin: string;
  condition: string;
  createdTime: string;
  completedTime: string;
  remark: string;
}

export interface ProductInventory {
  id: string;
  image: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  attributes: string;
  totalStock: number;
  availableStock: number;
  warningStock: number;
  warningDiff: number;
  lockedStock: number;
  inTransit: number;
  total: number;
}

export interface CartonInventory {
  id: string;
  cartonNo: string;
  sku: string;
  warehouse: string;
  location: string;
  qty: number;
  status: string;
  createdTime: string;
}

export interface ReturnInventory {
  id: string;
  sku: string;
  name: string;
    warehouse: string;
  qty: number;
  sellableQty: number;
  unsellableQty: number;
  createdTime: string;
}

export interface CombinedInventory {
  id: string;
  sku: string;
  name: string;
  productStock: number;
  cartonStock: number;
  returnStock: number;
  total: number;
}

export interface ProductAging {
  id: string;
  sku: string;
  name: string;
  warehouse: string;
  qty: number;
  daysInStock: number;
  lastMoveTime: string;
  location: string;
}

export interface ClientProduct {
  id: string;
  image: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  status: string;
    warehouse: string;
  totalStock: number;
    price: number;
  createdTime: string;
  barcode: string;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface AccountInfo {
  balance: number;
  creditLimit: number;
  warningBalance: number;
  restrictedAmount: number;
  orderableAmount: number;
  currency: string;
}

export interface Transaction {
  id: string;
    type: string;
  amount: number;
  balance: number;
  description: string;
  createdTime: string;
}

export interface TopUpRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdTime: string;
  remark: string;
}

export interface PlatformAuth {
  id: string;
  platform: string;
  type: 'platform' | 'erp';
  storeName: string;
  account: string;
  status: 'active' | 'inactive';
  syncStatus: string;
  lastSyncTime: string;
  createdTime: string;
}

export interface OrderRule {
  id: string;
  name: string;
  platform: string;
    priority: number;
  status: 'active' | 'inactive';
  condition: string;
  action: string;
  createdTime: string;
  updatedTime: string;
}

export interface ProductMapping {
  id: string;
  platformSku: string;
  systemSku: string;
  productName: string;
  platform: string;
  status: 'matched' | 'unmatched';
    createdTime: string;
}

export interface ClientAccount {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdTime: string;
}

export interface ClientRole {
  id: string;
  name: string;
  description: string;
  accountCount: number;
  permissions: string[];
  updatedBy: string;
  updatedTime: string;
}

export interface Address {
  id: string;
  type: 'warehouse' | 'fba' | 'return' | 'other';
  name: string;
  contact: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface LoginLog {
  id: string;
    source: string;
    account: string;
    ip: string;
    device: string;
    loginTime: string;
    status: string;
}

export interface UnitSettings {
  system: 'metric' | 'imperial';
  weightUnit: string;
  lengthUnit: string;
}

export interface ClientStatsData {
  inboundStats: { pending: number; today: number; total: number };
  outboundStats: { pending: number; today: number; total: number };
  returnStats: { pending: number; today: number; total: number };
  transshipmentStats: { pending: number; total: number };
  fbaStats: { pending: number; total: number };
  inventoryStats: { totalStock: number; activeSkus: number };
  accountStats: { balance: number; creditLimit: number; warningBalance: number; orderableAmount: number };
  orderAnalysis: { inbound: number; dropship: number; transfer: number };
  announcements: Announcement[];
}
