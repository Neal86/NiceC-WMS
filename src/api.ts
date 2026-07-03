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
  createUser: async (data: { username: string; email?: string; name?: string; role: string; password?: string; customerId?: string; warehouseId?: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  toggleUserStatus: async (id: string, status: 'ACTIVE' | 'DISABLED') => {
    const response = await api.put(`/users/${id}`, { status });
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
  }
};

export default api;
