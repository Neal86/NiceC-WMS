import { useState, useEffect } from 'react';
import { apiKeyApi, webhookApi, storeConnectionApi } from '../../api';
import { Key, Webhook, Link2, FileText, Plus, Trash2, Copy, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, Shield, Zap, ShoppingBag, Store } from 'lucide-react';

type Tab = 'api-keys' | 'webhooks' | 'stores' | 'docs';

const WEBHOOK_EVENTS = [
  { id: 'order.created', label: 'order.created' },
  { id: 'order.updated', label: 'order.updated' },
  { id: 'order.shipped', label: 'order.shipped' },
  { id: 'inventory.updated', label: 'inventory.updated' },
  { id: 'inbound.completed', label: 'inbound.completed' },
  { id: 'return.completed', label: 'return.completed' },
];

const PLATFORMS = [
  { id: 'AMAZON', name: 'Amazon', icon: '📦', color: 'bg-orange-100 text-orange-700' },
  { id: 'SHOPIFY', name: 'Shopify', icon: '🛒', color: 'bg-green-100 text-green-700' },
  { id: 'WALMART', name: 'Walmart', icon: '🏪', color: 'bg-blue-100 text-blue-700' },
  { id: 'TIKTOK', name: 'TikTok Shop', icon: '🎵', color: 'bg-pink-100 text-pink-700' },
  { id: 'EBAY', name: 'eBay', icon: '🏷️', color: 'bg-red-100 text-red-700' },
  { id: 'WOOCOMMERCE', name: 'WooCommerce', icon: '🔧', color: 'bg-purple-100 text-purple-700' },
  { id: 'CUSTOM', name: 'Custom ERP', icon: '⚙️', color: 'bg-gray-100 text-gray-700' },
];

interface Props { currentUser: any; }

