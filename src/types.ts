/**
 * WMS System Types and Interfaces
 * Highly aligned with corporate warehouse management architectures
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'manager';
  avatar: string;
  token?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string; // e.g. "Yukon(1108037)", "Tochtech(1108045)"
  contact: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  weight?: number; // in kg
  volume?: number; // in m³
  customerId: string;
  brand?: string;
  description?: string;
  status?: string;
}

export interface SKU {
  id: string;
  code: string;
  name: string;
  barcode: string;
  weight: number;
  customerId: string;
}

export type OrderStatus = 'ALL' | 'PENDING' | 'PICKING' | 'REVIEWS' | 'SHIPPING' | 'SHIPPED' | 'EXCEPTIONS' | 'CANCELLED';

export interface OutboundOrder {
  id: string;
  orderNo: string; // e.g. "OBS0372606290RU"
  status: OrderStatus;
  remark: string;
  totalWeight: number;
  totalQty: number;
  customerId: string;
  customerName?: string; // resolved
  customerCode?: string; // resolved
  logisticsChannelId: string;
  logisticsChannelName?: string; // resolved
  carrierId: string;
  carrierName?: string; // resolved
  waveId: string | null;
  labelPrinted: 'PRINTED' | 'NOT_PRINTED';
  recipient: string;
  salesPlatform: string;
  createdTime: string;
  orderType: string; // "单品单件" (Single item single order) or "多品多件" etc.
  items?: OutboundOrderItem[];
}

export interface OutboundOrderItem {
  id: string;
  orderId: string;
  skuId: string;
  skuCode: string;
  skuBarcode: string;
  qty: number;
  productName: string;
  category: string;
}

export interface Wave {
  id: string;
  waveNo: string; // e.g. "WV202606290001"
  status: 'PENDING' | 'PICKING' | 'COMPLETED';
  orderCount: number;
  createdTime: string;
}

export interface Carrier {
  id: string;
  name: string;
  code: string; // e.g. "FEDEX", "USPS", "UPS"
}

export interface LogisticsChannel {
  id: string;
  name: string;
  code: string; // e.g. "FEDEX-HOME-DELIVERY", "USPS-GROUND"
  carrierId: string;
  status?: string;
}

export interface Inventory {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  skuId: string;
  skuCode: string;
  skuName?: string;
  availableQty: number;
  lockedQty: number;
  locationCode: string;
  zoneCode: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  username?: string;
  module: string;
  action: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  organizationId?: string;
  userId: string;
  warehouseId?: string | null;
  operationScope?: string | null;
  type: string;
  title: string;
  description: string;
  relatedPage: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'In Review' | 'Planned' | 'In Progress' | 'Resolved' | 'Rejected';
  screenshotUrl?: string | null;
  contactEmail: string;
  browserInfo?: string | null;
  deviceInfo?: string | null;
  assignedToUserId?: string | null;
  assignedToUsername?: string | null; // For display helper
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  comments?: FeedbackComment[];
}

export interface FeedbackComment {
  id: string;
  feedbackId: string;
  userId: string;
  username?: string; // For display helper
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

// Search and filtering params
export interface FilterParams {
  tab: OrderStatus;
  customerNameCode?: string;
  orderType?: string;
  salesPlatform?: string;
  logisticsChannel?: string;
  carrier?: string;
  productCategory?: string;
  destinationCountry?: string;
  warehouseZone?: string;
  metricUnit?: string;
  location?: string;
  skuQtyExplosive?: string;
  recipient?: string;
  sku?: string;
  outboundOrderNo?: string;
  createdTimeStart?: string;
  createdTimeEnd?: string;
  totalWeight?: number;
  minQty?: number;
  maxQty?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
