import React, { useState, useEffect } from 'react';
import { billingApi } from '../../api';
import { Landmark, RefreshCw, DollarSign, CreditCard, FileText, TrendingUp, CheckCircle2, Clock, Plus, Trash2, Edit, Save, Shield, Zap } from 'lucide-react';

const TYPE_MAP: Record<string, string> = { OUTBOUND: '出库费', INBOUND: '入库费', STORAGE: '仓储费', RELABEL: '换标费', RETURN: '退货费', SPECIAL: '特殊操作' };
const isAdmin = (role: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';

interface Props { currentUser: any; }

export default function BillingView({ currentUser }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'records' | 'invoices' | 'rules'>('records');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  // Rules CRUD state
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleCode, setRuleCode] = useState('');
  const [ruleType, setRuleType] = useState('OUTBOUND');
  const [ruleRate, setRuleRate] = useState('0');
  const [editingRule, setEditingRule] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, inv, rul] = await Promise.all([billingApi.getRecords(), billingApi.getInvoices(), billingApi.getRules()]);
      const cid = currentUser.customerId;
      setRecords(Array.isArray(r) ? r.filter((x: any) => !cid || x.customerId === cid) : []);
      setInvoices(Array.isArray(inv) ? inv.filter((x: any) => !cid || x.customerId === cid) : []);
      setRules(Array.isArray(rul) ? rul : []);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const totalAmount = records.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const unpaidAmount = records.filter((r: any) => r.status === 'UNPAID').reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const paidAmount = records.filter((r: any) => r.status === 'PAID').reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !ruleCode || !ruleRate) return;
    await billingApi.createRule({ name: ruleName, code: ruleCode, type: ruleType, rate: parseFloat(ruleRate) });
    setShowAddRule(false); setRuleName(''); setRuleCode(''); setRuleType('OUTBOUND'); setRuleRate('0');
    loadData();
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    await billingApi.updateRule(editingRule.id, { name: ruleName, rate: parseFloat(ruleRate) });
    setEditingRule(null); setShowAddRule(false); loadData();
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('确定删除此计费规则？')) return;
    await billingApi.deleteRule(id); loadData();
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule); setRuleName(rule.name); setRuleRate(String(rule.rate)); setShowAddRule(true);
  };

  const handleGenerateRecords = async () => {
    setGenerating(true);
    try {
      const r = await billingApi.generateRecords();
      setGenResult(`已生成 ${r.generated} 条费用记录`);
      loadData();
    } catch { setGenResult('生成失败'); }
    setGenerating(false);
    setTimeout(() => setGenResult(null), 3000);
  };

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      const r = await billingApi.generateInvoice();
      setGenResult(`已生成 ${r.generated} 张账单`);
      loadData();
    } catch { setGenResult('生成失败'); }
    setGenerating(false);
    setTimeout(() => setGenResult(null), 3000);
  };

  const RULES_TYPES = ['OUTBOUND', 'INBOUND', 'STORAGE', 'RELABEL', 'RETURN', 'SPECIAL'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">账单管理 Billing</h2>
        <div className="flex gap-2">
          {genResult && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded self-center">{genResult}</span>}
          {isAdmin(currentUser.role) && (
            <>
              <button onClick={handleGenerateRecords} disabled={generating} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"><Zap className="w-4 h-4" />生成费用</button>
              <button onClick={handleGenerateInvoice} disabled={generating} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"><FileText className="w-4 h-4" />生成账单</button>
            </>
          )}
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"><RefreshCw className="w-4 h-4" />刷新</button>
        </div>
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
        {isAdmin(currentUser.role) && <button onClick={() => setTab('rules')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'rules' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>计费规则</button>}
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
      ) : tab === 'invoices' ? (
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
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">管理计费规则，费用生成时将按规则自动计算</p>
            <button onClick={() => { setShowAddRule(true); setEditingRule(null); setRuleName(''); setRuleCode(''); setRuleType('OUTBOUND'); setRuleRate('0'); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />新增规则</button>
          </div>
          {showAddRule && (
            <form onSubmit={editingRule ? handleUpdateRule : handleCreateRule} className="bg-white border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">规则名称</label>
                  <input required value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="例如: 出库操作费" className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                {!editingRule && <div>
                  <label className="block text-xs text-gray-500 mb-1">规则编码</label>
                  <input required value={ruleCode} onChange={e => setRuleCode(e.target.value)} placeholder="OUTBOUND_FEE" className="w-full border rounded px-3 py-2 text-sm font-mono" />
                </div>}
                {!editingRule && <div>
                  <label className="block text-xs text-gray-500 mb-1">类型</label>
                  <select value={ruleType} onChange={e => setRuleType(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                    {RULES_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">费率</label>
                  <input required type="number" step="0.01" value={ruleRate} onChange={e => setRuleRate(e.target.value)} placeholder="2.50" className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowAddRule(false); setEditingRule(null); }} className="px-3 py-1.5 bg-gray-200 rounded-lg text-sm">取消</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">{editingRule ? '保存修改' : '创建规则'}</button>
              </div>
            </form>
          )}
          {rules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">暂无计费规则</p></div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">编码</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">类型</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">费率</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
                </tr></thead>
                <tbody>
                  {rules.map((rule: any, i: number) => (
                    <tr key={rule.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium">{rule.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{rule.code}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-gray-100">{rule.type}</span></td>
                      <td className="px-4 py-3 font-medium">${rule.rate?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => handleEditRule(rule)} className="text-blue-500 hover:text-blue-700 text-xs">编辑</button>
                        <button onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
