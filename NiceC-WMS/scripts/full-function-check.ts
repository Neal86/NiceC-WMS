const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

type Check = {
  name: string;
  method?: string;
  path: string;
  body?: unknown;
  requiresAuth?: boolean;
  okStatuses?: number[];
};

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

async function login(username: string, password: string) {
  const { res, body } = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  if (!res.ok || !body?.user?.token) {
    throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(body)}`);
  }

  return body.user.token as string;
}

async function runCheck(check: Check, token?: string) {
  const method = check.method || 'GET';
  const { res, body } = await request(check.path, {
    method,
    body: check.body === undefined ? undefined : JSON.stringify(check.body),
    headers: check.requiresAuth && token ? { Authorization: `Bearer ${token}` } : undefined
  });

  const okStatuses = check.okStatuses || [200, 201];
  const ok = okStatuses.includes(res.status);
  return {
    ...check,
    status: res.status,
    ok,
    response: typeof body === 'string' ? body.slice(0, 180) : JSON.stringify(body).slice(0, 180)
  };
}

async function main() {
  console.log(`Full function check target: ${BASE_URL}`);

  const token = await login('admin@nicec.net', 'admin123').catch(() => login('neal@nicec.net', 'admin123'));

  const checks: Check[] = [
    { name: 'Health', path: '/api/health' },
    { name: 'DB health / fallback mode', path: '/api/health/db' },
    { name: 'Customers list', path: '/api/customers', requiresAuth: true },
    { name: 'Carriers list', path: '/api/carriers', requiresAuth: true },
    { name: 'Logistics channels list', path: '/api/logistics-channels', requiresAuth: true },
    { name: 'Products list', path: '/api/products', requiresAuth: true },
    { name: 'SKUs list', path: '/api/skus', requiresAuth: true },
    { name: 'Warehouses list', path: '/api/warehouses', requiresAuth: true },
    { name: 'Inventory list', path: '/api/inventory', requiresAuth: true },
    { name: 'Outbound orders list', path: '/api/outbound-orders?tab=ALL&page=1&pageSize=5', requiresAuth: true },
    { name: 'Waves list', path: '/api/waves', requiresAuth: true },
    { name: 'Dashboard summary', path: '/api/dashboard/summary', requiresAuth: true },
    { name: 'Outbound trend', path: '/api/dashboard/outbound-trend', requiresAuth: true },
    { name: 'Channel distribution', path: '/api/dashboard/channel-distribution', requiresAuth: true },
    { name: 'Operation logs', path: '/api/operation-logs', requiresAuth: true },
    { name: 'AI assistant fallback', method: 'POST', path: '/api/wms-ai-assistant/chat', requiresAuth: true, body: { message: 'Summarize WMS health' } },
    { name: 'Feedback list', path: '/api/feedback', requiresAuth: true, okStatuses: [200, 201, 404] },
    { name: 'Users list', path: '/api/users', requiresAuth: true, okStatuses: [200, 201, 404] },
    { name: 'Billing rules list', path: '/api/billing-rules', requiresAuth: true, okStatuses: [200, 201, 404] }
  ];

  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check, token));
  }

  const failed = results.filter(r => !r.ok);
  const supported = results.filter(r => r.ok && r.status !== 404);
  const missing = results.filter(r => r.status === 404);

  console.table(results.map(r => ({
    name: r.name,
    method: r.method || 'GET',
    path: r.path,
    status: r.status,
    ok: r.ok
  })));

  console.log(`\nSupported endpoints: ${supported.length}/${results.length}`);
  if (missing.length) {
    console.log(`Missing optional endpoints that still need backend implementation: ${missing.map(r => r.path).join(', ')}`);
  }

  if (failed.length) {
    console.error('\nBlocking endpoint failures:');
    for (const item of failed) {
      console.error(`- ${item.name} ${item.method || 'GET'} ${item.path}: ${item.status} ${item.response}`);
    }
    process.exit(1);
  }

  console.log('\nFull function check completed. Core endpoints are reachable; optional 404 endpoints are listed above for completion.');
}

main().catch((error) => {
  console.error('\nFull function check failed.');
  console.error(error?.stack || error?.message || error);
  console.error('\nMake sure the server is running first: npm run dev or npm run start');
  process.exit(1);
});
