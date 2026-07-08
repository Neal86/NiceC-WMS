export type Permission =
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete'
  | 'customers:read' | 'customers:create' | 'customers:update' | 'customers:delete'
  | 'warehouses:read' | 'warehouses:create' | 'warehouses:update' | 'warehouses:delete'
  | 'skus:read' | 'skus:create' | 'skus:update' | 'skus:delete'
  | 'inventory:read' | 'inventory:update' | 'inventory:adjust' | 'inventory:transfer'
  | 'inbound:read' | 'inbound:create' | 'inbound:update' | 'inbound:receive' | 'inbound:putaway'
  | 'outbound:read' | 'outbound:create' | 'outbound:update' | 'outbound:delete' | 'outbound:ship' | 'outbound:import'
  | 'returns:read' | 'returns:create' | 'returns:update' | 'returns:receive' | 'returns:inspect' | 'returns:restock'
  | 'billing:read' | 'billing:create' | 'billing:update' | 'billing:delete' | 'billing:generate'
  | 'apikeys:read' | 'apikeys:create' | 'apikeys:update' | 'apikeys:delete'
  | 'webhooks:read' | 'webhooks:create' | 'webhooks:update' | 'webhooks:delete'
  | 'stores:read' | 'stores:create' | 'stores:update' | 'stores:delete' | 'stores:sync'
  | 'feedback:read' | 'feedback:create' | 'feedback:update' | 'feedback:delete'
  | 'audit:read'
  | 'system:read' | 'system:update'
  | 'waves:read' | 'waves:create' | 'waves:update' | 'waves:delete'
  | 'locations:read' | 'locations:create' | 'locations:update' | 'locations:delete'
  | 'carriers:read' | 'carriers:create' | 'carriers:update' | 'carriers:delete'
  | 'channels:read' | 'channels:create' | 'channels:update' | 'channels:delete'
  | 'products:read' | 'products:create' | 'products:update' | 'products:delete'
  | 'packages:read' | 'packages:create' | 'packages:update'
  | 'exceptions:read' | 'exceptions:create' | 'exceptions:update' | 'exceptions:resolve'
  | 'picking:read' | 'picking:create' | 'picking:complete'
  | 'review:read' | 'review:complete'
  | 'reports:read' | 'reports:create'
  | 'dashboard:read';

