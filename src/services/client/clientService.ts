import type {
  PlatformOrder, InboundOrder, OutboundDropship, OutboundTransfer,
  InboundClaim, DefectiveItem, WorkOrder, ReturnOrder, Transshipment,
  ProductInventory, CartonInventory, ReturnInventory, CombinedInventory,
  ProductAging, ClientProduct, AccountInfo, Transaction, TopUpRecord,
  PlatformAuth, OrderRule, ProductMapping, ClientAccount, ClientRole,
  Address, LoginLog, UnitSettings, FBAReturn
} from '../../types/client';
import {
  mockPlatformOrders, mockInboundOrders, mockOutboundDropship,
  mockOutboundTransfer, mockInboundClaims, mockDefectiveItems,
  mockWorkOrders, mockReturns, mockTransshipments, mockFBAReturns,
  mockProductInventory, mockCartonInventory, mockReturnInventory,
  mockCombinedInventory, mockProductAging, mockClientProducts,
  mockAccount, mockTransactions, mockTopUpRecords, mockPlatformAuths,
  mockOrderRules, mockProductMappings, mockClientAccounts, mockClientRoles,
  mockAddresses, mockLoginLogs, defaultUnitSettings, mockAnnouncements,
  paginate, filterByStatus, filterByType, filterBySearch, filterByDateRange, sortItems
} from './mockData';

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// Generic CRUD service factory
function createMockService<T extends { id: string; status?: string; type?: string }>(data: T[]) {
  let items = [...data];
  return {
    async list(params?: { page?: number; pageSize?: number; status?: string; search?: string; type?: string; [key: string]: any }) {
      await delay();
      let filtered: T[] = [...items];
      if (params?.status) filtered = filterByStatus(filtered, params.status) as T[];
      if (params?.type) filtered = filterByType(filtered as any, params.type) as T[];
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => JSON.stringify(i).toLowerCase().includes(q));
      }
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      return paginate(filtered, page, pageSize);
    },
    async getById(id: string) {
      await delay();
      return items.find(i => i.id === id) || null;
    },
    async create(item: Omit<T, 'id'>) {
      await delay();
      const newItem = { ...item, id: Math.random().toString(36).slice(2, 10) } as unknown as T;
      items.unshift(newItem);
      return newItem;
    },
    async update(id: string, updates: Partial<T>) {
      await delay();
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...updates };
      return items[idx];
    },
    async delete(id: string) {
      await delay();
      items = items.filter(i => i.id !== id);
      return true;
    },
    async reset() {
      items = [...data];
    }
  };
}

export const clientService = {
  // Dashboard
  async getDashboardStats() {
    await delay();
    return {
      inboundPending: mockInboundOrders.filter(i => ['草稿', '待审核', '待入库', '收货中'].includes(i.status)).length,
      inboundToday: Math.floor(Math.random() * 20),
      outboundPending: mockOutboundDropship.filter(i => ['草稿', '仓库处理中'].includes(i.status)).length,
      outboundToday: Math.floor(Math.random() * 30),
      returnPending: mockReturns.filter(i => ['草稿', '待入库', '处理中'].includes(i.status)).length,
      returnToday: Math.floor(Math.random() * 10),
      transshipmentPending: mockTransshipments.filter(i => ['草稿', '待处理', '运输中'].includes(i.status)).length,
      fbaReturnPending: mockFBAReturns.inbound.filter(i => ['待处理', '处理中'].includes(i.status)).length,
      inventoryTotal: mockProductInventory.reduce((s, i) => s + i.totalStock, 0),
      activeSkus: mockProductInventory.length,
      balance: mockAccount.balance,
      creditLimit: mockAccount.creditLimit,
      warningBalance: mockAccount.warningBalance,
      orderableAmount: mockAccount.orderableAmount,
      totalAssets: mockAccount.balance + mockAccount.creditLimit,
    };
  },

  // Platform Orders
  platformOrders: createMockService<PlatformOrder>(mockPlatformOrders),

  // Warehouse Services
  inboundOrders: createMockService<InboundOrder>(mockInboundOrders),
  outboundDropship: createMockService<OutboundDropship>(mockOutboundDropship),
  outboundTransfer: createMockService<OutboundTransfer>(mockOutboundTransfer),
  inboundClaims: createMockService<InboundClaim>(mockInboundClaims),
  defectiveItems: createMockService<DefectiveItem>(mockDefectiveItems),
  workOrders: createMockService<WorkOrder>(mockWorkOrders),

  // Returns
  returns: createMockService<ReturnOrder>(mockReturns),

  // Transshipment
  transshipments: createMockService<Transshipment>(mockTransshipments),

  // FBA Returns
  fbaReturnInbound: createMockService<FBAReturn>(mockFBAReturns.inbound),
  fbaReturnRelabel: createMockService<FBAReturn>(mockFBAReturns.relabel),
  fbaReturnOutbound: createMockService<FBAReturn>(mockFBAReturns.outbound),

  // Inventory
  productInventory: createMockService<ProductInventory>(mockProductInventory),
  cartonInventory: createMockService<CartonInventory>(mockCartonInventory),
  returnInventory: createMockService<ReturnInventory>(mockReturnInventory),
  combinedInventory: createMockService<CombinedInventory>(mockCombinedInventory),
  productAging: createMockService<ProductAging>(mockProductAging),
  cartonAging: createMockService<ProductAging>(
    mockProductAging.map(p => ({ ...p, id: Math.random().toString(36).slice(2, 10), sku: `CTN-AGE-${p.sku}` }))
  ),
  returnAging: createMockService<ProductAging>(
    mockProductAging.slice(0, 30).map(p => ({ ...p, id: Math.random().toString(36).slice(2, 10), sku: `RET-AGE-${p.sku}` }))
  ),

  // Products
  products: createMockService<ClientProduct>(mockClientProducts),

  // Account
  async getAccount() {
    await delay();
    return { ...mockAccount };
  },
  transactions: createMockService<Transaction>(mockTransactions),
  topUpRecords: createMockService<TopUpRecord>(mockTopUpRecords),

  // Settings
  platformAuths: createMockService<PlatformAuth>(mockPlatformAuths),
  orderRules: createMockService<OrderRule>(mockOrderRules),
  productMappings: createMockService<ProductMapping>(mockProductMappings),
  clientAccounts: createMockService<ClientAccount>(mockClientAccounts),
  clientRoles: createMockService<ClientRole>(mockClientRoles),
  addresses: createMockService<Address>(mockAddresses),
  loginLogs: createMockService<LoginLog>(mockLoginLogs),

  async getUnitSettings() {
    await delay();
    const saved = localStorage.getItem('client_unit_settings');
    return saved ? JSON.parse(saved) : { ...defaultUnitSettings };
  },
  async saveUnitSettings(settings: UnitSettings) {
    await delay();
    localStorage.setItem('client_unit_settings', JSON.stringify(settings));
    return settings;
  },

  async getAnnouncements() {
    await delay();
    return [...mockAnnouncements];
  },
};
