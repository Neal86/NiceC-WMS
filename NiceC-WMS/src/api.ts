import axios from 'axios';
import { FilterParams, OutboundOrder, Customer, Carrier, LogisticsChannel } from './types';

// Set up base Axios instance with default headers
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wms_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Keep the UI in a safe state when the backend rejects an expired or invalid token.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('wms_token');
      localStorage.removeItem('wms_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password?: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.status === 'success' && response.data.user.token) {
      localStorage.setItem('wms_token', response.data.user.token);
      localStorage.setItem('wms_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('wms_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  refreshCurrentUser: async () => {
    const response = await api.get('/auth/me');
    if (response.data?.user) {
      const current = authApi.getCurrentUser() || {};
      const merged = { ...current, ...response.data.user, token: current.token };
      localStorage.setItem('wms_user', JSON.stringify(merged));
      return merged;
    }
    return response.data;
  }
};

export const outboundApi = {
  getOrders: async (params: FilterParams) => {
    const response = await api.get('/outbound-orders', { params });
    return response.data;
  },
  getOrderById: async (id: string) => {
    const response = await api.get(`/outbound-orders/${id}`);
    return response.data;
  },
  createOrder: async (orderData: Partial<OutboundOrder>) => {
    const response = await api.post('/outbound-orders', orderData);
    return response.data;
  },
  updateOrder: async (id: string, orderData: Partial<OutboundOrder>) => {
    const response = await api.put(`/outbound-orders/${id}`, orderData);
    return response.data;
  },
  deleteOrder: async (id: string) => {
    const response = await api.delete(`/outbound-orders/${id}`);
    return response.data;
  },
  cancelOrder: async (id: string) => {
    const response = await api.post(`/outbound-orders/${id}/cancel`);
    return response.data;
  },
  shipOrder: async (id: string) => {
    const response = await api.post(`/outbound-orders/${id}/ship`);
    return response.data;
  },
  printLabel: async (id: string) => {
    const response = await api.post(`/outbound-orders/${id}/print-label`);
    return response.data;
  },
  markLabelPrinted: async (id: string) => {
    const response = await api.post(`/outbound-orders/${id}/mark-label-printed`);
    return response.data;
  },
  batchGenerateWave: async (orderIds: string[]) => {
    const response = await api.post('/outbound-orders/batch-generate-wave', { orderIds });
    return response.data;
  },
  batchPrintPickList: async (orderIds: string[]) => {
    const response = await api.post('/outbound-orders/batch-print-pick-list', { orderIds });
    return response.data;
  },
  exportOrders: async (params?: FilterParams) => {
    const response = await api.post('/outbound-orders/export', params || {});
    return response.data;
  },
  importOrders: async (rows?: unknown[]) => {
    const response = await api.post('/outbound-orders/import', { rows: rows || [] });
    return response.data;
  },
  bulkImport: async (rows: Array<{orderNo: string; recipientName: string; address: string; phone: string; skuCode: string; qty: number; logisticsChannel: string}>) => {
    const response = await api.post('/outbound-orders/import', { rows });
    return response.data;
  },
  getImportHistory: async () => {
    const response = await api.get('/outbound-orders/import-history');
    return response.data;
  }
};

export const metadataApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/customers');
    return response.data;
  },
  getCarriers: async (): Promise<Carrier[]> => {
    const response = await api.get('/carriers');
    return response.data;
  },
  getLogisticsChannels: async (): Promise<LogisticsChannel[]> => {
    const response = await api.get('/logistics-channels');
    return response.data;
  },
  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  getSkus: async () => {
    const response = await api.get('/skus');
    return response.data;
  },
  getWarehouses: async () => {
    const response = await api.get('/warehouses');
    return response.data;
  },
  getInventory: async () => {
    const response = await api.get('/inventory');
    return response.data;
  }
};

export const waveApi = {
  getWaves: async () => {
    const response = await api.get('/waves');
    return response.data;
  },
  getWaveById: async (id: string) => {
    const response = await api.get(`/waves/${id}`);
    return response.data;
  },
  createWave: async (waveData: any) => {
    const response = await api.post('/waves', waveData);
    return response.data;
  },
  updateWave: async (id: string, waveData: any) => {
    const response = await api.put(`/waves/${id}`, waveData);
    return response.data;
  },
  deleteWave: async (id: string) => {
    const response = await api.delete(`/waves/${id}`);
    return response.data;
  }
};