export const RolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'customers:read', 'customers:create', 'customers:update', 'customers:delete',
    'warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete',
    'skus:read', 'skus:create', 'skus:update', 'skus:delete',
    'inventory:read', 'inventory:update', 'inventory:adjust', 'inventory:transfer',
    'inbound:read', 'inbound:create', 'inbound:update', 'inbound:receive', 'inbound:putaway',
    'outbound:read', 'outbound:create', 'outbound:update', 'outbound:delete', 'outbound:ship', 'outbound:import',
    'returns:read', 'returns:create', 'returns:update', 'returns:receive', 'returns:inspect', 'returns:restock',
    'billing:read', 'billing:create', 'billing:update', 'billing:delete', 'billing:generate',
    'apikeys:read', 'apikeys:create', 'apikeys:update', 'apikeys:delete',
    'webhooks:read', 'webhooks:create', 'webhooks:update', 'webhooks:delete',
    'stores:read', 'stores:create', 'stores:update', 'stores:delete', 'stores:sync',
    'feedback:read', 'feedback:create', 'feedback:update', 'feedback:delete',
    'audit:read',
    'system:read', 'system:update',
    'waves:read', 'waves:create', 'waves:update', 'waves:delete',
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'carriers:read', 'carriers:create', 'carriers:update', 'carriers:delete',
    'channels:read', 'channels:create', 'channels:update', 'channels:delete',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'packages:read', 'packages:create', 'packages:update',
    'exceptions:read', 'exceptions:create', 'exceptions:update', 'exceptions:resolve',
    'picking:read', 'picking:create', 'picking:complete',
    'review:read', 'review:complete',
    'reports:read', 'reports:create',
    'dashboard:read',
  ],
  ADMIN: [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'customers:read', 'customers:create', 'customers:update', 'customers:delete',
    'warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete',
    'skus:read', 'skus:create', 'skus:update', 'skus:delete',
    'inventory:read', 'inventory:update', 'inventory:adjust', 'inventory:transfer',
    'inbound:read', 'inbound:create', 'inbound:update', 'inbound:receive', 'inbound:putaway',
    'outbound:read', 'outbound:create', 'outbound:update', 'outbound:delete', 'outbound:ship', 'outbound:import',
    'returns:read', 'returns:create', 'returns:update', 'returns:receive', 'returns:inspect', 'returns:restock',
    'billing:read', 'billing:create', 'billing:update', 'billing:delete', 'billing:generate',
    'apikeys:read', 'apikeys:create', 'apikeys:update', 'apikeys:delete',
    'webhooks:read', 'webhooks:create', 'webhooks:update', 'webhooks:delete',
    'stores:read', 'stores:create', 'stores:update', 'stores:delete', 'stores:sync',
    'feedback:read', 'feedback:create', 'feedback:update', 'feedback:delete',
    'audit:read',
    'system:read', 'system:update',
    'waves:read', 'waves:create', 'waves:update', 'waves:delete',
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'carriers:read', 'carriers:create', 'carriers:update', 'carriers:delete',
    'channels:read', 'channels:create', 'channels:update', 'channels:delete',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'packages:read', 'packages:create', 'packages:update',
    'exceptions:read', 'exceptions:create', 'exceptions:update', 'exceptions:resolve',
    'picking:read', 'picking:create', 'picking:complete',
    'review:read', 'review:complete',
    'reports:read', 'reports:create',
    'dashboard:read',
  ],
  WAREHOUSE_MANAGER: [
    'warehouses:read',
    'skus:read',
    'inventory:read', 'inventory:update', 'inventory:adjust', 'inventory:transfer',
    'inbound:read', 'inbound:create', 'inbound:receive', 'inbound:putaway',
    'outbound:read', 'outbound:update', 'outbound:ship',
    'returns:read', 'returns:receive', 'returns:inspect', 'returns:restock',
    'feedback:read', 'feedback:create',
    'waves:read', 'waves:create', 'waves:update',
    'locations:read', 'locations:create',
    'carriers:read',
    'channels:read',
    'products:read',
    'packages:read', 'packages:create', 'packages:update',
    'exceptions:read', 'exceptions:create', 'exceptions:update', 'exceptions:resolve',
    'picking:read', 'picking:create', 'picking:complete',
    'review:read', 'review:complete',
    'reports:read',
    'dashboard:read',
  ],
  WAREHOUSE_OPERATOR: [
    'warehouses:read',
    'skus:read',
    'inventory:read', 'inventory:adjust',
    'inbound:read', 'inbound:receive', 'inbound:putaway',
    'outbound:read', 'outbound:update', 'outbound:ship',
    'returns:read', 'returns:receive', 'returns:inspect', 'returns:restock',
    'feedback:read', 'feedback:create',
    'waves:read',
    'locations:read',
    'carriers:read',
    'channels:read',
    'products:read',
    'packages:read', 'packages:create', 'packages:update',
    'exceptions:read', 'exceptions:create', 'exceptions:update', 'exceptions:resolve',
    'picking:read', 'picking:create', 'picking:complete',
    'review:read', 'review:complete',
    'dashboard:read',
  ],
  CLIENT: [
    'skus:read', 'skus:create', 'skus:update', 'skus:delete',
    'inventory:read',
    'inbound:read', 'inbound:create',
    'outbound:read', 'outbound:create', 'outbound:update', 'outbound:delete', 'outbound:import',
    'returns:read', 'returns:create',
    'billing:read',
    'apikeys:read', 'apikeys:create', 'apikeys:update', 'apikeys:delete',
    'webhooks:read', 'webhooks:create', 'webhooks:update', 'webhooks:delete',
    'stores:read', 'stores:create', 'stores:update', 'stores:delete', 'stores:sync',
    'feedback:read', 'feedback:create',
    'customers:read',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'packages:read',
    'reports:read',
    'dashboard:read',
  ],
};

export function normalizeRole(role: string): string {
  const r = (role || '').toUpperCase();
  if (r === 'ADMIN' || r === 'SUPER_ADMIN') return r;
  if (r === 'WAREHOUSE_MANAGER' || r === 'MANAGER') return 'WAREHOUSE_MANAGER';
  if (r === 'WAREHOUSE_OPERATOR' || r === 'OPERATOR') return 'WAREHOUSE_OPERATOR';
  if (r === 'CLIENT' || r === 'CUSTOMER') return 'CLIENT';
  return 'WAREHOUSE_OPERATOR';
}

export function hasPermission(role: string, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  const perms = RolePermissions[normalized];
  if (!perms) return false;
  return perms.includes(permission);
}

export function requirePermission(...permissions: Permission[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Please login first.' } });
    }
    const role = req.user.role || '';
    for (const perm of permissions) {
      if (hasPermission(role, perm)) {
        return next();
      }
    }
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Role '${role}' does not have required permission. Required: ${permissions.join(', ')}`
      }
    });
  };
}
