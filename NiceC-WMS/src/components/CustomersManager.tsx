import React, { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { Customer } from '../types';
import { 
  Search, RefreshCw, Plus, Edit2, Trash2, CheckCircle2, 
  HelpCircle, Users, AlertCircle, X, ShieldAlert
} from 'lucide-react';

export default function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    contact: '',
    email: ''
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ name: '', code: '', contact: '', email: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      code: c.code,
      contact: c.contact || '',
      email: c.email || ''
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`注意：确定要彻底删除大客户记录 [${name}] 吗？对应的历史订单、SKU资料可能会变为脏数据！`)) {
      try {
        await customerApi.deleteCustomer(id);
        loadCustomers();
      } catch (e) {
        alert('删除失败');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      alert('请填写客户名称和客户代码');
      return;
    }
    try {
      if (editId) {
        await customerApi.updateCustomer(editId, form);
      } else {
        await customerApi.createCustomer(form);
      }
      setIsOpen(false);
      loadCustomers();
    } catch (err) {
      alert('保存失败，请检查数据合法性');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Header */}
      <div className="h-10.5 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 text-xs font-extrabold">货主与委托客户基础管理</span>
          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">
            Customer Profile
          </span>
        </div>
        <button 
          onClick={loadCustomers}
          className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
          title="刷新数据"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white gap-4">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="搜索货主名称/英文简称..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-3 text-slate-600 placeholder-slate-400 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-7 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加新客户</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-[10px] text-slate-400">正在获取大客户资料簿...</span>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 text-center">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="text-xs font-bold text-slate-600">未找到客户档案</h3>
            <p className="text-[10px] text-slate-400 mt-1">您可以点击右侧添加新客户归集到出库单源。</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] text-slate-500 font-bold tracking-wider h-8">
                <th className="px-4 w-48">货主客户名称</th>
                <th className="px-4 w-52">外部系统代码 (Code)</th>
                <th className="px-4 w-36">对接联系人</th>
                <th className="px-4 w-56">服务电子邮箱</th>
                <th className="px-4 text-right w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 h-10.5">
                  <td className="px-4 font-bold text-slate-800">{c.name}</td>
                  <td className="px-4 font-mono font-semibold text-slate-600">{c.code}</td>
                  <td className="px-4 text-slate-600">{c.contact || '-'}</td>
                  <td className="px-4 font-mono text-slate-500">{c.email || '-'}</td>
                  <td className="px-4 text-right">
                    <div className="flex justify-end gap-3.5">
                      <button 
                        onClick={() => handleOpenEdit(c)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>编辑</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id, c.name)}
                        className="text-rose-600 hover:text-rose-800 font-semibold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>删除</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">
                {editId ? '编辑货主资料档案' : '录入新合作客户'}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  货主全称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: Amazon Direct Ltd"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  唯一代码识别码 (System Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: TOCHTECH(1108045)"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    技术/业务联系人
                  </label>
                  <input
                    type="text"
                    placeholder="张经理"
                    value={form.contact}
                    onChange={e => setForm(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    服务对接邮箱
                  </label>
                  <input
                    type="email"
                    placeholder="service@client.com"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-8 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold shadow transition-all cursor-pointer"
                >
                  确定保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
