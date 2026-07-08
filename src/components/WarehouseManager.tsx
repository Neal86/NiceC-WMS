import React, { useState, useEffect } from 'react';
import { warehouseApi } from '../api';
import { Warehouse } from '../types';
import { 
  Search, RefreshCw, Plus, Edit2, Trash2, Home, 
  X, Check, AlertCircle, MapPin
} from 'lucide-react';

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: ''
  });

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehouseApi.getWarehouses();
      setWarehouses(data);
    } catch (e) {
      console.error('Failed to load warehouses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ name: '', code: '', address: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditId(wh.id);
    setForm({
      name: wh.name,
      code: wh.code,
      address: wh.address || ''
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`注意：确定要彻底销毁境外物理仓库节点 [${name}] 吗？对应的全部库存资料、货位索引将永久丢失！`)) {
      try {
        await warehouseApi.deleteWarehouse(id);
        loadWarehouses();
      } catch (e) {
        alert('删除仓库失败');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      alert('请填写必要字段（仓库名、邮编/网点代码）');
      return;
    }
    try {
      if (editId) {
        await warehouseApi.updateWarehouse(editId, form);
      } else {
        await warehouseApi.createWarehouse(form);
      }
      setIsOpen(false);
      loadWarehouses();
    } catch (err) {
      alert('保存失败，请检查数据库服务状态');
    }
  };

  const filteredWarehouses = warehouses.filter(wh => 
    wh.name.toLowerCase().includes(search.toLowerCase()) || 
    wh.code.toLowerCase().includes(search.toLowerCase()) ||
    (wh.address && wh.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Header */}
      <div className="h-10.5 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 text-xs font-extrabold">多仓跨境供应链节点配置</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
            Fulfill Warehouses
          </span>
        </div>
        <button 
          onClick={loadWarehouses}
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
              placeholder="搜索仓库节点简称 / 邮编识别代码 / 物理地址..."
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
          <span>增加境外仓节点</span>
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-[10px] text-slate-400">正在定位物理仓库GPS坐标...</span>
            </div>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 text-center">
            <Home className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="text-xs font-bold text-slate-600">未设置供应链仓库</h3>
            <p className="text-[10px] text-slate-400 mt-1">您可以立即添加第一家跨境物流仓库节点。</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredWarehouses.map((wh) => (
              <div key={wh.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-blue-600" />
                      <span>{wh.name}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded border border-blue-100">
                      ZIP: {wh.code}
                    </span>
                  </div>
                  
                  <p className="text-slate-500 text-xs flex items-start gap-1 leading-relaxed mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{wh.address || 'NC, USA'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>数据通信中 (API OK)</span>
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleOpenEdit(wh)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>编辑</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(wh.id, wh.name)}
                      className="text-rose-600 hover:text-rose-800 font-bold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>彻底销毁</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">
                {editId ? '编辑跨境履约仓基本参数' : '建立境外物流配送仓库档案'}
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
                  仓库显示全称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: NC - NO.1仓 - 92503"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  邮政邮编区域/主索引码 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 92503"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  物理精细地理位置
                </label>
                <input
                  type="text"
                  placeholder="例: 1040 Sandhill Ave, North Carolina, USA"
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full h-8 px-3 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                />
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
                  确定启用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
