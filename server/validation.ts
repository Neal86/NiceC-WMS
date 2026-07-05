import { z } from 'zod';

export function formatZodError(err: z.ZodError) {
  return {
    success: false as const,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    },
  };
}

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const outboundCreateSchema = z.object({
  customerId: z.string().optional(),
  logisticsChannelId: z.string().min(1, 'Logistics channel is required'),
  carrierId: z.string().min(1, 'Carrier is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  remark: z.string().optional(),
  salesPlatform: z.string().optional(),
  orderType: z.string().optional(),
  items: z.array(z.object({
    skuId: z.string().min(1, 'SKU ID is required'),
    qty: z.number().int().positive('Quantity must be positive'),
    skuCode: z.string().optional(),
    skuBarcode: z.string().optional(),
    productName: z.string().optional(),
    category: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

export const outboundUpdateSchema = z.object({
  status: z.string().optional(),
  remark: z.string().optional(),
  recipient: z.string().optional(),
  salesPlatform: z.string().optional(),
  orderType: z.string().optional(),
  logisticsChannelId: z.string().optional(),
  carrierId: z.string().optional(),
  items: z.array(z.object({
    skuId: z.string().min(1),
    qty: z.number().int().positive(),
    skuCode: z.string().optional(),
    category: z.string().optional(),
  })).optional(),
});

export const inboundCreateSchema = z.object({
  customerId: z.string().optional(),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  remark: z.string().optional(),
  items: z.array(z.object({
    skuId: z.string().min(1, 'SKU ID is required'),
    skuCode: z.string().min(1, 'SKU code is required'),
    qtyExpected: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
});

export const inboundReceiveSchema = z.object({
  receivedItems: z.array(z.object({
    skuId: z.string().min(1),
    qtyReceived: z.number().int().nonnegative(),
  })).optional(),
  differences: z.array(z.object({
    skuId: z.string().optional(),
    expectedQty: z.number().optional(),
    actualQty: z.number().optional(),
    note: z.string().optional(),
  })).optional(),
  remark: z.string().optional(),
});

export const inventoryAdjustSchema = z.object({
  inventoryId: z.string().optional(),
  skuId: z.string().optional(),
  warehouseId: z.string().optional(),
  adjustQty: z.number(),
  quantity: z.number().optional(),
  type: z.enum(['ADD', 'SUBTRACT', 'IN', 'OUT']).optional().default('ADD'),
  reason: z.string().optional(),
});

export const inventoryTransferSchema = z.object({
  skuId: z.string().min(1),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
});

export const returnCreateSchema = z.object({
  orderId: z.string().optional(),
  items: z.array(z.object({
    skuId: z.string().min(1),
    skuCode: z.string().min(1),
    qty: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
  reason: z.string().optional(),
});

export const returnInspectSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    qtyReceived: z.number().int().nonnegative(),
    condition: z.enum(['RESTOCK', 'DAMAGED', 'RELABEL_REQUIRED']),
  })),
});

export const billingRuleCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  type: z.string().min(1),
  rate: z.number().nonnegative(),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scope: z.string().optional(),
});

export const apiKeyUpdateSchema = z.object({
  status: z.string().optional(),
  name: z.string().optional(),
});

export const webhookCreateSchema = z.object({
  url: z.string().url('Valid URL is required'),
  events: z.string().optional(),
});

export const webhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.string().optional(),
  status: z.string().optional(),
});

export const storeConnectionCreateSchema = z.object({
  platform: z.string().min(1),
  shopName: z.string().min(1),
  apiToken: z.string().optional(),
});

export const storeConnectionUpdateSchema = z.object({
  shopName: z.string().optional(),
  status: z.string().optional(),
});

export const userCreateSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.string().optional().default('OPERATOR'),
  password: z.string().optional().default('NiceC123!'),
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  status: z.string().optional().default('ACTIVE'),
});

export const userUpdateSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  password: z.string().optional(),
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  status: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const feedbackCreateSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  relatedPage: z.string().optional(),
  warehouseId: z.string().optional(),
  operationScope: z.string().optional(),
  priority: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export const exceptionCaseCreateSchema = z.object({
  orderId: z.string().optional(),
  type: z.string().min(1),
  description: z.string().min(1),
});

export const bulkImportSchema = z.object({
  rows: z.array(z.object({
    orderNo: z.string().min(1, 'orderNo is required'),
    recipientName: z.string().min(1, 'recipientName is required'),
    address: z.string().min(1, 'address is required'),
    phone: z.string().optional().default(''),
    skuCode: z.string().min(1, 'skuCode is required'),
    qty: z.number().int().positive('qty must be positive'),
    logisticsChannel: z.string().min(1, 'logisticsChannel is required'),
  })).min(1, 'At least one row is required'),
});