export default function IntegrationCenter({ currentUser }: Props) {
  const [tab, setTab] = useState<Tab>('api-keys');
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showConnectStore, setShowConnectStore] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['order.created', 'order.shipped']);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [k, w, s] = await Promise.all([apiKeyApi.getKeys(), webhookApi.getWebhooks(), storeConnectionApi.getConnections()]);
      const cid = currentUser.customerId;
      setApiKeys(Array.isArray(k) ? k.filter((x: any) => !cid || x.customerId === cid) : []);
      setWebhooks(Array.isArray(w) ? w.filter((x: any) => !cid || x.customerId === cid) : []);
      setStores(Array.isArray(s) ? s.filter((x: any) => !cid || x.customerId === cid) : []);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    await apiKeyApi.createKey({ name: newKeyName });
    setShowCreateKey(false); setNewKeyName(''); loadData();
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('确定删除此 API Key？')) return;
    await apiKeyApi.deleteKey(id); loadData();
  };

  const handleTestKey = async (id: string) => {
    try {
      const r = await apiKeyApi.testKey(id);
      setTestResult({ id, success: true, msg: r.message || 'Test passed' });
    } catch { setTestResult({ id, success: false, msg: 'Test failed' }); }
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return;
    await webhookApi.createWebhook({ url: newWebhookUrl, events: newWebhookEvents.join(',') });
    setShowCreateWebhook(false); setNewWebhookUrl(''); loadData();
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('确定删除此 Webhook？')) return;
    await webhookApi.deleteWebhook(id); loadData();
  };

  const handleTestWebhook = async (id: string) => {
    try {
      const r = await webhookApi.testWebhook(id);
      setTestResult({ id, success: true, msg: r.message || 'Test delivered' });
    } catch { setTestResult({ id, success: false, msg: 'Test failed' }); }
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleConnectStore = async () => {
    if (!selectedPlatform || !newShopName) return;
    await storeConnectionApi.createConnection({ platform: selectedPlatform, shopName: newShopName });
    setShowConnectStore(false); setNewShopName(''); setSelectedPlatform(''); loadData();
  };

  const handleSyncStore = async (id: string) => {
    try {
      const r = await storeConnectionApi.syncConnection(id);
      setTestResult({ id, success: true, msg: `Synced ${r.syncedOrders} orders, ${r.syncedInventory} inventory` });
    } catch { setTestResult({ id, success: false, msg: 'Sync failed' }); }
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('确定断开此店铺连接？')) return;
    await storeConnectionApi.deleteConnection(id); loadData();
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'api-keys', label: 'API Keys', icon: Key },
    { key: 'webhooks', label: 'Webhooks', icon: Webhook },
    { key: 'stores', label: '店铺连接', icon: Store },
    { key: 'docs', label: 'API 文档', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">对接中心 Integration Center</h2>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-blue-500" /><span className="ml-2 text-gray-500">加载中...</span></div>
      ) : (
        <>
          {tab === 'api-keys' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">管理 API 访问密钥，用于程序化访问 WMS API</p>
                <button onClick={() => setShowCreateKey(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />创建 API Key</button>
              </div>
              {showCreateKey && (
                <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
                  <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key 名称" className="flex-1 border rounded px-3 py-2 text-sm" />
                  <button onClick={handleCreateKey} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">创建</button>
                  <button onClick={() => setShowCreateKey(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">取消</button>
                </div>
              )}
              {apiKeys.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border"><Key className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无 API Key</p></div>
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-600">名称</th><th className="px-4 py-3 text-left font-medium text-gray-600">Key</th><th className="px-4 py-3 text-left font-medium text-gray-600">状态</th><th className="px-4 py-3 text-left font-medium text-gray-600">创建时间</th><th className="px-4 py-3 text-right font-medium text-gray-600">操作</th></tr></thead>
                    <tbody>
                      {apiKeys.map((k: any, i: number) => (
                        <tr key={k.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 font-medium">{k.name || 'API Key'}</td>
                          <td className="px-4 py-3 font-mono text-xs flex items-center gap-2">{k.key.substring(0, 12)}...<button onClick={() => handleCopyKey(k.key)} className="text-blue-500 hover:text-blue-700">{copiedKey === k.key ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button></td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${k.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{k.status}</span></td>
                          <td className="px-4 py-3 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {testResult?.id === k.id && <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>{testResult.msg}</span>}
                            <button onClick={() => handleTestKey(k.id)} className="text-blue-500 hover:text-blue-700 text-xs">测试</button>
                            <button onClick={() => handleDeleteKey(k.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'webhooks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">配置 Webhook 端点，接收 WMS 事件通知</p>
                <button onClick={() => setShowCreateWebhook(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />创建 Webhook</button>
              </div>
              {showCreateWebhook && (
                <div className="bg-white border rounded-lg p-4 space-y-3">
                  <input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="Webhook URL (https://...)" className="w-full border rounded px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    {WEBHOOK_EVENTS.map(ev => (
                      <label key={ev.id} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        <input type="checkbox" checked={newWebhookEvents.includes(ev.id)} onChange={e => { e.target.checked ? setNewWebhookEvents([...newWebhookEvents, ev.id]) : setNewWebhookEvents(newWebhookEvents.filter(x => x !== ev.id)); }} className="rounded" />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreateWebhook} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">创建</button>
                    <button onClick={() => setShowCreateWebhook(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">取消</button>
                  </div>
                </div>
              )}
              {webhooks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border"><Webhook className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无 Webhook</p></div>
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-600">URL</th><th className="px-4 py-3 text-left font-medium text-gray-600">Secret</th><th className="px-4 py-3 text-left font-medium text-gray-600">状态</th><th className="px-4 py-3 text-right font-medium text-gray-600">操作</th></tr></thead>
                    <tbody>
                      {webhooks.map((w: any, i: number) => (
                        <tr key={w.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 font-mono text-xs">{w.url}</td>
                          <td className="px-4 py-3 font-mono text-xs">{w.secret}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${w.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{w.status}</span></td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {testResult?.id === w.id && <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>{testResult.msg}</span>}
                            <button onClick={() => handleTestWebhook(w.id)} className="text-blue-500 hover:text-blue-700 text-xs">测试</button>
                            <button onClick={() => handleDeleteWebhook(w.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'stores' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">连接您的电商平台和 ERP 系统</p>
                <button onClick={() => setShowConnectStore(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />连接新店铺</button>
              </div>
              {showConnectStore && (
                <div className="bg-white border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">选择平台</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`p-3 rounded-lg border-2 text-left text-sm ${selectedPlatform === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-lg">{p.icon}</span><br /><span className="font-medium">{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <input value={newShopName} onChange={e => setNewShopName(e.target.value)} placeholder="店铺名称" className="w-full border rounded px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={handleConnectStore} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">连接</button>
                    <button onClick={() => setShowConnectStore(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">取消</button>
                  </div>
                </div>
              )}
              {stores.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border"><Store className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无店铺连接</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stores.map((s: any) => {
                    const platform = PLATFORMS.find(p => p.id === s.platform) || PLATFORMS[6];
                    return (
                      <div key={s.id} className="bg-white border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform.icon}</span>
                            <div><p className="font-medium">{s.shopName}</p><p className="text-xs text-gray-500">{platform.name}</p></div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                        </div>
                        {s.lastSyncAt && <p className="text-xs text-gray-500">最近同步: {new Date(s.lastSyncAt).toLocaleString()}</p>}
                        {testResult?.id === s.id && <p className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>{testResult.msg}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => handleSyncStore(s.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100"><RefreshCw className="w-3 h-3" />同步</button>
                          <button onClick={() => handleDeleteStore(s.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"><Trash2 className="w-3 h-3" />断开</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'docs' && (
            <div className="bg-white border rounded-lg p-8 text-center space-y-4">
              <FileText className="w-16 h-16 mx-auto text-blue-400" />
              <h3 className="text-lg font-bold">WMS API 文档</h3>
              <p className="text-gray-500 max-w-md mx-auto">查看完整的 API 接口文档，了解如何通过 API 管理订单、库存、入库、出库等操作。</p>
              <div className="flex justify-center gap-4">
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><ExternalLink className="w-4 h-4" />REST API 文档</a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"><Zap className="w-4 h-4" />Webhook 事件列表</a>
              </div>
              <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 text-xs font-mono space-y-1">
                <p className="text-gray-400"># 示例请求</p>
                <p>curl -H "Authorization: Bearer YOUR_API_KEY" \</p>
                <p className="ml-4">https://api.nicecwms.com/api/outbound-orders</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
