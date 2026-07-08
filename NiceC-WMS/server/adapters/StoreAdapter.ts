/**
 * StoreAdapter - Mock e-commerce platform integration
 * Replace with real platform APIs in production (Amazon, Shopify, Walmart, TikTok, etc.)
 */

export interface SyncOrdersRequest {
  platform: string;
  customerId: string;
  lastSyncAt?: string;
}

export interface SyncOrdersResponse {
  synced: number;
  orders: Array<{ platformOrderId: string; status: string; items: Array<{ sku: string; qty: number }> }>;
}

export interface SyncProductsRequest {
  platform: string;
  customerId: string;
}

export interface SyncProductsResponse {
  synced: number;
  products: Array<{ platformSku: string; name: string; price: number }>;
}

export interface SyncInventoryRequest {
  platform: string;
  customerId: string;
  inventory: Array<{ sku: string; qty: number }>;
}

export interface SyncInventoryResponse {
  synced: number;
  errors: string[];
}

export class StoreAdapter {
  async syncOrders(request: SyncOrdersRequest): Promise<SyncOrdersResponse> {
    // Mock: return sample orders
    return {
      synced: Math.floor(Math.random() * 20) + 5,
      orders: Array.from({ length: 5 }, (_, i) => ({
        platformOrderId: `${request.platform}-${Date.now()}-${i}`,
        status: 'UNFULFILLED',
        items: [
          { sku: `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, qty: Math.floor(Math.random() * 5) + 1 },
        ],
      })),
    };
  }

  async syncProducts(request: SyncProductsRequest): Promise<SyncProductsResponse> {
    return {
      synced: Math.floor(Math.random() * 50) + 10,
      products: Array.from({ length: 3 }, (_, i) => ({
        platformSku: `${request.platform}-SKU-${i}`,
        name: `Product ${i} from ${request.platform}`,
        price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      })),
    };
  }

  async syncInventory(request: SyncInventoryRequest): Promise<SyncInventoryResponse> {
    return {
      synced: request.inventory.length,
      errors: [],
    };
  }

  async testConnection(platform: string, credentials?: any): Promise<{ connected: boolean; message: string }> {
    return {
      connected: true,
      message: `Successfully connected to ${platform}`,
    };
  }
}

export const storeAdapter = new StoreAdapter();
