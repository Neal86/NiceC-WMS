import fs from 'fs';
import path from 'path';
import { 
  User, Customer, SKU, OutboundOrder, OutboundOrderItem, 
  Wave, Carrier, LogisticsChannel, OrderStatus, Product,
  Warehouse, Inventory, OperationLog, Feedback, FeedbackComment
} from '../src/types';

const DATA_FILE = path.join(process.cwd(), 'server', 'data.json');

// Make sure directory exists
if (!fs.existsSync(path.join(process.cwd(), 'server'))) {
  fs.mkdirSync(path.join(process.cwd(), 'server'), { recursive: true });
}

export interface DBState {
  users: User[];
  customers: Customer[];
  carriers: Carrier[];
  logisticsChannels: LogisticsChannel[];
  waves: Wave[];
  outboundOrders: OutboundOrder[];
  outboundOrderItems: OutboundOrderItem[];
  products: Product[];
  skus: SKU[];
  warehouses: Warehouse[];
  inventory: Inventory[];
  operationLogs: OperationLog[];
  feedbacks: Feedback[];
  feedbackComments: FeedbackComment[];
}

const DEFAULT_STATE: DBState = {
  users: [
    {
      id: 'usr_admin',
      username: 'admin@nicec.net',
      email: 'admin@nicec.net',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 'usr_1',
      username: 'neal@nicec.net',
      email: 'neal@nicec.net',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 'usr_2',
      username: 'operator',
      email: 'operator@nicec.net',
      role: 'operator',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'
    }
  ],
  customers: [
    { id: 'cust_1', name: 'Yukon', code: 'Yukon(1108037)', contact: 'John Yukon', email: 'john@yukon.com' },
    { id: 'cust_2', name: 'Tochtech', code: 'Tochtech(1108045)', contact: 'Terry Toch', email: 'terry@tochtech.com' },
    { id: 'cust_3', name: 'Zonestar', code: 'Zonestar(1108099)', contact: 'Zara Lin', email: 'zara@zonestar.com' },
    { id: 'cust_4', name: 'ApexLogistics', code: 'Apex(1108210)', contact: 'Alex Apex', email: 'alex@apex.com' },
    { id: 'cust_5', name: 'GlobalEcom', code: 'GlobalEcom(1108552)', contact: 'Gavin Glo', email: 'gavin@globalecom.com' }
  ],
  carriers: [
    { id: 'carr_fedex', name: 'FEDEX', code: 'FEDEX' },
    { id: 'carr_usps', name: 'USPS', code: 'USPS' },
    { id: 'carr_ups', name: 'UPS', code: 'UPS' },
    { id: 'carr_dhl', name: 'DHL', code: 'DHL' },
    { id: 'carr_amz', name: 'AMAZON', code: 'AMAZON' }
  ],
  logisticsChannels: [
    { id: 'chan_fedex_home', name: 'FEDEX-HOME-DELIVERY(FHD_G)', code: 'FEDEX-HOME-DELIVERY', carrierId: 'carr_fedex' },
    { id: 'chan_usps_ground', name: 'USPS GROUND(USPS_G)', code: 'USPS_GROUND', carrierId: 'carr_usps' },
    { id: 'chan_ups_ground', name: 'UPS GROUND(UPS_G)', code: 'UPS_GROUND', carrierId: 'carr_ups' },
    { id: 'chan_dhl_express', name: 'DHL EXPRESS(DHL_EXP)', code: 'DHL_EXPRESS', carrierId: 'carr_dhl' },
    { id: 'chan_amz_ground', name: 'AMAZON SHIP(AMZ_S)', code: 'AMAZON_SHIP', carrierId: 'carr_amz' }
  ],
  waves: [],
  outboundOrders: [],
  outboundOrderItems: [],
  products: [],
  skus: [],
  warehouses: [
    { id: 'wh_1', name: 'NC - NO.1仓 - 92503', code: '92503', address: 'North Carolina, USA' },
    { id: 'wh_2', name: 'NJ - NO.2仓 - 08817', code: '08817', address: 'New Jersey, USA' }
  ],
  inventory: [],
  operationLogs: [],
  feedbacks: [],
  feedbackComments: []
};

