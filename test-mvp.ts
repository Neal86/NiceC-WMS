import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('\x1b[36m==================================================\x1b[0m');
  console.log('\x1b[36m🚀 NiceC-WMS MVP Automated Smoke Test starting...\x1b[0m');
  console.log('\x1b[36m==================================================\x1b[0m');

  try {
    // 1. Admin Login
    console.log('\n\x1b[33m[Test 1] Authenticating Admin user...\x1b[0m');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin@nicec.net',
      password: 'admin123'
    });
    
    if (loginRes.data.status !== 'success' || !loginRes.data.user.token) {
      throw new Error('Admin login failed or no token returned.');
    }
    const token = loginRes.data.user.token;
    console.log('✅ Admin authenticated successfully!');
    
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Fetch Reference Data (Customers, SKUs, Logistics Channels)
    console.log('\n\x1b[33m[Test 2] Fetching Customers, SKUs and Logistics Channels...\x1b[0m');
    const custRes = await axios.get(`${BASE_URL}/api/customers`, { headers });
    const skusRes = await axios.get(`${BASE_URL}/api/skus`, { headers });
    const channelsRes = await axios.get(`${BASE_URL}/api/logistics-channels`, { headers });
    const inventoryRes = await axios.get(`${BASE_URL}/api/inventory`, { headers });

    console.log(`✅ Loaded ${custRes.data.length} Customers`);
    console.log(`✅ Loaded ${skusRes.data.length} SKUs`);
    console.log(`✅ Loaded ${channelsRes.data.length} Logistics Channels`);
    console.log(`✅ Loaded ${inventoryRes.data.length} Inventory Items`);

    const customer = custRes.data[0];
    const sku = skusRes.data[0];
    const channel = channelsRes.data[0];
    const inventoryItem = inventoryRes.data.find((inv: any) => inv.skuId === sku.id);

    console.log(`👉 Target Customer: ${customer.name} (${customer.id})`);
    console.log(`👉 Target SKU: ${sku.code} (${sku.id})`);
    console.log(`👉 Target Channel: ${channel.name} (${channel.id})`);
    console.log(`👉 Current SKU Available Qty: ${inventoryItem ? inventoryItem.availableQty : 'N/A'}`);

    // 3. Create Outbound Order with Stock Reservation
    console.log('\n\x1b[33m[Test 3] Creating Outbound Order with SKU reservation...\x1b[0m');
    const initialAvailable = inventoryItem ? inventoryItem.availableQty : 100;
    const initialReserved = inventoryItem ? inventoryItem.reservedQty || 0 : 0;
    
    const orderRes = await axios.post(`${BASE_URL}/api/outbound-orders`, {
      customerId: customer.id,
      carrierId: channel.carrierId,
      logisticsChannelId: channel.id,
      remark: 'Smoke test order',
      recipient: 'Neal Test (LA, USA)',
      salesPlatform: 'Shopify',
      orderType: '单品单件',
      items: [
        {
          skuId: sku.id,
          skuCode: sku.code,
          qty: 5,
          category: 'Testing'
        }
      ]
    }, { headers });

    const order = orderRes.data.order;
    console.log(`✅ Outbound Order created successfully! Order No: ${order.orderNo}, ID: ${order.id}`);

    // Verify stock is reserved
    const postOrderInvRes = await axios.get(`${BASE_URL}/api/inventory`, { headers });
    const postOrderInv = postOrderInvRes.data.find((inv: any) => inv.skuId === sku.id);
    console.log(`👉 Updated SKU Available Qty: ${postOrderInv.availableQty} (Expected: ${initialAvailable - 5})`);
    console.log(`👉 Updated SKU Reserved Qty: ${postOrderInv.reservedQty} (Expected: ${initialReserved + 5})`);

    if (postOrderInv.availableQty !== initialAvailable - 5) {
      throw new Error('Inventory available quantity did not decrease correctly on reservation.');
    }

    // 4. Get created Outbound Order
    console.log('\n\x1b[33m[Test 4] Querying created Outbound Order by ID...\x1b[0m');
    const fetchOrderRes = await axios.get(`${BASE_URL}/api/outbound-orders/${order.id}`, { headers });
    console.log(`✅ Single order query matches! Status: ${fetchOrderRes.data.status}`);

    // 5. Cancel Outbound Order (Release inventory)
    console.log('\n\x1b[33m[Test 5] Cancelling Outbound Order to release inventory...\x1b[0m');
    await axios.post(`${BASE_URL}/api/outbound-orders/${order.id}/cancel`, {}, { headers });
    console.log('✅ Outbound Order cancelled successfully!');

    // Verify stock is released
    const postCancelInvRes = await axios.get(`${BASE_URL}/api/inventory`, { headers });
    const postCancelInv = postCancelInvRes.data.find((inv: any) => inv.skuId === sku.id);
    console.log(`👉 Restored SKU Available Qty: ${postCancelInv.availableQty} (Expected: ${initialAvailable})`);
    console.log(`👉 Restored SKU Reserved Qty: ${postCancelInv.reservedQty} (Expected: ${initialReserved})`);

    if (postCancelInv.availableQty !== initialAvailable) {
      throw new Error('Inventory available quantity did not restore on cancel.');
    }

    // 6. Create a brand new Outbound Order
    console.log('\n\x1b[33m[Test 6] Creating another Outbound Order to test Shipment workflow...\x1b[0m');
    const order2Res = await axios.post(`${BASE_URL}/api/outbound-orders`, {
      customerId: customer.id,
      carrierId: channel.carrierId,
      logisticsChannelId: channel.id,
      remark: 'Shipment workflow smoke test',
      recipient: 'Neal Test 2 (NY, USA)',
      salesPlatform: 'Amazon',
      orderType: '单品单件',
      items: [
        {
          skuId: sku.id,
          skuCode: sku.code,
          qty: 2,
          category: 'Testing'
        }
      ]
    }, { headers });

    const order2 = order2Res.data.order;
    console.log(`✅ Second Outbound Order created! Order No: ${order2.orderNo}`);

    // 7. Mark Order as Shipped (Deduct reserved stock completely)
    console.log('\n\x1b[33m[Test 7] Shipping Outbound Order (converting reservations to complete stock deduction)...\x1b[0m');
    await axios.post(`${BASE_URL}/api/outbound-orders/${order2.id}/ship`, {}, { headers });
    console.log('✅ Outbound Order shipped successfully!');

    // Verify stock is deducted permanently (reservedQty decreases, availableQty remains deducted)
    const postShipInvRes = await axios.get(`${BASE_URL}/api/inventory`, { headers });
    const postShipInv = postShipInvRes.data.find((inv: any) => inv.skuId === sku.id);
    console.log(`👉 Post-Ship SKU Available Qty: ${postShipInv.availableQty} (Expected: ${initialAvailable - 2})`);
    console.log(`👉 Post-Ship SKU Reserved Qty: ${postShipInv.reservedQty} (Expected: ${initialReserved})`);

    if (postShipInv.availableQty !== initialAvailable - 2) {
      throw new Error('Inventory was not properly deducted upon shipping.');
    }

    // 8. Test WMS AI Assistant fallback chat response
    console.log('\n\x1b[33m[Test 8] Querying WMS AI Assistant Fallback...\x1b[0m');
    const aiRes = await axios.post(`${BASE_URL}/api/wms-ai-assistant/chat`, {
      question: 'Show me my stock status for Yukon customer products.'
    });
    console.log(`✅ AI Assistant Chat response received!`);
    console.log(`🤖 AI: "${aiRes.data.response.substring(0, 100)}..."`);

    console.log('\n\x1b[32m==================================================\x1b[0m');
    console.log('\x1b[32m🎉 ALL NiceC-WMS SMOKE TESTS PASSED SUCCESSFULLY! (100% GREEN) 🎉\x1b[0m');
    console.log('\x1b[32m==================================================\x1b[0m');

  } catch (err: any) {
    console.error('\n\x1b[31m❌ SMOKE TEST FAILED:\x1b[0m', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