export const customerApi = {
  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  createCustomer: async (data: any) => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  updateCustomer: async (id: string, data: any) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  deleteCustomer: async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export const productApi = {
  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  createProduct: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  updateProduct: async (id: string, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

export const skuApi = {
  getSkus: async () => {
    const response = await api.get('/skus');
    return response.data;
  },
  createSku: async (data: any) => {
    const response = await api.post('/skus', data);
    return response.data;
  },
  updateSku: async (id: string, data: any) => {
    const response = await api.put(`/skus/${id}`, data);
    return response.data;
  },
  deleteSku: async (id: string) => {
    const response = await api.delete(`/skus/${id}`);
    return response.data;
  }
};

export const carrierApi = {
  getCarriers: async () => {
    const response = await api.get('/carriers');
    return response.data;
  },
  createCarrier: async (data: any) => {
    const response = await api.post('/carriers', data);
    return response.data;
  },
  updateCarrier: async (id: string, data: any) => {
    const response = await api.put(`/carriers/${id}`, data);
    return response.data;
  },
  deleteCarrier: async (id: string) => {
    const response = await api.delete(`/carriers/${id}`);
    return response.data;
  }
};

export const channelApi = {
  getChannels: async () => {
    const response = await api.get('/logistics-channels');
    return response.data;
  },
  createChannel: async (data: any) => {
    const response = await api.post('/logistics-channels', data);
    return response.data;
  },
  updateChannel: async (id: string, data: any) => {
    const response = await api.put(`/logistics-channels/${id}`, data);
    return response.data;
  },
  deleteChannel: async (id: string) => {
    const response = await api.delete(`/logistics-channels/${id}`);
    return response.data;
  }
};

export const warehouseApi = {
  getWarehouses: async () => {
    const response = await api.get('/warehouses');
    return response.data;
  },
  createWarehouse: async (data: any) => {
    const response = await api.post('/warehouses', data);
    return response.data;
  },
  updateWarehouse: async (id: string, data: any) => {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  },
  deleteWarehouse: async (id: string) => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  }
};

export const inventoryApi = {
  getInventory: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  updateInventory: async (id: string, data: any) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  transferInventory: async (data: any) => {
    const response = await api.post('/inventory/transfer', data);
    return response.data;
  },
  adjustInventory: async (data: any) => {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  }
};

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  getOutboundTrend: async () => {
    const response = await api.get('/dashboard/outbound-trend');
    return response.data;
  },
  getChannelDistribution: async () => {
    const response = await api.get('/dashboard/channel-distribution');
    return response.data;
  }
};

export const logApi = {
  getOperationLogs: async () => {
    const response = await api.get('/operation-logs');
    return response.data;
  }
};

export const userApi = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (data: { username: string; email?: string; name?: string; role: string; password?: string; customerId?: string; warehouseId?: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  toggleUserStatus: async (id: string, status: 'ACTIVE' | 'DISABLED') => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },
  resetPassword: async (id: string, password: string) => {
    const response = await api.post(`/users/${id}/reset-password`, { password });
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export const apiKeyApi = {
  getKeys: async () => {
    const response = await api.get('/api-keys');
    return response.data;
  },
  createKey: async (data: any) => {
    const response = await api.post('/api-keys', data);
    return response.data;
  },
  updateKey: async (id: string, data: any) => {
    const response = await api.put(`/api-keys/${id}`, data);
    return response.data;
  },
  deleteKey: async (id: string) => {
    const response = await api.delete(`/api-keys/${id}`);
    return response.data;
  },
  testKey: async (id: string) => {
    const response = await api.post(`/api-keys/${id}/test`);
    return response.data;
  }
};

export const webhookApi = {
  getWebhooks: async () => {
    const response = await api.get('/webhooks');
    return response.data;
  },
  createWebhook: async (data: any) => {
    const response = await api.post('/webhooks', data);
    return response.data;
  },
  updateWebhook: async (id: string, data: any) => {
    const response = await api.put(`/webhooks/${id}`, data);
    return response.data;
  },
  deleteWebhook: async (id: string) => {
    const response = await api.delete(`/webhooks/${id}`);
    return response.data;
  },
  testWebhook: async (id: string) => {
    const response = await api.post(`/webhooks/${id}/test`);
    return response.data;
  }
};

export const storeConnectionApi = {
  getConnections: async () => {
    const response = await api.get('/store-connections');
    return response.data;
  },
  createConnection: async (data: any) => {
    const response = await api.post('/store-connections', data);
    return response.data;
  },
  updateConnection: async (id: string, data: any) => {
    const response = await api.put(`/store-connections/${id}`, data);
    return response.data;
  },
  deleteConnection: async (id: string) => {
    const response = await api.delete(`/store-connections/${id}`);
    return response.data;
  },
  syncConnection: async (id: string) => {
    const response = await api.post(`/store-connections/${id}/sync`);
    return response.data;
  }
};

export const returnApi = {
  getReturns: async (params?: any) => {
    const response = await api.get('/return-orders', { params });
    return response.data;
  },
  createReturn: async (data: any) => {
    const response = await api.post('/return-orders', data);
    return response.data;
  },
  getReturnById: async (id: string) => {
    const response = await api.get(`/return-orders/${id}`);
    return response.data;
  },
  updateReturn: async (id: string, data: any) => {
    const response = await api.put(`/return-orders/${id}`, data);
    return response.data;
  },
  receiveReturn: async (id: string) => {
    const response = await api.post(`/return-orders/${id}/receive`);
    return response.data;
  },
  inspectReturn: async (id: string, items?: any[]) => {
    const response = await api.post(`/return-orders/${id}/inspect`, { items });
    return response.data;
  },
  restockReturn: async (id: string) => {
    const response = await api.post(`/return-orders/${id}/restock`);
    return response.data;
  }
};

export const billingApi = {
  getRules: async () => {
    const response = await api.get('/billing-rules');
    return response.data;
  },
  createRule: async (data: any) => {
    const response = await api.post('/billing-rules', data);
    return response.data;
  },
  updateRule: async (id: string, data: any) => {
    const response = await api.put(`/billing-rules/${id}`, data);
    return response.data;
  },
  deleteRule: async (id: string) => {
    const response = await api.delete(`/billing-rules/${id}`);
    return response.data;
  },
  getRecords: async () => {
    const response = await api.get('/billing-records');
    return response.data;
  },
  generateRecords: async () => {
    const response = await api.post('/billing-records/generate');
    return response.data;
  },
  getInvoices: async () => {
    const response = await api.get('/invoices');
    return response.data;
  },
  generateInvoice: async () => {
    const response = await api.post('/invoices/generate');
    return response.data;
  },
};

export const inboundApi = {
  getOrders: async (params?: any) => {
    const response = await api.get('/inbound-orders', { params });
    return response.data;
  },
  receive: async (orderId: string, items?: any[]) => {
    const response = await api.post(`/inbound-orders/${orderId}/receive`, { items });
    return response.data;
  },
  createOrder: async (data: any) => {
    const response = await api.post('/inbound-orders', data);
    return response.data;
  }
};

export const putawayApi = {
  getTasks: async (params?: any) => {
    const response = await api.get('/putaway-tasks', { params });
    return response.data;
  },
  complete: async (taskId: string) => {
    const response = await api.post(`/putaway-tasks/${taskId}/complete`);
    return response.data;
  }
};

export const pickApi = {
  getTasks: async (params?: any) => {
    const response = await api.get('/pick-tasks', { params });
    return response.data;
  },
  complete: async (taskId: string) => {
    const response = await api.post(`/pick-tasks/${taskId}/complete`);
    return response.data;
  }
};

export const reviewApi = {
  getTasks: async (params?: any) => {
    const response = await api.get('/review-tasks', { params });
    return response.data;
  },
  complete: async (taskId: string) => {
    const response = await api.post(`/review-tasks/${taskId}/complete`);
    return response.data;
  }
};

export const exceptionApi = {
  getCases: async (params?: any) => {
    const response = await api.get('/exception-cases', { params });
    return response.data;
  },
  resolve: async (caseId: string) => {
    const response = await api.post(`/exception-cases/${caseId}/resolve`);
    return response.data;
  }
};

export const relabelApi = {
  getOrders: async (params?: any) => {
    const response = await api.get('/relabel-orders', { params });
    return response.data;
  },
  complete: async (orderId: string) => {
    const response = await api.post(`/relabel-orders/${orderId}/complete`);
    return response.data;
  }
};

export const locationApi = {
  getLocations: async (params?: any) => {
    const response = await api.get('/locations', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/locations', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/locations/${id}`);
    return response.data;
  },
  adjust: async (data: any) => {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  }
};

export const cycleCountApi = {
  getTasks: async (params?: any) => {
    const response = await api.get('/cycle-counts', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/cycle-counts', data);
    return response.data;
  },
  complete: async (taskId: string) => {
    const response = await api.post(`/cycle-counts/${taskId}/complete`);
    return response.data;
  }
};

export const workOrderApi = {
  getOrders: async (params?: any) => {
    const response = await api.get('/work-orders', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/work-orders', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/work-orders/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/work-orders/${id}`);
    return response.data;
  }
};

export const zoneApi = {
  getZones: async (params?: any) => {
    const response = await api.get('/zones', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/zones', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/zones/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/zones/${id}`);
    return response.data;
  }
};

export const packagingApi = {
  getMaterials: async (params?: any) => {
    const response = await api.get('/packaging-materials', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/packaging-materials', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/packaging-materials/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/packaging-materials/${id}`);
    return response.data;
  }
};

export const pickingWallApi = {
  getWalls: async (params?: any) => {
    const response = await api.get('/picking-walls', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/picking-walls', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/picking-walls/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/picking-walls/${id}`);
    return response.data;
  }
};

export default api;