// Seed storage state
let cachedState: DBState | null = null;

export function getDB(): DBState {
  if (cachedState) return cachedState;
  
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedState = JSON.parse(content);
      
      if (cachedState) {
        if (!cachedState.feedbacks) cachedState.feedbacks = [];
        if (!cachedState.feedbackComments) cachedState.feedbackComments = [];
      }
      
      // If products are empty, force seed programmatically
      if (cachedState && (!cachedState.products || cachedState.products.length === 0)) {
        seedProgrammatically(cachedState);
        saveDB();
      }
      
      // If feedbacks are empty, seed them as well
      if (cachedState && (!cachedState.feedbacks || cachedState.feedbacks.length === 0)) {
        seedFeedbacks(cachedState);
        saveDB();
      }
      
      return cachedState!;
    } catch (e) {
      console.error('Failed to load JSON db, using defaults:', e);
    }
  }
  
  cachedState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  seedProgrammatically(cachedState!);
  seedFeedbacks(cachedState!);
  saveDB();
  return cachedState!;
}

export function saveDB() {
  if (!cachedState) return;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write JSON db:', e);
  }
}

// Help generation of massive seed data as required
function seedProgrammatically(state: DBState) {
  // 1. Generate 20 Products & 50 SKUs
  const productSamples = [
    { name: '智能炉灶开关至重仓旋钮 Smart Stove Safety Knob Controller', cat: '智能家居', brand: 'SmartGuard' },
    { name: '05-23 Toyota Tacoma Double Cab 5ft Bed Running Boards Side Steps Nerf Bars Stainless Steel', cat: '汽车配件', brand: 'OasisAuto' },
    { name: '07-18 Jeep Wrangler JK 4 Door Tubular Side Steps Armor Off Road Rock Slider Steel Black', cat: '汽车配件', brand: 'OffroadX' },
    { name: '07-18 Chevy Silverado / GMC Sierra Side Step Bars', cat: '汽车配件', brand: 'RoughCountry' },
    { name: 'Heated Camping Chair USB Powered Portable Folding Outdoor', cat: '运动户外', brand: 'Kampa' },
    { name: 'Folding Camping Cot Heavy Duty Travel Sleeping Bed', cat: '运动户外', brand: 'Coleman' },
    { name: 'Stadium Seat Cushion for Bleachers Wide Foam Support', cat: '运动户外', brand: 'SportsFans' },
    { name: 'Beach Chair With Umbrella Canopy Adjustable Recliner', cat: '运动户外', brand: 'SunCoast' },
    { name: 'Portable Privacy Tent Pop Up Changing Room Toilet Shower', cat: '运动户外', brand: 'TentWorld' },
    { name: 'Folding Camping Table Lightweight Aluminum Roll Up', cat: '运动户外', brand: 'Kampa' },
    { name: 'Heated Hammock Chair Single Person Hanging Cozy Swing', cat: '运动户外', brand: 'HammockCo' },
    { name: 'Patio Dining Set 5 Piece Outdoor Furniture Conversation Bistro Set', cat: '家具用品', brand: 'DecoSpace' },
    { name: 'Office Ergonomic High Back Mesh Task Chair', cat: '办公用品', brand: 'Herman' },
    { name: 'Smart RGB LED Floor Lamp compatible with Alexa Home', cat: '智能家居', brand: 'Govee' },
    { name: 'Stainless Steel Insulated Water Bottle 32oz Wide Mouth', cat: '家居用品', brand: 'HydroFlask' },
    { name: 'Magnetic Wireless Power Bank 10000mAh PD Fast Charge', cat: '数码配件', brand: 'Anker' },
    { name: 'Active Noise Cancelling Wireless Over Ear Headphones', cat: '数码配件', brand: 'Sony' },
    { name: 'Cordless Handheld Vacuum Cleaner 12000Pa Powerful Suction', cat: '生活电器', brand: 'Dyson' },
    { name: 'Air Fryer XL 5.8 Quart Digital Touchscreen Cooker', cat: '厨房电器', brand: 'Cosori' },
    { name: 'Robot Vacuum and Mop Combo self-charging smart routing', cat: '生活电器', brand: 'Roborock' }
  ];

  const productsList: Product[] = [];
  const skusList: SKU[] = [];

  // Seed specified sample products
  productSamples.forEach((sample, i) => {
    const pId = `prod_${i + 1}`;
    productsList.push({
      id: pId,
      name: sample.name,
      category: sample.cat,
      brand: sample.brand,
      description: `High-quality ${sample.name} designed for premium performance and durability.`,
      status: 'ACTIVE',
      sku: `SKU-${1000 + i}`,
      barcode: `627843${100000 + i}`,
      customerId: state.customers[i % state.customers.length].id
    });

    // Create 2-3 SKUs per Product to reach 50 SKUs
    for (let j = 0; j < 3; j++) {
      const skuIndex = i * 3 + j;
      if (skuIndex < 50) {
        let skuCode = `SKU-CODE-${i + 1}-${j + 1}`;
        let barcode = `6278438334${i}${j}`;
        
        // Exact matching for user specified products
        if (i === 0 && j === 0) {
          skuCode = 'TS-V-NA-4';
          barcode = '627843833475';
        } else if (i === 1 && j === 0) {
          skuCode = '289-TX-69';
          barcode = '289-TX-69';
        } else if (i === 2 && j === 0) {
          skuCode = 'LJJX-TX-38';
          barcode = 'LJJX-TX-38';
        } else if (i === 3 && j === 0) {
          skuCode = 'LJJX-TX-33';
          barcode = 'LJJX-TX-33';
        }

        skusList.push({
          id: `sku_${skuIndex + 1}`,
          code: skuCode,
          name: `${sample.name} - Opt ${j + 1}`,
          barcode: barcode,
          weight: parseFloat((1.5 + Math.random() * 8).toFixed(2)),
          customerId: state.customers[skuIndex % state.customers.length].id
        });
      }
    }
  });

  state.products = productsList;
  state.skus = skusList;

  // 2. Generate 20 Waves
  const wavesList: Wave[] = [];
  for (let i = 1; i <= 20; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (i % 7));
    wavesList.push({
      id: `wave_${i}`,
      waveNo: `WV202606${String(30 - (i % 5)).padStart(2, '0')}00${String(i).padStart(2, '0')}`,
      status: i % 3 === 0 ? 'COMPLETED' : i % 3 === 1 ? 'PICKING' : 'PENDING',
      orderCount: 15 + (i * 3) % 12,
      createdTime: d.toISOString().replace('T', ' ').substring(0, 19)
    });
  }
  state.waves = wavesList;

  // 3. Generate 300 Inventory Records
  const inventoryList: Inventory[] = [];
  let invIdCounter = 1;
  state.warehouses.forEach(wh => {
    state.skus.forEach((sku, idx) => {
      // 3 positions per SKU in different zones to hit 300
      const zones = ['A', 'B', 'C', 'D'];
      zones.forEach(zone => {
        if (inventoryList.length < 300) {
          const skuProd = state.products.find(p => p.customerId === sku.customerId);
          inventoryList.push({
            id: `inv_${invIdCounter++}`,
            warehouseId: wh.id,
            warehouseName: wh.name,
            skuId: sku.id,
            skuCode: sku.code,
            skuName: sku.name,
            availableQty: Math.floor(Math.random() * 250) + 10,
            reservedQty: Math.floor(Math.random() * 15),
            damagedQty: Math.floor(Math.random() * 5)
          });
        }
      });
    });
  });
  state.inventory = inventoryList;

  // 4. Generate 100 Operation Logs
  const logsList: OperationLog[] = [];
  const modules = ['出库管理', '入库管理', '库存调整', '波次归集', '面单管理', '客户资料'];
  const actions = ['创建出库单', '修改状态', '生成波次', '打印面单', '审核通过', '盘点更新'];
  for (let i = 1; i <= 100; i++) {
    const user = state.users[i % state.users.length];
    const logDate = new Date();
    logDate.setMinutes(logDate.getMinutes() - i * 40);
    logsList.push({
      id: `log_${i}`,
      userId: user.id,
      username: user.username,
      module: modules[i % modules.length],
      action: actions[i % actions.length],
      targetId: `ord_${100 + (i % 50)}`,
      detail: `用户 ${user.username} 成功执行操作 [${actions[i % actions.length]}] 于模块 [${modules[i % modules.length]}], 关联编号: OBS03726063${1000 + i}`,
      createdAt: logDate.toISOString().replace('T', ' ').substring(0, 19)
    });
  }
  state.operationLogs = logsList;

  // 5. Generate 500 Outbound Orders & 800 Outbound Order Items
  const ordersList: OutboundOrder[] = [];
  const itemsList: OutboundOrderItem[] = [];
  let itemCounter = 1;

  // Helper arrays
  const countries = ['USA', 'Canada', 'Germany', 'UK', 'Australia'];
  const platforms = ['Amazon', 'eBay', 'Shopify', 'Walmart', 'TikTokShop'];
  const types = ['单品单件', '单品多件', '多品多件'];
  const remarks = ['-', '急单', '加急配送', '防震包装', '内含赠品', '-', '-'];
  
  // Create first 3 SPECIFIC requested orders to match exactly
  // Order 1
  const o1Id = 'ord_spec_1';
  ordersList.push({
    id: o1Id,
    orderNo: 'OBS037260630002',
    status: 'PENDING',
    remark: '-',
    totalWeight: 1.2,
    totalQty: 1,
    customerId: 'cust_1',
    logisticsChannelId: 'chan_usps_ground',
    carrierId: 'carr_usps',
    waveId: 'wave_1',
    labelPrinted: 'NOT_PRINTED',
    recipient: 'Michael Chang (TX, USA)',
    salesPlatform: 'Amazon',
    createdTime: '2026-06-30 11:22:11',
    orderType: '单品单件'
  });
  itemsList.push({
    id: `item_spec_${itemCounter++}`,
    orderId: o1Id,
    skuId: 'sku_1',
    skuCode: 'TS-V-NA-4',
    skuBarcode: '627843833475',
    qty: 1,
    productName: '智能炉灶开关至重仓旋钮 Smart Stove Safety Knob Controller',
    category: '智能家居'
  });

  // Order 2
  const o2Id = 'ord_spec_2';
  ordersList.push({
    id: o2Id,
    orderNo: 'OBS037260630001',
    status: 'PENDING',
    remark: '急单',
    totalWeight: 18.5,
    totalQty: 2,
    customerId: 'cust_1',
    logisticsChannelId: 'chan_ups_ground',
    carrierId: 'carr_ups',
    waveId: 'wave_1',
    labelPrinted: 'NOT_PRINTED',
    recipient: 'Robert Taylor (IL, USA)',
    salesPlatform: 'Amazon',
    createdTime: '2026-06-30 10:00:15',
    orderType: '单品多件'
  });
  itemsList.push({
    id: `item_spec_${itemCounter++}`,
    orderId: o2Id,
    skuId: 'sku_2',
    skuCode: '289-TX-69',
    skuBarcode: '289-TX-69',
    qty: 2,
    productName: '05-23 Toyota Tacoma Double Cab 5ft Bed Running Boards Side Steps Nerf Bars Stainless Steel',
    category: '汽车配件'
  });

  // Order 3
  const o3Id = 'ord_spec_3';
  ordersList.push({
    id: o3Id,
    orderNo: 'OBS0372606290RU',
    status: 'PENDING',
    remark: '-',
    totalWeight: 9.25,
    totalQty: 1,
    customerId: 'cust_1',
    logisticsChannelId: 'chan_fedex_home',
    carrierId: 'carr_fedex',
    waveId: null,
    labelPrinted: 'NOT_PRINTED',
    recipient: 'Michael Chang (TX, USA)',
    salesPlatform: 'Amazon',
    createdTime: '2026-06-29 08:35:14',
    orderType: '单品单件'
  });
  itemsList.push({
    id: `item_spec_${itemCounter++}`,
    orderId: o3Id,
    skuId: 'sku_2',
    skuCode: '289-TX-69',
    skuBarcode: '289-TX-69',
    qty: 1,
    productName: '05-23 Toyota Tacoma Double Cab 5ft Bed Running Boards Side Steps Nerf Bars Stainless Steel',
    category: '汽车配件'
  });

  // Now create another 497 randomized orders to reach 500 orders and over 800 items
  const orderStatuses: OrderStatus[] = ['PENDING', 'PICKING', 'REVIEWS', 'SHIPPING', 'SHIPPED', 'EXCEPTIONS', 'CANCELLED'];
  
  for (let i = 4; i <= 500; i++) {
    const oId = `ord_gen_${i}`;
    const cust = state.customers[i % state.customers.length];
    const carrier = state.carriers[i % state.carriers.length];
    const channel = state.logisticsChannels.find(lc => lc.carrierId === carrier.id) || state.logisticsChannels[0];
    const waveObj = wavesList[i % wavesList.length];
    
    // Distribute status to match WMS screenshot statistics
    let status: OrderStatus = 'SHIPPED';
    if (i < 10) status = 'PENDING';
    else if (i < 20) status = 'PICKING';
    else if (i < 30) status = 'REVIEWS';
    else if (i < 35) status = 'SHIPPING';
    else if (i < 40) status = 'EXCEPTIONS';
    else if (i < 45) status = 'CANCELLED';

    const oNo = `OBS03726${String(Math.floor(100000 + i * 211))}`;
    const oType = types[i % types.length];
    const numItems = oType === '单品单件' ? 1 : oType === '单品多件' ? 1 : 2 + (i % 3);
    
    let orderTotalQty = 0;
    let orderTotalWeight = 0;

    // Create item rows for this order
    for (let j = 0; j < numItems; j++) {
      const skuObj = state.skus[(i * 3 + j) % state.skus.length];
      const prodObj = state.products.find(p => p.customerId === skuObj.customerId) || state.products[0];
      const qty = oType === '单品多件' ? 3 + (i % 4) : 1;
      
      orderTotalQty += qty;
      orderTotalWeight += (skuObj.weight || 1.2) * qty;

      itemsList.push({
        id: `item_gen_${itemCounter++}`,
        orderId: oId,
        skuId: skuObj.id,
        skuCode: skuObj.code,
        skuBarcode: skuObj.barcode,
        qty,
        productName: prodObj.name,
        category: prodObj.category || '未分类'
      });
    }

    const orderTime = new Date();
    orderTime.setHours(orderTime.getHours() - (i % 48) - 1);

    ordersList.push({
      id: oId,
      orderNo: oNo,
      status,
      remark: remarks[i % remarks.length],
      totalWeight: parseFloat(orderTotalWeight.toFixed(2)),
      totalQty: orderTotalQty,
      customerId: cust.id,
      logisticsChannelId: channel.id,
      carrierId: carrier.id,
      waveId: status === 'PICKING' ? waveObj.id : null,
      labelPrinted: status === 'SHIPPED' || status === 'SHIPPING' ? 'PRINTED' : 'NOT_PRINTED',
      recipient: `Recipient_${i} (${countries[i % countries.length]})`,
      salesPlatform: platforms[i % platforms.length],
      createdTime: orderTime.toISOString().replace('T', ' ').substring(0, 19),
      orderType: oType
    });
  }

  state.outboundOrders = ordersList;
  state.outboundOrderItems = itemsList;
  console.log(`Successfully seeded ${state.outboundOrders.length} orders and ${state.outboundOrderItems.length} order items programmatically!`);
}

