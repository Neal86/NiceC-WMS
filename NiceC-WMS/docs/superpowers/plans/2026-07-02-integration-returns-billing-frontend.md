# Integration, Returns & Billing Frontend Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new API method objects to `src/api.ts` and create 3 new client-side page components: IntegrationCenter, ReturnManager, BillingView.

**Architecture:** All API methods follow the existing pattern in `src/api.ts` (axios calls via `api` instance, returning `response.data`). Components follow the ClientPortal pattern: React functional components with TypeScript, Tailwind CSS dark theme (`bg-slate-950`, `border-slate-800`), lucide-react icons, loading/error/empty states, and client data isolation via `customerId` filtering. Components are default exports in subdirectories under `src/components/`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, lucide-react, axios (via existing `api` instance)

## Global Constraints

- Follow existing code patterns in `src/api.ts` and `src/components/ClientPortal.tsx`
- All components use TypeScript with explicit types
- All components use Tailwind CSS with the dark theme convention (`bg-slate-950`, `border-slate-800`, `text-slate-200`)
- Import icons from `lucide-react`
- Each component is a default export
- Client data isolation: filter by `currentUser.customerId`
- API calls go through existing `api` axios instance (baseURL: `/api`)

---

### Task 1: Add API Methods to src/api.ts

**Files:**
- Modify: `src/api.ts:275-282`

**Interfaces:**
- Consumes: existing `api` axios instance (line 5-10)
- Produces: 5 new exported API objects (`apiKeyApi`, `webhookApi`, `storeConnectionApi`, `returnApi`, `billingApi`)

- [ ] **Step 1: Add apiKeyApi, webhookApi, storeConnectionApi, returnApi, billingApi after logApi**

Insert the following after the `logApi` export (line 280) and before `export default api` (line 282):

