import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Clear existing data in correct dependency order
  await prisma.feedbackComment.deleteMany().catch(() => {});
  await prisma.feedback.deleteMany().catch(() => {});
  await prisma.inventoryReservation.deleteMany().catch(() => {});
  await prisma.inventoryTransaction.deleteMany().catch(() => {});
  await prisma.inventory.deleteMany().catch(() => {});
  await prisma.outboundOrderItem.deleteMany().catch(() => {});
  await prisma.shipment.deleteMany().catch(() => {});
  await prisma.outboundOrder.deleteMany().catch(() => {});
  await prisma.wave.deleteMany().catch(() => {});
  await prisma.sKU.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.logisticsChannel.deleteMany().catch(() => {});
  await prisma.carrier.deleteMany().catch(() => {});
  await prisma.warehouse.deleteMany().catch(() => {});

  // 2. Warehouses
  const wh1 = await prisma.warehouse.create({
    data: {
      id: 'wh_1',
      name: 'NC - NO.1仓 - 92503',
      code: '92503',
      address: 'North Carolina, USA',
    },
  });

  const wh2 = await prisma.warehouse.create({
    data: {
      id: 'wh_2',
      name: 'NJ - NO.2仓 - 08817',
      code: '08817',
      address: 'New Jersey, USA',
    },
  });

  // 3. Customers
  const cust1 = await prisma.customer.create({
    data: { id: 'cust_1', name: 'Yukon', code: 'Yukon(1108037)', contact: 'John Yukon', email: 'john@yukon.com' },
  });
  const cust2 = await prisma.customer.create({
    data: { id: 'cust_2', name: 'Tochtech', code: 'Tochtech(1108045)', contact: 'Terry Toch', email: 'terry@tochtech.com' },
  });
  const cust3 = await prisma.customer.create({
    data: { id: 'cust_3', name: 'Zonestar', code: 'Zonestar(1108099)', contact: 'Zara Lin', email: 'zara@zonestar.com' },
  });
  const cust4 = await prisma.customer.create({
    data: { id: 'cust_4', name: 'ApexLogistics', code: 'Apex(1108210)', contact: 'Alex Apex', email: 'alex@apex.com' },
  });
  const cust5 = await prisma.customer.create({
    data: { id: 'cust_5', name: 'GlobalEcom', code: 'GlobalEcom(1108552)', contact: 'Gavin Glo', email: 'gavin@globalecom.com' },
  });

  const customers = [cust1, cust2, cust3, cust4, cust5];

  // 4. Users with hashed passwords
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const operatorHash = await bcrypt.hash('operator123', salt);
  const clientHash = await bcrypt.hash('client123', salt);

  await prisma.user.createMany({
    data: [
      {
        id: 'usr_admin',
        username: 'admin@nicec.net',
        email: 'admin@nicec.net',
        passwordHash: adminHash,
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
      },
      {
        id: 'usr_1',
        username: 'neal@nicec.net',
        email: 'neal@nicec.net',
        passwordHash: adminHash,
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      },
      {
        id: 'usr_2',
        username: 'operator',
        email: 'operator@nicec.net',
        passwordHash: operatorHash,
        role: 'WAREHOUSE_OPERATOR',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      },
      {
        id: 'usr_client',
        username: 'client@nicec.net',
        email: 'client@nicec.net',
        passwordHash: clientHash,
        role: 'CLIENT',
        customerId: 'cust_1',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
      },
    ],
  });

  // 5. Carriers
  const carrFedex = await prisma.carrier.create({ data: { id: 'carr_fedex', name: 'FEDEX', code: 'FEDEX' } });
  const carrUsps = await prisma.carrier.create({ data: { id: 'carr_usps', name: 'USPS', code: 'USPS' } });
  const carrUps = await prisma.carrier.create({ data: { id: 'carr_ups', name: 'UPS', code: 'UPS' } });
  const carrDhl = await prisma.carrier.create({ data: { id: 'carr_dhl', name: 'DHL', code: 'DHL' } });
  const carrAmz = await prisma.carrier.create({ data: { id: 'carr_amz', name: 'AMAZON', code: 'AMAZON' } });

  // 6. Logistics Channels
  await prisma.logisticsChannel.createMany({
    data: [
      { id: 'chan_fedex_home', name: 'FEDEX-HOME-DELIVERY(FHD_G)', code: 'FEDEX-HOME-DELIVERY', carrierId: 'carr_fedex' },
      { id: 'chan_usps_ground', name: 'USPS GROUND(USPS_G)', code: 'USPS_GROUND', carrierId: 'carr_usps' },
      { id: 'chan_ups_ground', name: 'UPS GROUND(UPS_G)', code: 'UPS_GROUND', carrierId: 'carr_ups' },
      { id: 'chan_dhl_express', name: 'DHL EXPRESS(DHL_EXP)', code: 'DHL_EXPRESS', carrierId: 'carr_dhl' },
      { id: 'chan_amz_ground', name: 'AMAZON SHIP(AMZ_S)', code: 'AMAZON_SHIP', carrierId: 'carr_amz' },
    ],
  });

  // 7. Products & SKUs
  const productSamples = [
    { name: '智能炉灶开关至重仓旋钮 Smart Stove Safety Knob Controller', cat: '智能家居', brand: 'SmartGuard' },
    { name: '05-23 Toyota Tacoma Double Cab 5ft Bed Running Boards Side Steps Nerf Bars Stainless Steel', cat: '汽车配件', brand: 'OasisAuto' },
    { name: '07-18 Jeep Wrangler JK 4 Door Tubular Side Steps Armor Off Road Rock Slider Steel Black', cat: '汽车配件', brand: 'OffroadX' },
    { name: '07-18 Chevy Silverado / GMC Sierra Side Step Bars', cat: '汽车配件', brand: 'RoughCountry' },
    { name: 'Heated Camping Chair USB Powered Portable Folding Outdoor', cat: '运动户外', brand: 'Kampa' },
  ];

  for (let i = 0; i < productSamples.length; i++) {
    const sample = productSamples[i];
    const customer = customers[i % customers.length];
    const pId = `prod_${i + 1}`;

    await prisma.product.create({
      data: {
        id: pId,
        name: sample.name,
        category: sample.cat,
        sku: `SKU-${1000 + i}`,
        barcode: `627843${100000 + i}`,
        customerId: customer.id,
      },
    });

    // Create a matching SKU
    let skuCode = `SKU-CODE-${i + 1}-1`;
    let barcode = `6278438334${i}1`;

    if (i === 0) {
      skuCode = 'TS-V-NA-4';
      barcode = '627843833475';
    } else if (i === 1) {
      skuCode = '289-TX-69';
      barcode = '289-TX-69';
    }

    await prisma.sKU.create({
      data: {
        id: `sku_${i + 1}`,
        code: skuCode,
        name: `${sample.name} - Version A`,
        barcode: barcode,
        weight: 2.5,
        customerId: customer.id,
      },
    });

    // 8. Create Inventory for each SKU
    await prisma.inventory.create({
      data: {
        id: `inv_${i + 1}`,
        customerId: customer.id,
        skuId: `sku_${i + 1}`,
        skuCode: skuCode,
        warehouseId: 'wh_1',
        availableQty: 100,
        reservedQty: 0,
        damagedQty: 0,
      },
    });
  }

  // 9. Waves
  const wave1 = await prisma.wave.create({
    data: {
      id: 'wave_1',
      waveNo: 'WV202606300001',
      status: 'PENDING',
      orderCount: 2,
    },
  });

  // 10. Outbound Orders & Outbound Order Items
  const o1Id = 'ord_spec_1';
  await prisma.outboundOrder.create({
    data: {
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
      orderType: '单品单件',
    },
  });

  await prisma.outboundOrderItem.create({
    data: {
      id: 'item_spec_1',
      orderId: o1Id,
      skuId: 'sku_1',
      skuCode: 'TS-V-NA-4',
      skuBarcode: '627843833475',
      qty: 1,
      productName: '智能炉灶开关至重仓旋钮 Smart Stove Safety Knob Controller',
      category: '智能家居',
    },
  });

  // Order 2
  const o2Id = 'ord_spec_2';
  await prisma.outboundOrder.create({
    data: {
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
      orderType: '单品多件',
    },
  });

  await prisma.outboundOrderItem.create({
    data: {
      id: 'item_spec_2',
      orderId: o2Id,
      skuId: 'sku_2',
      skuCode: '289-TX-69',
      skuBarcode: '289-TX-69',
      qty: 2,
      productName: '05-23 Toyota Tacoma Double Cab 5ft Bed Running Boards Side Steps Nerf Bars Stainless Steel',
      category: '汽车配件',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
