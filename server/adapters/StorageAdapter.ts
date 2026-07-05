/**
 * StorageAdapter - Mock storage/3PL integration
 * Replace with real 3PL/WMS provider APIs in production
 */

export interface StorageSlotRequest {
  warehouseId: string;
  productId?: string;
  quantity: number;
}

export interface StorageSlotResponse {
  slotId: string;
  zone: string;
  aisle: string;
  capacity: number;
}

export interface StorageReportRequest {
  warehouseId: string;
  startDate: string;
  endDate: string;
}

export interface StorageReportResponse {
  totalSlots: number;
  utilized: number;
  utilizationRate: number;
  dailyCost: number;
}

export class StorageAdapter {
  async allocateSlot(request: StorageSlotRequest): Promise<StorageSlotResponse> {
    return {
      slotId: `SLOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      zone: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      aisle: `AISLE-${Math.floor(Math.random() * 20) + 1}`,
      capacity: request.quantity + Math.floor(Math.random() * 100),
    };
  }

  async getUtilizationReport(request: StorageReportRequest): Promise<StorageReportResponse> {
    return {
      totalSlots: 1000,
      utilized: Math.floor(Math.random() * 300) + 500,
      utilizationRate: parseFloat(((Math.random() * 30 + 50) / 100).toFixed(2)),
      dailyCost: parseFloat((Math.random() * 500 + 200).toFixed(2)),
    };
  }

  async transferStock(fromSlot: string, toSlot: string, quantity: number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Transferred ${quantity} units from ${fromSlot} to ${toSlot}`,
    };
  }

  async getSlotDetails(slotId: string): Promise<{ slotId: string; productId?: string; quantity: number; lastUpdated: string }> {
    return {
      slotId,
      productId: 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      quantity: Math.floor(Math.random() * 500),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const storageAdapter = new StorageAdapter();
