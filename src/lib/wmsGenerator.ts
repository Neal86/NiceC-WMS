import { Carrier, Customer, LogisticsChannel, OrderStatus } from '../types';

export type GeneratorScenario = 'outbound' | 'amazon' | 'shopify' | 'mixed';

export interface GeneratorSettings {
  count: number;
  scenario: GeneratorScenario;
  customerId: string;
  carrierId: string;
  logisticsChannelId: string;
  minItems: number;
  maxItems: number;
  minQty: number;
  maxQty: number;
  status: OrderStatus;
  labelPrinted: 'PRINTED' | 'NOT_PRINTED' | 'MIXED';
  remarkPrefix: string;
}

export interface NormalizedProduct {
  id: string;
  skuId: string;
  skuCode: string;
  skuBarcode: string;
  productName: string;
  category: string;
  weight?: number;
}

export interface GeneratedOrderPayload {
  customerId: string;
  carrierId: string;
  logisticsChannelId: string;
  salesPlatform: string;
  orderType: string;
  recipient: string;
  remark: string;
  status: OrderStatus;
  labelPrinted: 'PRINTED' | 'NOT_PRINTED';
  items: Array<{
    skuId: string;
    skuCode: string;
    skuBarcode: string;
    productName: string;
    category: string;
    qty: number;
  }>;
}

const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
];

const platformsByScenario: Record<GeneratorScenario, string[]> = {
  outbound: ['Amazon', 'Shopify', 'eBay', 'Walmart', 'TikTok Shop'],
  amazon: ['Amazon'],
  shopify: ['Shopify'],
  mixed: ['Amazon', 'Shopify', 'eBay', 'Walmart', 'TikTok Shop', 'Temu', 'SHEIN']
};

const fallbackCategories = ['汽车配件', '智能家居', '办公用品', '户外用品', '家具', '数码配件', '家用电器', '宠物用品'];

const fallbackProducts: NormalizedProduct[] = [
  {
    id: 'gen_sku_1',
    skuId: 'gen_sku_1',
    skuCode: 'NC-CAMP-CHAIR-BLK',
    skuBarcode: 'NC-CAMP-CHAIR-BLK',
    productName: 'NiceC Folding Camping Chair Black',
    category: '户外用品',
    weight: 3.2
  },
  {
    id: 'gen_sku_2',
    skuId: 'gen_sku_2',
    skuCode: 'NC-HEATED-COT-GRY',
    skuBarcode: 'NC-HEATED-COT-GRY',
    productName: 'NiceC Heated Camping Cot Gray',
    category: '户外用品',
    weight: 8.5
  },
  {
    id: 'gen_sku_3',
    skuId: 'gen_sku_3',
    skuCode: 'NC-PATIO-SET-BRN',
    skuBarcode: 'NC-PATIO-SET-BRN',
    productName: 'NiceC Folding Patio Dining Set Brown',
    category: '家具',
    weight: 18
  }
];

export const defaultGeneratorSettings: GeneratorSettings = {
  count: 10,
  scenario: 'outbound',
  customerId: '',
  carrierId: '',
  logisticsChannelId: '',
  minItems: 1,
  maxItems: 3,
  minQty: 1,
  maxQty: 2,
  status: 'PENDING',
  labelPrinted: 'NOT_PRINTED',
  remarkPrefix: 'Generator batch'
};

export function normalizeProducts(rawProducts: any[]): NormalizedProduct[] {
  const normalized = (rawProducts || [])
    .map((item, index) => {
      const skuCode = item.sku || item.code || item.skuCode || item.barcode || `GEN-SKU-${index + 1}`;
      const productName = item.name || item.skuName || item.productName || `Generated Product ${index + 1}`;
      return {
        id: item.id || `gen_product_${index + 1}`,
        skuId: item.id || item.skuId || `gen_product_${index + 1}`,
        skuCode,
        skuBarcode: item.barcode || skuCode,
        productName,
        category: item.category || fallbackCategories[index % fallbackCategories.length],
        weight: Number(item.weight || item.grossWeight || 1)
      } as NormalizedProduct;
    })
    .filter(item => item.skuCode && item.productName);

  return normalized.length > 0 ? normalized : fallbackProducts;
}

export function createDefaultSettings(customers: Customer[], carriers: Carrier[], channels: LogisticsChannel[]): GeneratorSettings {
  const firstCarrierId = carriers[0]?.id || '';
  const channel = channels.find(c => c.carrierId === firstCarrierId) || channels[0];

  return {
    ...defaultGeneratorSettings,
    customerId: customers[0]?.id || '',
    carrierId: firstCarrierId,
    logisticsChannelId: channel?.id || ''
  };
}

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function randomInt(min: number, max: number): number {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

export function pickOne<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

export function pickMany<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Math.min(count, shuffled.length)));
}

export function makeRecipient(index: number): string {
  const name = `${pickOne(firstNames)} ${pickOne(lastNames)}`;
  const code = String(100 + (index % 899));
  return `${name} / ${code} Warehouse Sample Address`;
}

export function resolvePlatform(scenario: GeneratorScenario): string {
  return pickOne(platformsByScenario[scenario] || platformsByScenario.outbound);
}

export function resolveOrderType(itemCount: number, totalQty: number): string {
  if (itemCount === 1 && totalQty === 1) return '单品单件';
  if (itemCount === 1 && totalQty > 1) return '单品多件';
  return '多品多件';
}

export function generateOutboundOrders(
  settings: GeneratorSettings,
  rawProducts: any[],
  batchNo = `GEN-${Date.now()}`
): GeneratedOrderPayload[] {
  const products = normalizeProducts(rawProducts);
  const count = clampNumber(settings.count, 1, 500);
  const minItems = clampNumber(settings.minItems, 1, 20);
  const maxItems = clampNumber(settings.maxItems, minItems, 20);
  const minQty = clampNumber(settings.minQty, 1, 999);
  const maxQty = clampNumber(settings.maxQty, minQty, 999);

  return Array.from({ length: count }, (_, index) => {
    const itemCount = randomInt(minItems, Math.min(maxItems, products.length));
    const pickedProducts = pickMany(products, itemCount);
    const items = pickedProducts.map(product => ({
      skuId: product.skuId,
      skuCode: product.skuCode,
      skuBarcode: product.skuBarcode,
      productName: product.productName,
      category: product.category,
      qty: randomInt(minQty, maxQty)
    }));
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

    return {
      customerId: settings.customerId,
      carrierId: settings.carrierId,
      logisticsChannelId: settings.logisticsChannelId,
      salesPlatform: resolvePlatform(settings.scenario),
      orderType: resolveOrderType(items.length, totalQty),
      recipient: makeRecipient(index),
      remark: `${settings.remarkPrefix || 'Generator batch'} ${batchNo} #${index + 1}`,
      status: settings.status === 'ALL' ? 'PENDING' : settings.status,
      labelPrinted: settings.labelPrinted === 'MIXED' ? (index % 3 === 0 ? 'PRINTED' : 'NOT_PRINTED') : settings.labelPrinted,
      items
    };
  });
}