```typescript
export const apiKeyApi = {
  getKeys: async () => {
    const response = await api.get('/api-keys');
    return response.data;
  },
  createKey: async (data: any) => {
    const response = await api.post('/api-keys', data);
    return response.data;
  },
  updateKey: async (id: string, data: any) => {
    const response = await api.put(`/api-keys/${id}`, data);
    return response.data;
  },
  deleteKey: async (id: string) => {
    const response = await api.delete(`/api-keys/${id}`);
    return response.data;
  },
  testKey: async (id: string) => {
    const response = await api.post(`/api-keys/${id}/test`);
    return response.data;
  },
};

export const webhookApi = {
  getWebhooks: async () => {
    const response = await api.get('/webhooks');
    return response.data;
  },
  createWebhook: async (data: any) => {
    const response = await api.post('/webhooks', data);
    return response.data;
  },
  updateWebhook: async (id: string, data: any) => {
    const response = await api.put(`/webhooks/${id}`, data);
    return response.data;
  },
  deleteWebhook: async (id: string) => {
    const response = await api.delete(`/webhooks/${id}`);
    return response.data;
  },
  testWebhook: async (id: string) => {
    const response = await api.post(`/webhooks/${id}/test`);
    return response.data;
  },
};

export const storeConnectionApi = {
  getConnections: async () => {
    const response = await api.get('/store-connections');
    return response.data;
  },
  createConnection: async (data: any) => {
    const response = await api.post('/store-connections', data);
    return response.data;
  },
  updateConnection: async (id: string, data: any) => {
    const response = await api.put(`/store-connections/${id}`, data);
    return response.data;
  },
  deleteConnection: async (id: string) => {
    const response = await api.delete(`/store-connections/${id}`);
    return response.data;
  },
  syncConnection: async (id: string) => {
    const response = await api.post(`/store-connections/${id}/sync`);
    return response.data;
  },
};

export const returnApi = {
  getReturns: async (params?: any) => {
    const response = await api.get('/returns', { params });
    return response.data;
  },
  createReturn: async (data: any) => {
    const response = await api.post('/returns', data);
    return response.data;
  },
  getReturnById: async (id: string) => {
    const response = await api.get(`/returns/${id}`);
    return response.data;
  },
  updateReturn: async (id: string, data: any) => {
    const response = await api.put(`/returns/${id}`, data);
    return response.data;
  },
  receiveReturn: async (id: string) => {
    const response = await api.post(`/returns/${id}/receive`);
    return response.data;
  },
  inspectReturn: async (id: string) => {
    const response = await api.post(`/returns/${id}/inspect`);
    return response.data;
  },
  restockReturn: async (id: string) => {
    const response = await api.post(`/returns/${id}/restock`);
    return response.data;
  },
};

export const billingApi = {
  getRules: async () => {
    const response = await api.get('/billing/rules');
    return response.data;
  },
  createRule: async (data: any) => {
    const response = await api.post('/billing/rules', data);
    return response.data;
  },
  updateRule: async (id: string, data: any) => {
    const response = await api.put(`/billing/rules/${id}`, data);
    return response.data;
  },
  deleteRule: async (id: string) => {
    const response = await api.delete(`/billing/rules/${id}`);
    return response.data;
  },
  getRecords: async () => {
    const response = await api.get('/billing/records');
    return response.data;
  },
  generateRecords: async () => {
    const response = await api.post('/billing/records/generate');
    return response.data;
  },
  getInvoices: async () => {
    const response = await api.get('/billing/invoices');
    return response.data;
  },
  generateInvoice: async () => {
    const response = await api.post('/billing/invoices/generate');
    return response.data;
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 2: Create IntegrationCenter.tsx

**Files:**
- Create: `src/components/integration/IntegrationCenter.tsx`

**Interfaces:**
- Consumes: `apiKeyApi`, `webhookApi`, `storeConnectionApi` from `../../api`
- Consumes: `currentUser` prop with `id`, `customerId`
- Produces: default export `IntegrationCenter`

- [ ] **Step 1: Create the integration directory and IntegrationCenter.tsx**

Create file `src/components/integration/IntegrationCenter.tsx` with the following complete content:

```tsx
import React, { useState, useEffect } from 'react';
import { 
  Key, Webhook, Store, FileText, Plus, Trash2, Copy, TestTube, 
  RefreshCw, ExternalLink, Check, X, Loader2, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { apiKeyApi, webhookApi, storeConnectionApi } from '../../api';

interface IntegrationCenterProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: string;
    customerId?: string;
  };
}

type Tab = 'apikeys' | 'webhooks' | 'connections' | 'docs';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  customerId: string;
  createdAt: string;
  lastUsedAt?: string;
  status: 'ACTIVE' | 'REVOKED';
}

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface StoreConnection {
  id: string;
  platform: string;
  storeName: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  lastSyncAt?: string;
  customerId: string;
}

const PLATFORMS = [
  { name: 'Amazon', icon: '🛒', color: 'from-orange-500 to-yellow-500' },
  { name: 'Shopify', icon: '🛍️', color: 'from-green-500 to-emerald-500' },
  { name: 'Walmart', icon: '🏪', color: 'from-blue-500 to-cyan-500' },
  { name: 'TikTok Shop', icon: '🎵', color: 'from-pink-500 to-rose-500' },
  { name: 'eBay', icon: '🏷️', color: 'from-red-500 to-orange-500' },
  { name: 'WooCommerce', icon: '🔌', color: 'from-purple-500 to-indigo-500' },
];

const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.shipped',
  'inventory.updated',
  'inbound.completed',
  'return.completed',
];

