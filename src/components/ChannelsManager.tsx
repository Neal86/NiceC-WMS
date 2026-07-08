import React, { useState, useEffect } from 'react';
import { channelApi, carrierApi } from '../api';
import { LogisticsChannel, Carrier } from '../types';
import { 
  Search, RefreshCw, Plus, Edit2, Trash2, Truck, 
  X, Check, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function ChannelsManager() {
  const [channels, setChannels] = useState<LogisticsChannel[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    carrierId: 'carr_fedex',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [chData, carrData] = await Promise.all([
        channelApi.getChannels(),
        carrierApi.getCarriers()
      ]);
      setChannels(chData);
      setCarriers(carrData);
    } catch (e) {
      console.error('Failed to load logistics static configuration', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ name: '', code: '', carrierId: carriers[0]?.id || 'carr_fedex', status: 'ACTIVE' });
    setIsOpen(true);
  };

  const handleOpenEdit = (ch: LogisticsChannel) => {
    setEditId(ch.id);
    setForm({
      name: ch.name,
      code: ch.code,
      carrierId: ch.carrierId,
      status: ch.status || 'ACTIVE'
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`确认注销并删除承运商运输专线 [${name}] 吗？`)) {
      try {
        await channelApi.deleteChannel(id);
        loadData();
      } catch (e) {
        alert('注销失败');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      alert('请填写渠道名称和渠道代号');
      return;
    }
    try {
      if (editId) {
        await channelApi.updateChannel(editId, form);
      } else {
        await channelApi.createChannel(form);
      }
      setIsOpen(false);
      loadData();
    } catch (err) {
      alert('保存失败，请重试');
    }
  };

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(search.toLowerCase()) || 
    ch.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Header */}
      <div className="h-10.5 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 text-xs font-extrabold">物流专线与服务流向配制</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
            Logistics Channels
          </span>
        </div>
        <button 
          onClick={loadData}
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
              placeholder="搜索物流专线 / 承运公司..."
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
          <span>配置运输专线</span>
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-[10px] text-slate-400">正在获取承运商通道底单...</span>
            </div>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 text-center">
            <Truck className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="text-xs font-bold text-slate-600">未找到物流专线记录</h3>
            <p className="text-[10px] text-slate-400 mt-1">您可以添加专线匹配承运配送体系。</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] text-slate-500 font-bold tracking-wider h-8">
                <th className="px-4 w-44">承运大类名称</th>
                <th className="px-4 w-56">物流派送渠道代码</th>
                <th className="px-4 w-44">隶属承运商</th>
                <th className="px-4 w-32">专线运行状态</th>
                <th className="px-4 text-right w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredChannels.map((ch) => {
                const carrierObj = carriers.find(c => c.id === ch.carrierId);
                const statusStr = ch.status || 'ACTIVE';
                return (
                  <tr key={ch.id} className="hover:bg-slate-50/80 h-10.5">
                    <td className="px-4 font-bold text-slate-800">{ch.name}</td>
                    <td className="px-4 font-mono font-semibold text-blue-700">{ch.code}</td>
                    <td className="px-4 font-semibold text-slate-500">{carrierObj?.name || 'FEDEX/USPS'}</td>
                    <td className="px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                        statusStr === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {statusStr === 'ACTIVE' ? '正常运行中' : '暂停服务'}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <div className="flex justify-end gap-3.5">
                        <button 
                          onClick={() => handleOpenEdit(ch)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>编辑</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(ch.id, ch.name)}
                          className="text-rose-600 hover:text-rose-800 font-semibold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>注销</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">
                {editId ? '编辑承运配送渠道专线' : '配置新增运输服务流向'}
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
                  渠道专线全称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: FEDEX-HOME-DELIVERY(FHD_G)"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  渠道物流识别代号 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: FEDEX-HOME-DELIVERY"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    物理承运单位
                  </label>
                  <select
                    value={form.carrierId}
                    onChange={e => setForm(prev => ({ ...prev, carrierId: e.target.value }))}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    系统服务状态
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">正常可用</option>
                    <option value="DISABLED">暂停维护</option>
                  </select>
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
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
