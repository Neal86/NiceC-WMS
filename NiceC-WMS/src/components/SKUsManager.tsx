import React, { useState } from 'react';
import { 
  Search, RefreshCw, Plus, Edit2, Trash2, Tag, 
  X, HelpCircle, FileSpreadsheet, Settings, Printer,
  Eye, Layers, Box, Check, LayoutGrid, CheckCircle2
} from 'lucide-react';

interface SKUProduct {
  id: string;
  skuCode: string;
  skuName: string;
  barcode: string;
  client: string;
  dimensions: string;
  weight: string;
  uniqueCodeManaged: '启用' | '禁用';
  expiryManaged: '启用' | '禁用';
  category: string;
  status: '已完善' | '待完善' | '完善中';
  lastUpdatedAt: string;
  imageUrl?: string;
}

const INITIAL_PRODUCTS: SKUProduct[] = [
  {
    id: 'prod_1',
    skuCode: 'FA-zuoyitao006-BlackFS',
    skuName: 'FA-电脑桌椅套装-简约现代电脑桌黑色组合',
    barcode: 'FA-zuoyitao006-BlackFS',
    client: '之道 - 悠悠(1108026)',
    dimensions: '120.0 * 60.0 * 75.0 cm',
    weight: '18.50 kg',
    uniqueCodeManaged: '禁用',
    expiryManaged: '禁用',
    category: '家具/桌椅套装',
    status: '已完善',
    lastUpdatedAt: '2026-06-30 16:11:00',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=40&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod_2',
    skuCode: 'HM-purifier01-White',
    skuName: 'HM-智能空气净化器-超静音家用除甲醛版',
    barcode: 'HM-purifier01-White',
    client: '泉州之道 - Rocket-一件代发 (1108028)',
    dimensions: '30.0 * 30.0 * 65.0 cm',
    weight: '5.20 kg',
    uniqueCodeManaged: '启用',
    expiryManaged: '禁用',
    category: '智能家电/空气净化器',
    status: '已完善',
    lastUpdatedAt: '2026-06-30 15:45:12',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=40&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod_3',
    skuCode: 'OF-chair088-Grey',
    skuName: 'OF-人体工学办公椅-高背可调节透气网椅灰色',
    barcode: 'OF-chair088-Grey',
    client: 'YANGZHOU(1108014)',
    dimensions: '65.0 * 65.0 * 120.0 cm',
    weight: '14.80 kg',
    uniqueCodeManaged: '禁用',
    expiryManaged: '禁用',
    category: '办公家具/办公椅',
    status: '已完善',
    lastUpdatedAt: '2026-06-29 17:04:46',
    imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=40&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod_4',
    skuCode: 'FA-sofa001-Yellow',
    skuName: 'FA-北欧单人布艺沙发-轻奢客厅休闲软包黄',
    barcode: 'FA-sofa001-Yellow',
    client: '之道 - 悠悠(1108026)',
    dimensions: '85.0 * 80.0 * 80.0 cm',
    weight: '22.00 kg',
    uniqueCodeManaged: '禁用',
    expiryManaged: '禁用',
    category: '家具/沙发',
    status: '已完善',
    lastUpdatedAt: '2026-06-29 16:40:40',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=40&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod_5',
    skuCode: 'X0048Z29FX',
    skuName: 'WMS-手持无线扫码枪-高精度红外线二维扫描枪',
    barcode: 'X0048Z29FX',
    client: 'JIDONG(1108034)',
    dimensions: '18.0 * 10.0 * 8.0 cm',
    weight: '0.35 kg',
    uniqueCodeManaged: '启用',
    expiryManaged: '禁用',
    category: '数码外设/扫码枪',
    status: '完善中',
    lastUpdatedAt: '2026-06-21 16:31:01',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=40&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod_6',
    skuCode: 'X004N164TT',
    skuName: 'HM-家用静音加湿器-卧室大容量双向喷雾白色',
    barcode: 'X004N164TT',
    client: '天旭01(1108013)',
    dimensions: '22.0 * 22.0 * 35.0 cm',
    weight: '1.20 kg',
    uniqueCodeManaged: '禁用',
    expiryManaged: '启用',
    category: '生活电器/加湿器',
    status: '待完善',
    lastUpdatedAt: '2026-06-12 13:30:15',
    imageUrl: 'https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=40&auto=format&fit=crop&q=60'
  }
];