export default function IntegrationCenter({ currentUser }: IntegrationCenterProps) {
  const [activeTab, setActiveTab] = useState<Tab>('apikeys');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [connections, setConnections] = useState<StoreConnection[]>([]);

  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysRes, hooksRes, connsRes] = await Promise.allSettled([
        apiKeyApi.getKeys(),
        webhookApi.getWebhooks(),
        storeConnectionApi.getConnections(),
      ]);

      if (keysRes.status === 'fulfilled') {
        setApiKeys((keysRes.value || []).filter((k: ApiKey) => k.customerId === currentUser.customerId));
      }
      if (hooksRes.status === 'fulfilled') {
        setWebhooks((hooksRes.value || []).filter((h: WebhookItem) => h.customerId === currentUser.customerId));
      }
      if (connsRes.status === 'fulfilled') {
        setConnections((connsRes.value || []).filter((c: StoreConnection) => c.customerId === currentUser.customerId));
      }
    } catch (err) {
      setError('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    try {
      await apiKeyApi.createKey({ name: newKeyName, customerId: currentUser.customerId });
      showToast('API Key created successfully');
      setShowCreateKeyModal(false);
      setNewKeyName('');
      loadData();
    } catch (err) {
      showToast('Failed to create API Key', 'error');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API Key?')) return;
    try {
      await apiKeyApi.deleteKey(id);
      showToast('API Key revoked');
      loadData();
    } catch (err) {
      showToast('Failed to revoke API Key', 'error');
    }
  };

  const handleTestKey = async (id: string) => {
    try {
      await apiKeyApi.testKey(id);
      showToast('API Key test passed');
    } catch (err) {
      showToast('API Key test failed', 'error');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    showToast('Key copied to clipboard');
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl || newWebhookEvents.length === 0) return;
    try {
      await webhookApi.createWebhook({
        url: newWebhookUrl,
        events: newWebhookEvents,
        customerId: currentUser.customerId,
      });
      showToast('Webhook created successfully');
      setShowCreateWebhookModal(false);
      setNewWebhookUrl('');
      setNewWebhookEvents([]);
      loadData();
    } catch (err) {
      showToast('Failed to create Webhook', 'error');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Webhook?')) return;
    try {
      await webhookApi.deleteWebhook(id);
      showToast('Webhook deleted');
      loadData();
    } catch (err) {
      showToast('Failed to delete Webhook', 'error');
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      await webhookApi.testWebhook(id);
      showToast('Webhook test ping sent');
    } catch (err) {
      showToast('Webhook test failed', 'error');
    }
  };

  const handleSyncConnection = async (id: string) => {
    try {
      await storeConnectionApi.syncConnection(id);
      showToast('Sync initiated successfully');
      loadData();
    } catch (err) {
      showToast('Sync failed', 'error');
    }
  };

  const handleToggleConnection = async (conn: StoreConnection) => {
    try {
      if (conn.status === 'CONNECTED') {
        await storeConnectionApi.deleteConnection(conn.id);
        showToast('Disconnected from ' + conn.platform);
      } else {
        await storeConnectionApi.createConnection({
          platform: conn.platform,
          storeName: conn.storeName,
          customerId: currentUser.customerId,
        });
        showToast('Connected to ' + conn.platform);
      }
      loadData();
    } catch (err) {
      showToast('Connection toggle failed', 'error');
    }
  };

  const tabs = [
    { key: 'apikeys' as Tab, label: 'API Keys', icon: Key },
    { key: 'webhooks' as Tab, label: 'Webhooks', icon: Webhook },
    { key: 'connections' as Tab, label: 'Store Connections', icon: Store },
    { key: 'docs' as Tab, label: 'API Docs', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono tracking-widest uppercase">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-red-400">
          <AlertCircle className="w-8 h-8" />
          <p className="text-xs font-semibold">{error}</p>
          <button onClick={loadData} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs cursor-pointer">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
            toast.type === 'error' ? 'bg-red-950 border-red-800 text-red-400' :
            'bg-blue-950 border-blue-800 text-blue-400'
          }`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Tab Header */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center gap-4 text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 px-2 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'apikeys' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">API Keys</h3>
                <p className="text-xs text-slate-400 mt-1">Manage programmatic access keys for your merchant account.</p>
              </div>
              <button
                onClick={() => setShowCreateKeyModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create API Key</span>
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Key className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <p className="text-xs">No API keys created yet.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Key</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="text-slate-300 hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-semibold">{k.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{k.key.substring(0, 20)}...</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            k.status === 'ACTIVE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/80 text-red-400 border border-red-800/40'
                          }`}>
                            {k.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{k.createdAt}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleCopyKey(k.key)} className="p-1.5 hover:bg-slate-800 rounded cursor-pointer" title="Copy">
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={() => handleTestKey(k.id)} className="p-1.5 hover:bg-slate-800 rounded cursor-pointer" title="Test">
                              <TestTube className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={() => handleDeleteKey(k.id)} className="p-1.5 hover:bg-red-950 rounded cursor-pointer" title="Revoke">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Webhooks</h3>
                <p className="text-xs text-slate-400 mt-1">Configure HTTP callbacks for real-time event notifications.</p>
              </div>
              <button
                onClick={() => setShowCreateWebhookModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Webhook</span>
              </button>
            </div>

            {webhooks.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Webhook className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <p className="text-xs">No webhooks configured yet.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Endpoint URL</th>
                      <th className="py-3 px-4">Events</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {webhooks.map((h) => (
                      <tr key={h.id} className="text-slate-300 hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-mono text-blue-400 max-w-[300px] truncate">{h.url}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {h.events.map((e) => (
                              <span key={e} className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">
                                {e}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'ACTIVE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' : 'bg-slate-900 text-slate-400 border border-slate-800/40'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleTestWebhook(h.id)} className="p-1.5 hover:bg-slate-800 rounded cursor-pointer" title="Test">
                              <TestTube className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={() => handleDeleteWebhook(h.id)} className="p-1.5 hover:bg-red-950 rounded cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Store Connections</h3>
              <p className="text-xs text-slate-400 mt-1">Connect and sync your e-commerce platforms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLATFORMS.map((platform) => {
                const conn = connections.find(c => c.platform === platform.name);
                const isConnected = conn?.status === 'CONNECTED';
                return (
                  <div key={platform.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-lg`}>
                        {platform.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{platform.name}</h4>
                        <p className="text-[10px] text-slate-500">{conn?.storeName || 'Not connected'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {isConnected ? (
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span className={`text-[10px] font-semibold ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {conn?.status || 'Disconnected'}
                      </span>
                      {conn?.lastSyncAt && (
                        <span className="text-[10px] text-slate-600 ml-auto">Last sync: {conn.lastSyncAt}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleConnection(conn || { id: '', platform: platform.name, storeName: '', status: 'DISCONNECTED', customerId: currentUser.customerId || '' })}
                        className={`flex-1 px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                          isConnected
                            ? 'bg-red-950/50 hover:bg-red-950 text-red-400 border border-red-900/40'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                      {isConnected && (
                        <button
                          onClick={() => handleSyncConnection(conn!.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Sync
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">API Documentation</h3>
              <p className="text-xs text-slate-400 mt-1">Reference documentation for the NiceC WMS REST API.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-slate-200 mb-2">API Reference (Coming Soon)</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Full OpenAPI/Swagger documentation for REST endpoints, authentication, and webhook payloads will be available here.
              </p>
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open API Docs
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">Create New API Key</h4>
              <button onClick={() => setShowCreateKeyModal(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Integration"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button onClick={() => setShowCreateKeyModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded text-slate-400 cursor-pointer">Cancel</button>
              <button onClick={handleCreateKey} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateWebhookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">Create New Webhook</h4>
              <button onClick={() => setShowCreateWebhookModal(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">Endpoint URL</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">Subscribe to Events</label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhookEvents(prev => [...prev, event]);
                          } else {
                            setNewWebhookEvents(prev => prev.filter(ev => ev !== event));
                          }
                        }}
                        className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-300 font-mono">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button onClick={() => setShowCreateWebhookModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded text-slate-400 cursor-pointer">Cancel</button>
              <button onClick={handleCreateWebhook} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 3: Create ReturnManager.tsx

**Files:**
- Create: `src/components/returns/ReturnManager.tsx`

**Interfaces:**
- Consumes: `returnApi` from `../../api`
- Consumes: `currentUser` prop with `id`, `customerId`
- Produces: default export `ReturnManager`

- [ ] **Step 1: Create the returns directory and ReturnManager.tsx**

Create file `src/components/returns/ReturnManager.tsx` with the following complete content:

```tsx
import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Plus, Search, Loader2, AlertCircle, Check, 
  ChevronDown, Package, Eye
} from 'lucide-react';
import { returnApi } from '../../api';

interface ReturnManagerProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: string;
    customerId?: string;
  };
}

type ReturnStatus = 'pending' | 'received' | 'inspected' | 'restocked' | 'damaged' | 'relabel_required' | 'completed';

interface ReturnOrder {
  id: string;
  returnNo: string;
  orderNo: string;
  skuCode: string;
  skuName: string;
  quantity: number;
  reason: string;
  status: ReturnStatus;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-950/80 border-yellow-800/40' },
  received: { label: 'Received', color: 'text-blue-400', bg: 'bg-blue-950/80 border-blue-800/40' },
  inspected: { label: 'Inspected', color: 'text-purple-400', bg: 'bg-purple-950/80 border-purple-800/40' },
  restocked: { label: 'Restocked', color: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-800/40' },
  damaged: { label: 'Damaged', color: 'text-red-400', bg: 'bg-red-950/80 border-red-800/40' },
  relabel_required: { label: 'Relabel Required', color: 'text-orange-400', bg: 'bg-orange-950/80 border-orange-800/40' },
  completed: { label: 'Completed', color: 'text-slate-400', bg: 'bg-slate-900 border-slate-800/40' },
};

export default function ReturnManager({ currentUser }: ReturnManagerProps) {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [newReturn, setNewReturn] = useState({
    orderNo: '',
    skuCode: '',
    quantity: 1,
    reason: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await returnApi.getReturns();
      setReturns((data || []).filter((r: ReturnOrder) => r.customerId === currentUser.customerId));
    } catch (err) {
      setError('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!newReturn.orderNo || !newReturn.skuCode || !newReturn.reason) return;
    try {
      await returnApi.createReturn({
        ...newReturn,
        customerId: currentUser.customerId,
      });
      showToast('Return created successfully');
      setShowCreateModal(false);
      setNewReturn({ orderNo: '', skuCode: '', quantity: 1, reason: '' });
      loadReturns();
    } catch (err) {
      showToast('Failed to create return', 'error');
    }
  };

  const handleStatusAction = async (id: string, action: 'receive' | 'inspect' | 'restock') => {
    try {
      if (action === 'receive') await returnApi.receiveReturn(id);
      else if (action === 'inspect') await returnApi.inspectReturn(id);
      else if (action === 'restock') await returnApi.restockReturn(id);
      showToast(`Return ${action} successful`);
      loadReturns();
    } catch (err) {
      showToast(`Failed to ${action} return`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono tracking-widest uppercase">Loading returns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-red-400">
          <AlertCircle className="w-8 h-8" />
          <p className="text-xs font-semibold">{error}</p>
          <button onClick={loadReturns} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs cursor-pointer">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
            toast.type === 'error' ? 'bg-red-950 border-red-800 text-red-400' :
            'bg-blue-950 border-blue-800 text-blue-400'
          }`}>
            <Check className="w-4 h-4" />
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Returns / RMA Management</h3>
          <p className="text-xs text-slate-400 mt-1">Track and manage customer return orders through the full lifecycle.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Return</span>
        </button>
      </div>

      {/* Status Flow Legend */}
      <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-2 text-[10px] text-slate-500">
        <span className="font-semibold mr-1">Flow:</span>
        {(['pending', 'received', 'inspected', 'restocked', 'damaged', 'completed'] as ReturnStatus[]).map((s, i) => (
          <React.Fragment key={s}>
            <span className={`px-1.5 py-0.5 rounded ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} font-bold`}>
              {STATUS_CONFIG[s].label}
            </span>
            {i < 5 && <span className="text-slate-700">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {returns.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-xs">No return orders found.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Return #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {returns.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="text-slate-300 hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{r.returnNo}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{r.orderNo}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-200">{r.skuCode}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{r.skuName}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{r.quantity}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{r.createdAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {r.status === 'pending' && (
                            <button onClick={() => handleStatusAction(r.id, 'receive')} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer">Receive</button>
                          )}
                          {r.status === 'received' && (
                            <button onClick={() => handleStatusAction(r.id, 'inspect')} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold cursor-pointer">Inspect</button>
                          )}
                          {r.status === 'inspected' && (
                            <button onClick={() => handleStatusAction(r.id, 'restock')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer">Restock</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">Create New Return</h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">Order Number</label>
                <input
                  type="text"
                  value={newReturn.orderNo}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, orderNo: e.target.value }))}
                  placeholder="e.g. OBS0372606290RU"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">SKU Code</label>
                <input
                  type="text"
                  value={newReturn.skuCode}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, skuCode: e.target.value }))}
                  placeholder="e.g. FA-zuoyitao006-BlackFS"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newReturn.quantity}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 text-xs font-semibold">Reason</label>
                <select
                  value={newReturn.reason}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Wrong item received">Wrong item received</option>
                  <option value="Defective product">Defective product</option>
                  <option value="Damaged in transit">Damaged in transit</option>
                  <option value="Not as described">Not as described</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded text-slate-400 cursor-pointer">Cancel</button>
              <button onClick={handleCreateReturn} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer">Create Return</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 4: Create BillingView.tsx

**Files:**
- Create: `src/components/billing/BillingView.tsx`

**Interfaces:**
- Consumes: `billingApi` from `../../api`
- Consumes: `currentUser` prop with `id`, `customerId`
- Produces: default export `BillingView`

- [ ] **Step 1: Create the billing directory and BillingView.tsx**

Create file `src/components/billing/BillingView.tsx` with the following complete content:

```tsx
import React, { useState, useEffect } from 'react';
import { 
  Landmark, Download, Loader2, AlertCircle, Check, Calendar, 
  Filter, DollarSign, CreditCard, TrendingUp
} from 'lucide-react';
import { billingApi } from '../../api';

interface BillingViewProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: string;
    customerId?: string;
  };
}

interface BillingRecord {
  id: string;
  date: string;
  type: string;
  orderNo: string;
  amount: number;
  status: 'UNPAID' | 'PAID';
  customerId: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  totalAmount: number;
  status: 'UNPAID' | 'PAID';
  customerId: string;
}

export default function BillingView({ currentUser }: BillingViewProps) {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsRes, invoicesRes] = await Promise.allSettled([
        billingApi.getRecords(),
        billingApi.getInvoices(),
      ]);

      if (recordsRes.status === 'fulfilled') {
        setRecords((recordsRes.value || []).filter((r: BillingRecord) => r.customerId === currentUser.customerId));
      }
      if (invoicesRes.status === 'fulfilled') {
        setInvoices((invoicesRes.value || []).filter((i: Invoice) => i.customerId === currentUser.customerId));
      }
    } catch (err) {
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    return true;
  });

  const totalCharges = records.reduce((sum, r) => sum + r.amount, 0);
  const unpaidAmount = records.filter(r => r.status === 'UNPAID').reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = records.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);
  const thisMonth = records.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + r.amount, 0);

  const uniqueTypes = [...new Set(records.map(r => r.type))];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono tracking-widest uppercase">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-red-400">
          <AlertCircle className="w-8 h-8" />
          <p className="text-xs font-semibold">{error}</p>
          <button onClick={loadData} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs cursor-pointer">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
            toast.type === 'error' ? 'bg-red-950 border-red-800 text-red-400' :
            'bg-blue-950 border-blue-800 text-blue-400'
          }`}>
            <Check className="w-4 h-4" />
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-800">
        <h3 className="text-sm font-bold text-slate-200">Billing & Invoices</h3>
        <p className="text-xs text-slate-400 mt-1">View charges, download invoices, and track payment status.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <DollarSign className="absolute right-3 top-3 w-8 h-8 text-slate-800" />
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Charges</p>
            <p className="text-2xl font-mono font-bold text-white mt-1">${totalCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <AlertCircle className="absolute right-3 top-3 w-8 h-8 text-red-900" />
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">Unpaid Amount</p>
            <p className="text-2xl font-mono font-bold text-red-400 mt-1">${unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <CreditCard className="absolute right-3 top-3 w-8 h-8 text-emerald-900" />
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Paid Amount</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <TrendingUp className="absolute right-3 top-3 w-8 h-8 text-blue-900" />
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-mono font-bold text-blue-400 mt-1">${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
              placeholder="From"
            />
            <span className="text-slate-600">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
              placeholder="To"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter(''); }}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Billing Records Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300">Billing Records</h4>
            <span className="text-[10px] text-slate-500">{filteredRecords.length} records</span>
          </div>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No billing records found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="text-slate-300 hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono text-slate-400">{r.date}</td>
                    <td className="py-3 px-4">{r.type}</td>
                    <td className="py-3 px-4 font-mono text-blue-400">{r.orderNo}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">${r.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'PAID'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                          : 'bg-red-950/80 text-red-400 border border-red-800/40'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Invoices Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300">Invoices</h4>
            <span className="text-[10px] text-slate-500">{invoices.length} invoices</span>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No invoices found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-slate-300 hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{inv.date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">${inv.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                          : 'bg-red-950/80 text-red-400 border border-red-800/40'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => showToast(`Downloading invoice ${inv.invoiceNo}...`, 'info')}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 5: Integration Wiring (ClientPortal updates)

**Files:**
- Modify: `src/components/ClientPortal.tsx`

**Interfaces:**
- Consumes: IntegrationCenter, ReturnManager, BillingView components
- Produces: Updated ClientPortal with new component imports

- [ ] **Step 1: Add imports for new components in ClientPortal.tsx**

After line 4 (`import { authApi, outboundApi, metadataApi, skuApi, inventoryApi, customerApi } from '../api';`), add:

```typescript
import IntegrationCenter from './integration/IntegrationCenter';
import ReturnManager from './returns/ReturnManager';
import BillingView from './billing/BillingView';
```

- [ ] **Step 2: Replace placeholder content for returns, billing, and api tabs**

Replace the `activeTab === 'returns'` block (lines 494-504) with:
```tsx
) : activeTab === 'returns' ? (
  <ReturnManager currentUser={currentUser} />
```

Replace the `activeTab === 'billing'` block (lines 505-548) with:
```tsx
) : activeTab === 'billing' ? (
  <BillingView currentUser={currentUser} />
```

Replace the `activeTab === 'api'` block (lines 549-586) with:
```tsx
) : activeTab === 'api' ? (
  <IntegrationCenter currentUser={currentUser} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: No errors

---

### Summary of Files

**Modified:**
- `src/api.ts` — Added 5 new API objects: `apiKeyApi`, `webhookApi`, `storeConnectionApi`, `returnApi`, `billingApi`
- `src/components/ClientPortal.tsx` — Imported and wired up 3 new components in tab routing

**Created:**
- `src/components/integration/IntegrationCenter.tsx` — Client integration center with API Keys, Webhooks, Store Connections, and API Docs tabs
- `src/components/returns/ReturnManager.tsx` — Client returns/RMA management with status flow and create modal
- `src/components/billing/BillingView.tsx` — Client billing view with summary cards, records table, and invoices
