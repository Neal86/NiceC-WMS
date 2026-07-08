/**
 * CarrierAdapter - Mock carrier integration
 * Replace with real carrier APIs in production (FedEx, UPS, USPS, DHL, etc.)
 */

export interface CarrierShipmentRequest {
  orderNo: string;
  recipient: string;
  address: string;
  weight: number;
  carrierId: string;
  serviceLevel?: string;
}

export interface CarrierShipmentResponse {
  trackingNo: string;
  labelUrl: string;
  estimatedDelivery: string;
  cost: number;
}

export interface CarrierRateRequest {
  weight: number;
  fromZip: string;
  toZip: string;
  carrierId: string;
}

export interface CarrierRateResponse {
  serviceLevel: string;
  rate: number;
  estimatedDays: string;
}

export class CarrierAdapter {
  async createLabel(request: CarrierShipmentRequest): Promise<CarrierShipmentResponse> {
    // Create shipping label — mock implementation
    return {
      trackingNo: '1Z' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      labelUrl: `https://mock.carrier.com/label/${request.orderNo}`,
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      cost: parseFloat((request.weight * 2.5 + 5).toFixed(2)),
    };
  }

  /** @deprecated Use createLabel instead */
  async createShipment(request: CarrierShipmentRequest): Promise<CarrierShipmentResponse> {
    return this.createLabel(request);
  }

  async track(trackingNo: string): Promise<{ status: string; location: string; timestamp: string }> {
    return {
      status: 'IN_TRANSIT',
      location: 'Memphis, TN',
      timestamp: new Date().toISOString(),
    };
  }

  /** @deprecated Use track instead */
  async trackShipment(trackingNo: string): Promise<{ status: string; location: string; timestamp: string }> {
    return this.track(trackingNo);
  }

  async voidLabel(trackingNo: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Label ${trackingNo} has been voided successfully.`,
    };
  }

  async getRates(request: CarrierRateRequest): Promise<CarrierRateResponse[]> {
    return [
      { serviceLevel: 'Ground', rate: parseFloat((request.weight * 1.2 + 3).toFixed(2)), estimatedDays: '3-5' },
      { serviceLevel: '2-Day', rate: parseFloat((request.weight * 2.0 + 5).toFixed(2)), estimatedDays: '2' },
      { serviceLevel: 'Overnight', rate: parseFloat((request.weight * 3.5 + 8).toFixed(2)), estimatedDays: '1' },
    ];
  }

  async validateAddress(address: string): Promise<{ valid: boolean; normalized?: string }> {
    return { valid: true, normalized: address };
  }
}

export const carrierAdapter = new CarrierAdapter();
