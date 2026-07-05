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
  async createShipment(request: CarrierShipmentRequest): Promise<CarrierShipmentResponse> {
    // Mock: simulate carrier API call
    return {
      trackingNo: '1Z' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      labelUrl: `https://mock.carrier.com/label/${request.orderNo}`,
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      cost: parseFloat((request.weight * 2.5 + 5).toFixed(2)),
    };
  }

  async getRates(request: CarrierRateRequest): Promise<CarrierRateResponse[]> {
    // Mock: return sample rates
    return [
      { serviceLevel: 'Ground', rate: parseFloat((request.weight * 1.2 + 3).toFixed(2)), estimatedDays: '3-5' },
      { serviceLevel: '2-Day', rate: parseFloat((request.weight * 2.0 + 5).toFixed(2)), estimatedDays: '2' },
      { serviceLevel: 'Overnight', rate: parseFloat((request.weight * 3.5 + 8).toFixed(2)), estimatedDays: '1' },
    ];
  }

  async trackShipment(trackingNo: string): Promise<{ status: string; location: string; timestamp: string }> {
    return {
      status: 'IN_TRANSIT',
      location: 'Memphis, TN',
      timestamp: new Date().toISOString(),
    };
  }

  async validateAddress(address: string): Promise<{ valid: boolean; normalized?: string }> {
    return { valid: true, normalized: address };
  }
}

export const carrierAdapter = new CarrierAdapter();
