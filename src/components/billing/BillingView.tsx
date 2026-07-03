import { useState, useEffect } from 'react';
import { billingApi } from '../../api';
import { Landmark, RefreshCw, DollarSign, CreditCard, FileText, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

const TYPE_MAP: Record<string, string> = { OUTBOUND: '出库费', INBOUND: '入库费', STORAGE: '仓储费', RELABEL: '换标费', RETURN: '退货费', SPECIAL: '特殊操作' };

interface Props { currentUser: any; }

export default function BillingView({ currentUser }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'records' | 'invoices'>('records');

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, inv] = await Promise.all([billingApi.getRecords(), billingApi.getInvoices()]);
      const cid = currentUser.customerId;
      setRecords(Array.isArray(r) ? r.filter((x: any) => !cid || x.customerId === cid) : []);
      setInvoices(Array.isArray(inv) ? inv.filter((x: any) => !cid || x.customerId === cid) : []);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const totalAmount = records.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const unpaidAmount = records.filter((r: any) => r.status === 'UNPAID').reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const paidAmount = records.filter((r: any) => r.status === 'PAID').reduce((s: number, r: any) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">账单管理 Billing</h2>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"><RefreshCw className="w-4 h-4" />刷新</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总费用', value: `$${totalAmount.toFixed(2)}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '待支付', value: `$${unpaidAmount.toFixed(2)}`, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '已支付', value: `$${paidAmount.toFixed(2)}`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '本月账单', value: records.length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} rounded-lg p-4 flex items-center gap-3`}>
            <c.icon className={`w-8 h-8 ${c.color}`} />
            <div><p className="text-xs text-gray-500">{c.label}</p><p className={`text-xl font-bold ${c.color}`}>{c.value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('records')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'records' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>费用明细</button>
        <button onClick={() => setTab('invoices')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'invoices' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>月度账单</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : tab === 'records' ? (
        records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border"><Landmark className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无费用记录</p></div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">日期</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">类型</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">关联订单</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">金额</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              </tr></thead>
              <tbody>
                {records.map((r: any, i: number) => (
                  <tr key={r.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">{TYPE_MAP[r.type] || r.type}</td>
                    <td className="px-4 py-3 text-gray-500">{r.orderId || '-'}</td>
                    <td className="px-4 py-3 font-medium">${r.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${r.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status === 'PAID' ? '已付' : '未付'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        invoices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border"><CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无账单</p></div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">账单号</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">金额</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">创建时间</th>
              </tr></thead>
              <tbody>
                {invoices.map((inv: any, i: number) => (
                  <tr key={inv.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 font-medium">${inv.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status === 'PAID' ? '已付' : '未付'}</span></td>
                    <td className="px-4 py-3 text-gray-500">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
