import { useState, useEffect } from 'react';
import { returnApi, skuApi, outboundApi } from '../../api';
import { RotateCcw, Plus, Search, RefreshCw, Package, CheckCircle2, AlertTriangle, XCircle, Eye } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  RECEIVED: { label: '已收货', color: 'bg-blue-100 text-blue-700' },
  INSPECTED: { label: '已检验', color: 'bg-indigo-100 text-indigo-700' },
  RESTOCKED: { label: '已入库', color: 'bg-green-100 text-green-700' },
  DAMAGED: { label: '损坏', color: 'bg-red-100 text-red-700' },
  RELABEL_REQUIRED: { label: '需换标', color: 'bg-orange-100 text-orange-700' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-700' },
  EXCEPTION: { label: '异常', color: 'bg-red-100 text-red-700' },
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  received: { label: '已收货', color: 'bg-blue-100 text-blue-700' },
  inspected: { label: '已检验', color: 'bg-indigo-100 text-indigo-700' },
  restocked: { label: '已入库', color: 'bg-green-100 text-green-700' },
  damaged: { label: '损坏', color: 'bg-red-100 text-red-700' },
  relabel_required: { label: '需换标', color: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  exception: { label: '异常', color: 'bg-red-100 text-red-700' },
};

interface Props { currentUser: any; }

export default function ReturnManager({ currentUser }: Props) {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [skus, setSkus] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [returnItems, setReturnItems] = useState<{ skuId: string; skuCode: string; qty: number; reason: string }[]>([{ skuId: '', skuCode: '', qty: 1, reason: '' }]);
  const [detailReturn, setDetailReturn] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, s, o] = await Promise.all([returnApi.getReturns(), skuApi.getSkus(), outboundApi.getOrders({ pageSize: 200 })]);
      const cid = currentUser.customerId;
      setReturns(Array.isArray(r) ? r.filter((x: any) => !cid || x.customerId === cid) : []);
      setSkus(Array.isArray(s) ? s.filter((x: any) => !cid || x.customerId === cid) : []);
      setOrders(Array.isArray(o?.orders) ? o.orders.filter((x: any) => !cid || x.customerId === cid) : []);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!selectedOrder || returnItems.every(i => !i.skuId)) return;
    await returnApi.createReturn({ orderId: selectedOrder, items: returnItems.filter(i => i.skuId), reason: 'Customer return' });
    setShowCreate(false); setSelectedOrder(''); setReturnItems([{ skuId: '', skuCode: '', qty: 1, reason: '' }]); loadData();
  };

  const handleReceive = async (id: string) => { await returnApi.receiveReturn(id); loadData(); };
  const handleRestock = async (id: string) => { await returnApi.restockReturn(id); loadData(); };

  const filtered = returns.filter((r: any) => !search || r.returnNo?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">退货管理 Return Management</h2>
        <div className="flex gap-2">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索退货单号..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" /></div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />创建退货</button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="font-bold text-sm">创建退货预报</h3>
          <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">选择关联出库单</option>
            {orders.map((o: any) => <option key={o.id} value={o.id}>{o.orderNo} - {o.recipient}</option>)}
          </select>
          {returnItems.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <select value={item.skuId} onChange={e => { const sku = skus.find((s: any) => s.id === e.target.value); const newItems = [...returnItems]; newItems[idx].skuId = e.target.value; newItems[idx].skuCode = sku?.code || ''; setReturnItems(newItems); }} className="flex-1 border rounded px-3 py-2 text-sm">
                <option value="">选择 SKU</option>
                {skus.map((s: any) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
              <input type="number" value={item.qty} onChange={e => { const newItems = [...returnItems]; newItems[idx].qty = parseInt(e.target.value) || 1; setReturnItems(newItems); }} className="w-20 border rounded px-3 py-2 text-sm" min="1" />
              <input value={item.reason} onChange={e => { const newItems = [...returnItems]; newItems[idx].reason = e.target.value; setReturnItems(newItems); }} placeholder="退货原因" className="flex-1 border rounded px-3 py-2 text-sm" />
            </div>
          ))}
          <button onClick={() => setReturnItems([...returnItems, { skuId: '', skuCode: '', qty: 1, reason: '' }])} className="text-blue-500 text-xs hover:text-blue-700">+ 添加 SKU</button>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">提交</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      {detailReturn && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">退货详情 - {detailReturn.returnNo}</h3>
            <button onClick={() => setDetailReturn(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">退货单号:</span> {detailReturn.returnNo}</div>
            <div><span className="text-gray-500">关联订单:</span> {detailReturn.orderId}</div>
            <div><span className="text-gray-500">状态:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${(STATUS_MAP[detailReturn.status] || STATUS_MAP.PENDING).color}`}>{(STATUS_MAP[detailReturn.status] || STATUS_MAP.PENDING).label}</span></div>
          </div>
          {detailReturn.items && detailReturn.items.length > 0 && (
            <table className="w-full text-sm border">
              <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">SKU</th><th className="px-3 py-2 text-left">期望数量</th><th className="px-3 py-2 text-left">实收数量</th><th className="px-3 py-2 text-left">状态</th></tr></thead>
              <tbody>{detailReturn.items.map((it: any, i: number) => <tr key={i} className="border-t"><td className="px-3 py-2">{it.skuCode}</td><td className="px-3 py-2">{it.qtyExpected}</td><td className="px-3 py-2">{it.qtyReceived}</td><td className="px-3 py-2">{it.condition}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-blue-500" /><span className="ml-2 text-gray-500">加载中...</span></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border"><RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无退货记录</p></div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">退货单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">关联订单</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU 数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">创建时间</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
            </tr></thead>
            <tbody>
              {filtered.map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 font-medium">{r.returnNo}</td>
                  <td className="px-4 py-3 text-gray-500">{r.orderId}</td>
                  <td className="px-4 py-3">{r.items?.length || 0}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${(STATUS_MAP[r.status] || STATUS_MAP.PENDING).color}`}>{(STATUS_MAP[r.status] || STATUS_MAP.PENDING).label}</span></td>
                  <td className="px-4 py-3 text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setDetailReturn(r)} className="text-blue-500 hover:text-blue-700 text-xs"><Eye className="w-3 h-3 inline" /> 详情</button>
                    {(r.status === 'PENDING' || r.status === 'pending') && <button onClick={() => handleReceive(r.id)} className="text-green-500 hover:text-green-700 text-xs">收货</button>}
                    {(r.status === 'INSPECTED' || r.status === 'inspected') && <button onClick={() => handleRestock(r.id)} className="text-green-500 hover:text-green-700 text-xs">入库</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