export default function SKUsManager() {
  const [products, setProducts] = useState<SKUProduct[]>(INITIAL_PRODUCTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROGRESS' | 'DONE'>('ALL');

  // Filter States
  const [uniqueCodeFilter, setUniqueCodeFilter] = useState<'全部' | '启用' | '禁用'>('全部');
  const [expiryFilter, setExpiryFilter] = useState<'全部' | '启用' | '禁用'>('全部');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [skuSearch, setSkuSearch] = useState('');

  // Creation & Editing States
  const [isOpen, setIsOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<SKUProduct | null>(null);
  const [form, setForm] = useState({
    skuCode: '',
    skuName: '',
    barcode: '',
    client: '之道 - 悠悠(1108026)',
    dimensions: '30.0 * 30.0 * 30.0 cm',
    weight: '1.50 kg',
    uniqueCodeManaged: '禁用' as '启用' | '禁用',
    expiryManaged: '禁用' as '启用' | '禁用',
    category: '通用数码',
    status: '已完善' as '已完善' | '待完善' | '完善中'
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter computation
  const filteredProducts = products.filter(p => {
    // 1. Completion Tab Status filter
    if (activeTab === 'PENDING' && p.status !== '待完善') return false;
    if (activeTab === 'PROGRESS' && p.status !== '完善中') return false;
    if (activeTab === 'DONE' && p.status !== '已完善') return false;

    // 2. Unique Code tracking
    if (uniqueCodeFilter !== '全部' && p.uniqueCodeManaged !== uniqueCodeFilter) return false;

    // 3. Expiry tracking
    if (expiryFilter !== '全部' && p.expiryManaged !== expiryFilter) return false;

    // 4. Barcode
    if (barcodeSearch && !p.barcode.toLowerCase().includes(barcodeSearch.toLowerCase())) return false;

    // 5. Category
    if (categorySearch && !p.category.toLowerCase().includes(categorySearch.toLowerCase())) return false;

    // 6. Client
    if (clientSearch && !p.client.toLowerCase().includes(clientSearch.toLowerCase())) return false;

    // 7. SKU / Name search
    if (skuSearch) {
      const s = skuSearch.toLowerCase();
      const matchCode = p.skuCode.toLowerCase().includes(s);
      const matchName = p.skuName.toLowerCase().includes(s);
      if (!matchCode && !matchName) return false;
    }

    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setEditProduct(null);
    setForm({
      skuCode: '',
      skuName: '',
      barcode: '',
      client: '之道 - 悠悠(1108026)',
      dimensions: '40.0 * 30.0 * 20.0 cm',
      weight: '2.50 kg',
      uniqueCodeManaged: '禁用',
      expiryManaged: '禁用',
      category: '通用配件',
      status: '已完善'
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (p: SKUProduct) => {
    setEditProduct(p);
    setForm({
      skuCode: p.skuCode,
      skuName: p.skuName,
      barcode: p.barcode,
      client: p.client,
      dimensions: p.dimensions,
      weight: p.weight,
      uniqueCodeManaged: p.uniqueCodeManaged,
      expiryManaged: p.expiryManaged,
      category: p.category,
      status: p.status
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`注意：您确定要彻底删除 SKU 商品 [${code}] 吗？对应的库存资料可能一并清理！`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      showToast('货品档案已安全删除', 'info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.skuCode || !form.barcode) {
      showToast('请输入 SKU 编码及产品条码', 'error');
      return;
    }

    if (editProduct) {
      // Edit
      setProducts(prev => prev.map(p => {
        if (p.id === editProduct.id) {
          showToast(`SKU 商品 ${form.skuCode} 信息更新成功！`, 'success');
          return {
            ...p,
            skuCode: form.skuCode,
            skuName: form.skuName,
            barcode: form.barcode,
            client: form.client,
            dimensions: form.dimensions,
            weight: form.weight,
            uniqueCodeManaged: form.uniqueCodeManaged,
            expiryManaged: form.expiryManaged,
            category: form.category,
            status: form.status,
            lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
        }
        return p;
      }));
    } else {
      // Create
      const created: SKUProduct = {
        id: 'prod_' + Math.floor(Math.random() * 100000),
        skuCode: form.skuCode,
        skuName: form.skuName || '常规跨境产品 ' + form.skuCode,
        barcode: form.barcode,
        client: form.client,
        dimensions: form.dimensions,
        weight: form.weight,
        uniqueCodeManaged: form.uniqueCodeManaged,
        expiryManaged: form.expiryManaged,
        category: form.category,
        status: form.status,
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=40&auto=format&fit=crop&q=60'
      };
      setProducts(prev => [created, ...prev]);
      showToast(`新 SKU 商品 ${form.skuCode} 建档录入成功！`, 'success');
    }

    setIsOpen(false);
  };

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none text-[12px] text-slate-700">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4.5 py-2.5 rounded shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Horizontal Completion Tabs (全部, 待完善, 完善中, 已完善) */}
      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center select-none text-[11px] font-medium text-slate-500">
        <div className="flex gap-4">
          {[
            { key: 'ALL', label: '全部商品' },
            { key: 'PENDING', label: '待完善档案' },
            { key: 'PROGRESS', label: '完善中' },
            { key: 'DONE', label: '已完善档案' }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`h-9.5 px-1 hover:text-blue-600 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                  isActive ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top advanced filters row */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
        
        <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
          <span className="text-slate-400">唯一码管理:</span>
          <select 
            value={uniqueCodeFilter} 
            onChange={(e) => setUniqueCodeFilter(e.target.value as any)}
            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="全部">全部</option>
            <option value="启用">启用唯一码</option>
            <option value="禁用">禁用唯一码</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
          <span className="text-slate-400">有效期管理:</span>
          <select 
            value={expiryFilter} 
            onChange={(e) => setExpiryFilter(e.target.value as any)}
            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="全部">全部</option>
            <option value="启用">启用有效期</option>
            <option value="禁用">禁用有效期</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Barcode-模糊搜索"
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            className="h-7 w-36 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="分类名称"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="h-7 w-32 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="所属客户主体"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="h-7 w-32 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="搜索 SKU 编码或商品品名..."
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            className="h-7 w-52 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            setUniqueCodeFilter('全部');
            setExpiryFilter('全部');
            setBarcodeSearch('');
            setCategorySearch('');
            setClientSearch('');
            setSkuSearch('');
            showToast('已重置档案筛选选项', 'info');
          }}
          className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded text-[11px] font-semibold transition-all cursor-pointer"
        >
          重置
        </button>
      </div>

      {/* 3. Action toolbar */}
      <div className="h-9 bg-[#f9fafb] border-b border-slate-200 px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenAdd}
            className="h-6 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>新建 SKU 档案</span>
          </button>

          <button
            onClick={() => alert('请选择符合 NiceC SKU 模板规范的 Excel 进行快速批量导入。')}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold cursor-pointer"
          >
            导入商品
          </button>

          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                showToast('请至少勾选一个需要打印标签的商品。', 'error');
                return;
              }
              alert(`正在向标签打印机发送 ${selectedIds.length} 个 SKU 的产品条码打印请求。`);
            }}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>打印条码</span>
          </button>

          <button
            onClick={() => {
              alert('正在生成并下载产品资料Excel文件...');
            }}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>导出商品库</span>
          </button>
        </div>

        <div className="text-slate-400 flex items-center gap-2">
          <span>共找到 {filteredProducts.length} 款商品档案</span>
          <RefreshCw 
            onClick={() => {
              setProducts(INITIAL_PRODUCTS);
              showToast('已拉取最新领星商品条码字典', 'success');
            }}
            className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer animate-spin-hover" 
          />
        </div>
      </div>

      {/* 4. Main Grid Table */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full text-left border-collapse bg-white select-none table-fixed">
          <thead>
            <tr className="bg-[#f5f7fa] text-slate-500 font-semibold border-b border-slate-200 text-[10.5px] h-8 sticky top-0 z-10">
              <th className="w-8 text-center border-r border-slate-200/60">
                <input 
                  type="checkbox" 
                  checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
              </th>
              <th className="w-11 text-center border-r border-slate-200/60">图片</th>
              <th className="w-56 px-2 border-r border-slate-200/60">SKU / 产品名称</th>
              <th className="w-44 px-2 border-r border-slate-200/60">产品条码 (Barcode)</th>
              <th className="w-48 px-2 border-r border-slate-200/60">客户</th>
              <th className="w-32 px-2 border-r border-slate-200/60">所属分类</th>
              <th className="w-36 px-2 border-r border-slate-200/60">wms尺寸 (L * W * H)</th>
              <th className="w-24 px-2 border-r border-slate-200/60 text-right">wms重量</th>
              <th className="w-28 px-2 border-r border-slate-200/60 text-center">唯一码管理</th>
              <th className="w-28 px-2 border-r border-slate-200/60 text-center">有效期管理</th>
              <th className="w-20 px-2 border-r border-slate-200/60 text-center">档案状态</th>
              <th className="w-36 px-2 border-r border-slate-200/60">最后修改时间</th>
              <th className="w-28 px-2 text-center sticky right-0 bg-[#f5f7fa] border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-[11px]">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={13} className="h-40 text-center text-slate-400 font-medium">
                  暂无匹配的商品 SKU 基础数据
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr 
                    key={p.id}
                    className={`hover:bg-slate-50/80 h-10 transition-colors ${
                      isSelected ? 'bg-blue-500/[0.03]' : ''
                    }`}
                  >
                    <td className="text-center border-r border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectRow(p.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </td>
                    <td className="text-center border-r border-slate-100 p-0.5">
                      <img 
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=40&auto=format&fit=crop&q=60'} 
                        alt="Product Thumbnail" 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 object-cover rounded border border-slate-200 mx-auto"
                      />
                    </td>
                    <td className="px-2 border-r border-slate-100 font-medium text-slate-800">
                      <div className="font-mono text-slate-900 font-bold leading-tight">{p.skuCode}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={p.skuName}>
                        {p.skuName}
                      </div>
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-600" title={p.barcode}>{p.barcode}</td>
                    <td className="px-2 border-r border-slate-100 truncate text-slate-500" title={p.client}>{p.client}</td>
                    <td className="px-2 border-r border-slate-100 text-slate-500 truncate" title={p.category}>{p.category}</td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 text-[10.5px] truncate">{p.dimensions}</td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 text-right">{p.weight}</td>
                    
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1 rounded text-[10px] font-bold ${
                        p.uniqueCodeManaged === '启用' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {p.uniqueCodeManaged}
                      </span>
                    </td>
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1 rounded text-[10px] font-bold ${
                        p.expiryManaged === '启用' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {p.expiryManaged}
                      </span>
                    </td>
                    
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.status === '已完善' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === '完善中' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400" title={p.lastUpdatedAt}>{p.lastUpdatedAt}</td>
                    
                    {/* Operation */}
                    <td className="px-2 text-center sticky right-0 bg-white border-l border-slate-100 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            alert(`正在向 NiceC 打印模块推送商品 [ ${p.skuCode} ] 的条码打印任务...`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          打印
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="text-amber-600 hover:text-amber-800 font-semibold cursor-pointer"
                        >
                          编辑
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDelete(p.id, p.skuCode)}
                          className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SKU Create & Edit dialog modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <form 
            onSubmit={handleSubmit}
            className="w-[480px] bg-white rounded-xl shadow-2xl p-6 border border-slate-200 text-xs text-slate-700 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="text-sm font-extrabold text-slate-800">
                {editProduct ? '编辑 SKU 产品主属性' : '录入新建 SKU 档案'}
              </span>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">SKU 货号编码 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="如: TS-V-NA-4"
                  required
                  value={form.skuCode}
                  onChange={(e) => setForm(prev => ({ ...prev, skuCode: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">外箱/件规条形码 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="UPC / EAN 商品码"
                  required
                  value={form.barcode}
                  onChange={(e) => setForm(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 font-semibold">货品中文全称 (品名描述)</label>
                <input
                  type="text"
                  placeholder="商品详细物理品名描述"
                  value={form.skuName}
                  onChange={(e) => setForm(prev => ({ ...prev, skuName: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">归属货主主体</label>
                <select
                  value={form.client}
                  onChange={(e) => setForm(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="之道 - 悠悠(1108026)">之道 - 悠悠 (1108026)</option>
                  <option value="泉州之道 - Rocket-一件代发 (1108028)">泉州之道 - Rocket (1108028)</option>
                  <option value="YANGZHOU(1108014)">YANGZHOU (1108014)</option>
                  <option value="JIDONG(1108034)">JIDONG (1108034)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">产品主分类</label>
                <input
                  type="text"
                  placeholder="家具 / 电器 / 家居配饰"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">外箱尺寸 (L * W * H cm)</label>
                <input
                  type="text"
                  placeholder="100.0 * 50.0 * 30.0 cm"
                  value={form.dimensions}
                  onChange={(e) => setForm(prev => ({ ...prev, dimensions: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">整箱净重量 (kg)</label>
                <input
                  type="text"
                  placeholder="12.50 kg"
                  value={form.weight}
                  onChange={(e) => setForm(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">序列单号(唯一码)管理</label>
                <select
                  value={form.uniqueCodeManaged}
                  onChange={(e) => setForm(prev => ({ ...prev, uniqueCodeManaged: e.target.value as any }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="禁用">禁用 (不跟踪每个扫码枪唯一SN)</option>
                  <option value="启用">启用 (出入库必须扫描序列号唯一码)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">有效期精细管理</label>
                <select
                  value={form.expiryManaged}
                  onChange={(e) => setForm(prev => ({ ...prev, expiryManaged: e.target.value as any }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="禁用">禁用有效期</option>
                  <option value="启用">启用批次效期预警与过期拒收</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 font-semibold">档案审核完善度</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="已完善">已完善 (信息齐备且校准无误)</option>
                  <option value="完善中">完善中 (待现场测重核对尺寸)</option>
                  <option value="待完善">待完善 (缺少基础物料重量尺寸规格)</option>
                </select>
              </div>

            </div>

            <div className="border-t border-slate-200 pt-3.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer transition-all shadow"
              >
                保存档案
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
