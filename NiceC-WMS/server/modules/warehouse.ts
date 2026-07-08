/**
 * Warehouse Module — Warehouse-scoped access control and operations
 *
 * Rules:
 *   1. Warehouse Operator / Warehouse Manager → only `user.warehouseId`
 *   2. Admin / Super Admin → all warehouses
 *   3. Client → no warehouse access
 */

// ──────────────────────────────────────────────
// Build a Prisma `where` clause scoped to the user's warehouse
// ──────────────────────────────────────────────

export function buildWarehouseScopedWhere(user: any, baseWhere: Record<string, any> = {}): Record<string, any> {
  const role = (user?.role || '').toUpperCase();

  // Admin / Super Admin see everything
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return { ...baseWhere };
  }

  // Client has no warehouse access
  if (role === 'CLIENT') {
    return { ...baseWhere, id: '__NONE__' }; // return empty set
  }

  // Warehouse Operator / Warehouse Manager → scoped to their warehouse
  if (user?.warehouseId) {
    return { ...baseWhere, warehouseId: user.warehouseId };
  }

  // Fallback: no warehouse assigned → empty set
  return { ...baseWhere, id: '__NONE__' };
}

// ──────────────────────────────────────────────
// Assert the user can access the given warehouseId
// Throws if not allowed
// ──────────────────────────────────────────────

export function assertWarehouseAccess(user: any, warehouseId: string): void {
  const role = (user?.role || '').toUpperCase();

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return; // can access any warehouse
  }

  if (role === 'CLIENT') {
    throw new Error('CLIENT role does not have warehouse access');
  }

  if (user?.warehouseId && user.warehouseId !== warehouseId) {
    throw new Error(`Access denied: you do not have access to warehouse ${warehouseId}`);
  }

  if (!user?.warehouseId) {
    throw new Error('No warehouse assigned to your account');
  }
}

// ──────────────────────────────────────────────
// Express middleware: require warehouse access
// ──────────────────────────────────────────────

export function requireWarehouseAccess(req: any, res: any, next: any): void {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return next();
    }
    if (role === 'CLIENT') {
      return res.status(403).json({ error: 'CLIENT role does not have warehouse access' });
    }
    if (!req.user?.warehouseId) {
      return res.status(403).json({ error: 'No warehouse assigned to your account' });
    }
    next();
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
}

// ──────────────────────────────────────────────
// Resolve effective warehouseId from user + request body/param
// ──────────────────────────────────────────────

export function resolveWarehouseId(user: any, fallback?: string): string {
  const role = (user?.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return fallback || user?.warehouseId || 'wh_default';
  }
  if (user?.warehouseId) {
    return user.warehouseId;
  }
  return fallback || 'wh_default';
}