function seedFeedbacks(state: DBState) {
  const mockFeedbacks: Feedback[] = [
    {
      id: 'fb_1',
      organizationId: 'org_nicec',
      userId: 'usr_1',
      warehouseId: 'LA Warehouse',
      operationScope: 'Outbound',
      type: 'Bug Report',
      title: 'Outbound order filter not saving',
      description: "When I select '单品多件' in the order type filter, it resets back to default after clicking search.",
      relatedPage: '/outbound/orders',
      priority: 'High',
      status: 'New',
      screenshotUrl: null,
      contactEmail: 'neal@nicec.net',
      browserInfo: 'Chrome 126.0.0',
      deviceInfo: 'MacBook Pro (macOS 14.5)',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Investigating local storage state sync issue.',
      createdAt: '2026-06-28 10:00:00',
      updatedAt: '2026-06-28 10:00:00',
      resolvedAt: null,
    },
    {
      id: 'fb_2',
      organizationId: 'org_nicec',
      userId: 'usr_2',
      warehouseId: 'Ontario Warehouse',
      operationScope: 'Exceptions',
      type: 'Feature Request',
      title: 'Add bulk exception package resolution',
      description: 'We need a button to select multiple barcode mismatch exception packages and mark them resolved in one click instead of doing them individually.',
      relatedPage: '/exceptions/packages',
      priority: 'Medium',
      status: 'In Review',
      screenshotUrl: null,
      contactEmail: 'operator@nicec.net',
      browserInfo: 'Firefox 127.0',
      deviceInfo: 'Windows 11',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Discussed with team, will prioritize in next release.',
      createdAt: '2026-06-27 08:30:00',
      updatedAt: '2026-06-27 08:30:00',
      resolvedAt: null,
    },
    {
      id: 'fb_3',
      organizationId: 'org_nicec',
      userId: 'usr_2',
      warehouseId: 'Dallas Warehouse',
      operationScope: 'Inventory',
      type: 'Data Issue',
      title: 'Inventory quantity mismatch for HC-001',
      description: 'Physical count at location A-3-2 shows 12 units of HC-001 but the system records 18. Need discrepancy reconciliation.',
      relatedPage: '/inventory/manager',
      priority: 'Critical',
      status: 'In Progress',
      screenshotUrl: null,
      contactEmail: 'operator@nicec.net',
      browserInfo: 'Chrome 126.0.0',
      deviceInfo: 'Windows 10',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Recount scheduled for tomorrow.',
      createdAt: '2026-06-29 14:15:00',
      updatedAt: '2026-06-29 14:15:00',
      resolvedAt: null,
    },
    {
      id: 'fb_4',
      organizationId: 'org_nicec',
      userId: 'usr_1',
      warehouseId: 'New Jersey Warehouse',
      operationScope: 'Outbound',
      type: 'UI/UX Suggestion',
      title: 'Make picking task priority easier to compare',
      description: 'The priority indicators on the picking list are all black text. Can we use colored tags (red for high, yellow for medium) so operators can easily compare?',
      relatedPage: '/waves/picking',
      priority: 'Low',
      status: 'Planned',
      screenshotUrl: null,
      contactEmail: 'neal@nicec.net',
      browserInfo: 'Safari 17.5',
      deviceInfo: 'iPad Pro (iOS 17.5)',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Added to backlog.',
      createdAt: '2026-06-26 11:00:00',
      updatedAt: '2026-06-26 11:00:00',
      resolvedAt: null,
    },
    {
      id: 'fb_5',
      organizationId: 'org_nicec',
      userId: 'usr_2',
      warehouseId: 'Amazon FBA Transit Area',
      operationScope: 'Billing',
      type: 'Integration Issue',
      title: 'Carrier label generation failed',
      description: 'Failed to generate carrier labels for USPS Ground shipments. Error message: "API Authentication Error with USPS API".',
      relatedPage: '/outbound/orders',
      priority: 'Critical',
      status: 'New',
      screenshotUrl: null,
      contactEmail: 'operator@nicec.net',
      browserInfo: 'Chrome 126.0.0',
      deviceInfo: 'Ubuntu Linux',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Checking USPS credentials.',
      createdAt: '2026-06-30 09:00:00',
      updatedAt: '2026-06-30 09:00:00',
      resolvedAt: null,
    },
    {
      id: 'fb_6',
      organizationId: 'org_nicec',
      userId: 'usr_1',
      warehouseId: 'All Warehouses',
      operationScope: 'Inbound',
      type: 'Bug Report',
      title: 'Inbound ASN detail drawer layout broken',
      description: 'On smaller screens, the ASN detail drawer close button is hidden under the header and the items list overflow is broken.',
      relatedPage: '/inbound/manager',
      priority: 'Medium',
      status: 'Resolved',
      screenshotUrl: null,
      contactEmail: 'neal@nicec.net',
      browserInfo: 'Chrome 126.0.0',
      deviceInfo: 'MacBook Air',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Fixed CSS class overflow-y-auto.',
      createdAt: '2026-06-25 15:20:00',
      updatedAt: '2026-06-25 15:20:00',
      resolvedAt: '2026-06-25 17:00:00',
    },
    {
      id: 'fb_7',
      organizationId: 'org_nicec',
      userId: 'usr_1',
      warehouseId: 'All Warehouses',
      operationScope: 'Inbound',
      type: 'Feature Request',
      title: 'Add Slack notification for delayed inbound shipments',
      description: "It would be great if the system sends a Slack alert when an ASN status is 'Delayed' for more than 4 hours.",
      relatedPage: '/inbound/delay',
      priority: 'Medium',
      status: 'Planned',
      screenshotUrl: null,
      contactEmail: 'neal@nicec.net',
      browserInfo: 'Chrome 126.0.0',
      deviceInfo: 'Dell XPS (Windows 11)',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Need to check Slack webhook integration.',
      createdAt: '2026-06-24 16:00:00',
      updatedAt: '2026-06-24 16:00:00',
      resolvedAt: null,
    },
    {
      id: 'fb_8',
      organizationId: 'org_nicec',
      userId: 'usr_1',
      warehouseId: 'Ontario Warehouse',
      operationScope: 'Billing',
      type: 'Data Issue',
      title: 'Storage fee calculation looks incorrect for customer NiceC',
      description: 'Storage fee computed for June is $1450, but based on cubic volume calculation it should be $1230.',
      relatedPage: '/billing/fees',
      priority: 'High',
      status: 'In Review',
      screenshotUrl: null,
      contactEmail: 'neal@nicec.net',
      browserInfo: 'Firefox 127.0',
      deviceInfo: 'MacBook Pro',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: 'Reviewing volume calculation logic in Billing module.',
      createdAt: '2026-06-23 11:10:00',
      updatedAt: '2026-06-23 11:10:00',
      resolvedAt: null,
    }
  ];

  const mockComments: FeedbackComment[] = [
    {
      id: 'fbc_1',
      feedbackId: 'fb_1',
      userId: 'usr_admin',
      username: 'admin@nicec.net',
      comment: 'We will look into this in the next sprint.',
      isInternal: true,
      createdAt: '2026-06-28 11:00:00'
    }
  ];

  state.feedbacks = mockFeedbacks;
  state.feedbackComments = mockComments;
  console.log('Successfully seeded 8 WMS feedback records!');
}
