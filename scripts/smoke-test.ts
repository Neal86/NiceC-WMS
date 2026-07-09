const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

type Json = Record<string, any>;

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { res, body };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function login(username: string, password: string) {
  const { res, body } = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  assert(res.ok, `Login failed for ${username}: ${res.status} ${JSON.stringify(body)}`);
  const token = body?.user?.token;
  assert(token, `Login response missing token for ${username}`);
  return { token, user: body.user };
}

async function authed(token: string, path: string, options: RequestInit = {}) {
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

function firstArrayPayload(body: any, keys: string[] = []) {
  if (Array.isArray(body)) return body;
  for (const key of keys) {
    if (Array.isArray(body?.[key])) return body[key];
  }
  return [];
}

async function main() {
  console.log(`Smoke test target: ${BASE_URL}`);

  const health = await request('/api/health');
  assert(health.res.ok, `GET /api/health failed: ${health.res.status}`);

  const dbHealth = await request('/api/health/db');
  assert(dbHealth.res.ok, `GET /api/health/db failed: ${dbHealth.res.status}`);
  console.log('Health checks passed:', health.body, dbHealth.body);

  const admin = await login('admin@nicecwms.com', 'admin123456').catch(async () => login('admin@nicec.net', 'admin123').catch(() => login('neal@nicec.net', 'admin123')));
  const client = await login('client@nicecwms.com', 'client123456').catch(async () => login('client@nicec.net', 'client123'));

  const wrong = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin@nicec.net', password: 'wrong-password' })
  });
  assert(wrong.res.status === 401, `Wrong password should return 401, got ${wrong.res.status}`);

  const unauthCustomers = await request('/api/customers');
  assert(unauthCustomers.res.status === 401, `Unauthenticated /api/customers should return 401, got ${unauthCustomers.res.status}`);

  const authMe = await authed(admin.token, '/api/auth/me');
  assert(authMe.res.ok, `GET /api/auth/me failed with valid token: ${authMe.res.status}`);

  const adminCustomers = await authed(admin.token, '/api/customers');
  assert(adminCustomers.res.ok, `Admin customers failed: ${adminCustomers.res.status} ${JSON.stringify(adminCustomers.body)}`);
  const customers = firstArrayPayload(adminCustomers.body, ['customers']);
  assert(customers.length > 0, 'Admin customers response should contain at least one customer');

  const clientCustomers = await authed(client.token, '/api/customers');
  assert(clientCustomers.res.ok, `Client customers failed: ${clientCustomers.res.status} ${JSON.stringify(clientCustomers.body)}`);
  const clientCustomerRows = firstArrayPayload(clientCustomers.body, ['customers']);
  assert(clientCustomerRows.length > 0, 'Client customers response should contain the client customer');
  if (client.user?.customerId) {
    assert(clientCustomerRows.every((c: Json) => c.id === client.user.customerId), 'Client customer isolation failed');
  }

  const adminInventory = await authed(admin.token, '/api/inventory');
  assert(adminInventory.res.ok, `Admin inventory failed: ${adminInventory.res.status}`);

  const clientInventory = await authed(client.token, '/api/inventory');
  assert(clientInventory.res.ok, `Client inventory failed: ${clientInventory.res.status}`);
  const clientInventoryRows = firstArrayPayload(clientInventory.body, ['inventory', 'items']);
  if (client.user?.customerId) {
    assert(clientInventoryRows.every((i: Json) => !i.customerId || i.customerId === client.user.customerId), 'Client inventory isolation failed');
  }

  const clientWave = await authed(client.token, '/api/outbound-orders/batch-generate-wave', {
    method: 'POST',
    body: JSON.stringify({ orderIds: ['smoke_nonexistent_order'] })
  });
  assert([400, 403].includes(clientWave.res.status), `Client wave generation should be blocked, got ${clientWave.res.status}`);

  const clientShip = await authed(client.token, '/api/outbound-orders/smoke_nonexistent_order/ship', { method: 'POST' });
  assert([400, 403, 404].includes(clientShip.res.status), `Client ship should be blocked or not found, got ${clientShip.res.status}`);

  const ai = await authed(admin.token, '/api/wms-ai-assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Give me a WMS status summary' })
  });
  assert(ai.res.ok, `AI assistant mock fallback failed: ${ai.res.status} ${JSON.stringify(ai.body)}`);

  console.log('Smoke test passed. Core auth, health, tenant isolation, RBAC guardrails, and mock fallback endpoints are responding.');
}

main().catch((error) => {
  console.error('\nSmoke test failed.');
  console.error(error?.stack || error?.message || error);
  console.error('\nMake sure the server is running first: npm run dev or npm run start');
  process.exit(1);
});
