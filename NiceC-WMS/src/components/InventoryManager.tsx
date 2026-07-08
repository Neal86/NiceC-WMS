import React, { useState } from 'react';
import { 
  Search, RefreshCw, LayoutGrid, Sliders, Box, Layers, 
  HelpCircle, ChevronDown, Check, SlidersHorizontal, ArrowRightLeft,
  FileSpreadsheet, ShieldAlert, Plus, Eye, History, Settings
} from 'lucide-react';

interface SKUStock {
  id: string;
  skuCode: string;
  skuName: string;
  barcode: string;
  client: string;
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  inTransitQty: number;
  damagedQty: number;
  relabellingQty: number;
  dimensions: string;
  weight: string;
  lastUpdatedAt: string;
  imageUrl?: string;
  zone: string;
  location: string;
}

const INITIAL_STOCKS: SKUStock[] = [
  {
    id: 'st_1',
    skuCode: 'FA-zuoyitao006-BlackFS',
    skuName: 'FA-电脑桌椅套装-简约现代电脑桌黑色组合',
    barcode: 'FA-zuoyitao006-BlackFS',
    client: '之道 - 悠悠(1108026)',
    totalQty: 9107,
    availableQty: 9107,
    reservedQty: 0,
    inTransitQty: 1200,
    damagedQty: 0,
    relabellingQty: 0,
    dimensions: '120.0 * 60.0 * 75.0 cm',
    weight: '18.50 kg',
    lastUpdatedAt: '2026-06-30 16:11:00',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=40&auto=format&fit=crop&q=60',
    zone: 'A区',
    location: 'A-04-03'
  },
  {
    id: 'st_2',
    skuCode: 'HM-purifier01-White',
    skuName: 'HM-智能空气净化器-超静音家用除甲醛版',
    barcode: 'HM-purifier01-White',
    client: '泉州之道 - Rocket-一件代发 (1108028)',
    totalQty: 12450,
    availableQty: 12300,
    reservedQty: 150,
    inTransitQty: 5000,
    damagedQty: 5,
    relabellingQty: 0,
    dimensions: '30.0 * 30.0 * 65.0 cm',
    weight: '5.20 kg',
    lastUpdatedAt: '2026-06-30 15:45:12',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=40&auto=format&fit=crop&q=60',
    zone: 'B区',
    location: 'B-12-01'
  },
  {
    id: 'st_3',
    skuCode: 'OF-chair088-Grey',
    skuName: 'OF-人体工学办公椅-高背可调节透气网椅灰色',
    barcode: 'OF-chair088-Grey',
    client: 'YANGZHOU(1108014)',
    totalQty: 5412,
    availableQty: 5320,
    reservedQty: 92,
    inTransitQty: 800,
    damagedQty: 0,
    relabellingQty: 20,
    dimensions: '65.0 * 65.0 * 120.0 cm',
    weight: '14.80 kg',
    lastUpdatedAt: '2026-06-29 17:04:46',
    imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=40&auto=format&fit=crop&q=60',
    zone: 'A区',
    location: 'A-09-02'
  },
  {
    id: 'st_4',
    skuCode: 'FA-sofa001-Yellow',
    skuName: 'FA-北欧单人布艺沙发-轻奢客厅休闲软包黄',
    barcode: 'FA-sofa001-Yellow',
    client: '之道 - 悠悠(1108026)',
    totalQty: 3200,
    availableQty: 3200,
    reservedQty: 0,
    inTransitQty: 1500,
    damagedQty: 0,
    relabellingQty: 0,
    dimensions: '85.0 * 80.0 * 80.0 cm',
    weight: '22.00 kg',
    lastUpdatedAt: '2026-06-29 16:40:40',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=40&auto=format&fit=crop&q=60',
    zone: 'A区',
    location: 'A-02-11'
  },
  {
    id: 'st_5',
    skuCode: 'X0048Z29FX',
    skuName: 'WMS-手持无线扫码枪-高精度红外线二维扫描枪',
    barcode: 'X0048Z29FX',
    client: 'JIDONG(1108034)',
    totalQty: 110,
    availableQty: 110,
    reservedQty: 0,
    inTransitQty: 10,
    damagedQty: 2,
    relabellingQty: 0,
    dimensions: '18.0 * 10.0 * 8.0 cm',
    weight: '0.35 kg',
    lastUpdatedAt: '2026-06-21 16:31:01',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=40&auto=format&fit=crop&q=60',
    zone: 'C区',
    location: 'C-01-05'
  },
  {
    id: 'st_6',
    skuCode: 'X004N164TT',
    skuName: 'HM-家用静音加湿器-卧室大容量双向喷雾白色',
    barcode: 'X004N164TT',
    client: '天旭01(1108013)',
    totalQty: 480,
    availableQty: 480,
    reservedQty: 0,
    inTransitQty: 200,
    damagedQty: 0,
    relabellingQty: 0,
    dimensions: '22.0 * 22.0 * 35.0 cm',
    weight: '1.20 kg',
    lastUpdatedAt: '2026-06-12 13:30:15',
    imageUrl: 'https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=40&auto=format&fit=crop&q=60',
    zone: 'B区',
    location: 'B-04-12'
  }
];

export default function InventoryManager() {
  const [stocks, setStocks] = useState<SKUStock[]>(INITIAL_STOCKS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [querySubTab, setQuerySubTab] = useState<'product' | 'location' | 'flow' | 'batch'>('product');
  
  // Filtering states
  const [clientSearch, setClientSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('全部');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [skuSearch, setSkuSearch] = useState('');

  // Edit State
  const [adjustingStock, setAdjustingStock] = useState<SKUStock | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    availableQty: 0,
    reservedQty: 0,
    damagedQty: 0,
    location: '',
    zone: 'A区'
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter logic
  const filteredStocks = stocks.filter(item => {
    // 1. Client Search
    if (clientSearch && !item.client.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    
    // 2. Property Filter
    if (propertyFilter === '正品' && item.availableQty <= 0) return false;
    if (propertyFilter === '次品' && item.damagedQty <= 0) return false;
    if (propertyFilter === '换标中' && item.relabellingQty <= 0) return false;

    // 3. Barcode Search
    if (barcodeSearch && !item.barcode.toLowerCase().includes(barcodeSearch.toLowerCase())) return false;

    // 4. SKU or Name search
    if (skuSearch) {
      const s = skuSearch.toLowerCase();
      const matchCode = item.skuCode.toLowerCase().includes(s);
      const matchName = item.skuName.toLowerCase().includes(s);
      if (!matchCode && !matchName) return false;
    }

    return true;
  });

  // Calculate totals for summary cards (based on current filtered view or total)
  const totalInStock = stocks.reduce((acc, curr) => acc + curr.totalQty, 0);
  const totalAvailable = stocks.reduce((acc, curr) => acc + curr.availableQty, 0);
  const totalLocked = stocks.reduce((acc, curr) => acc + curr.reservedQty, 0);
  const totalInTransit = stocks.reduce((acc, curr) => acc + curr.inTransitQty, 0);
  const totalDefective = stocks.reduce((acc, curr) => acc + curr.damagedQty, 0);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredStocks.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenAdjust = (stock: SKUStock) => {
    setAdjustingStock(stock);
    setAdjustForm({
      availableQty: stock.availableQty,
      reservedQty: stock.reservedQty,
      damagedQty: stock.damagedQty,
      location: stock.location,
      zone: stock.zone
    });
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStock) return;

    setStocks(prev => prev.map(s => {
      if (s.id === adjustingStock.id) {
        const total = adjustForm.availableQty + adjustForm.reservedQty + adjustForm.damagedQty;
        showToast(`SKU ${s.skuCode} 库存手工盘点微调成功！`, 'success');
        return {
          ...s,
          availableQty: adjustForm.availableQty,
          reservedQty: adjustForm.reservedQty,
          damagedQty: adjustForm.damagedQty,
          location: adjustForm.location,
          zone: adjustForm.zone,
          totalQty: total,
          lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return s;
    }));

    setAdjustingStock(null);
  };

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none text-[12px] text-slate-700">
      
      {/* Toast */}
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

      {/* 1. Horizontal Sub-Tabs (按产品查询, 按库位查询, 库存流水, 批次管理) */}
      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center select-none text-[11px] font-medium text-slate-500">
        <div className="flex gap-4">
          {[
            { key: 'product', label: '按产品查询' },
            { key: 'location', label: '按库位查询' },
            { key: 'flow', label: '库存流水 (Stock Ledger)' },
            { key: 'batch', label: '批次管理 (Batch Records)' }
          ].map((tab) => {
            const isActive = querySubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setQuerySubTab(tab.key as any)}
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

      {querySubTab !== 'product' ? (
        <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <Box className="w-12 h-12 text-blue-500/20 mb-3 animate-pulse" />
          <h3 className="font-bold text-slate-800 text-sm">该子面板处于联调状态</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm">
            本演示的库存核心看板配置在 <strong>按产品查询</strong> 标签页中。请点击切换回去查看详细数据。
          </p>
          <button
            onClick={() => setQuerySubTab('product')}
            className="mt-3.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs shadow cursor-pointer transition-colors"
          >
            返回产品库存工作台
          </button>
        </div>
      ) : (
        <>
          {/* 2. Advanced Multi-Filters Row */}
          <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
            
            <div className="relative">
              <input
                type="text"
                placeholder="客户名称/代码"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="h-7 w-36 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
              <span className="text-slate-400">库存属性:</span>
              <select 
                value={propertyFilter} 
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="全部">全部属性</option>
                <option value="正品">仅看可用正品</option>
                <option value="次品">仅看破损次品</option>
                <option value="换标中">仅看正在换标</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Barcode-模糊搜索"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                className="h-7 w-40 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="搜索 SKU 编码或产品名称..."
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                className="h-7 w-60 px-2 rounded border border-slate-300 text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Reset button */}
            <button
              onClick={() => {
                setClientSearch('');
                setPropertyFilter('全部');
                setBarcodeSearch('');
                setSkuSearch('');
                showToast('库存筛选器重置成功', 'info');
              }}
              className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded text-[11px] font-semibold transition-all cursor-pointer"
            >
              重置
            </button>
          </div>

          {/* 3. High-Density Aggregations Banner (from Screenshot 3) */}
          <div className="px-3.5 py-2.5 bg-[#f8fafc] border-b border-slate-200 shrink-0 grid grid-cols-5 gap-3">
            
            <div className="bg-white border border-slate-200 rounded p-2.5 shadow-sm">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">总在库库存</div>
              <div className="mt-1 font-mono text-base font-black text-slate-800">{totalInStock.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Physical In Stock</div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-2.5 shadow-sm">
              <div className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider">可用库存 (可代发)</div>
              <div className="mt-1 font-mono text-base font-black text-emerald-600">{totalAvailable.toLocaleString()}</div>
              <div className="text-[9px] text-emerald-500/80 mt-0.5">Available for dispatch</div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-2.5 shadow-sm">
              <div className="text-amber-600 text-[10px] uppercase font-bold tracking-wider">锁定库存 (订单锁定)</div>
              <div className="mt-1 font-mono text-base font-black text-amber-600">{totalLocked.toLocaleString()}</div>
              <div className="text-[9px] text-amber-500/80 mt-0.5">Allocated / Reserved</div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-2.5 shadow-sm">
              <div className="text-blue-600 text-[10px] uppercase font-bold tracking-wider">海运在途预测</div>
              <div className="mt-1 font-mono text-base font-black text-blue-600">{totalInTransit.toLocaleString()}</div>
              <div className="text-[9px] text-blue-400 mt-0.5">In Transit Inbound</div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-2.5 shadow-sm">
              <div className="text-red-500 text-[10px] uppercase font-bold tracking-wider">异常损坏次品</div>
              <div className="mt-1 font-mono text-base font-black text-red-500">{totalDefective.toLocaleString()}</div>
              <div className="text-[9px] text-red-400 mt-0.5">Damaged / Defectives</div>
            </div>

          </div>

          {/* 4. Operation Buttons row */}
          <div className="h-9 bg-white border-b border-slate-200 px-3 flex items-center justify-between shrink-0 text-[11px]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (selectedIds.length === 0) {
                    showToast('请勾选商品进行批量转移。', 'error');
                    return;
                  }
                  alert(`批量移库动作启动！共选中 ${selectedIds.length} 项货号。`);
                }}
                className="h-6 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>库内手工转移</span>
              </button>

              <button
                onClick={() => {
                  if (selectedIds.length === 0) {
                    showToast('请先勾选需要封存冻结的商品货号。', 'error');
                    return;
                  }
                  alert(`已成功锁定/解锁 ${selectedIds.length} 个物料盘点批次！`);
                }}
                className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold cursor-pointer"
              >
                批量锁定/解锁
              </button>

              <button
                onClick={() => {
                  alert('正在生成当前全库实物盘点报表，请稍候...');
                }}
                className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>导出 WMS 库存台账</span>
              </button>
            </div>

            <div className="text-slate-400 flex items-center gap-2">
              <span>共匹配 {filteredStocks.length} 条 SKU 级货位库存记录</span>
              <RefreshCw 
                onClick={() => {
                  setStocks(INITIAL_STOCKS);
                  showToast('已同步海外仓最新的盘点实物链数据', 'success');
                }}
                className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer animate-spin-hover" 
              />
            </div>
          </div>

          {/* 5. Main spreadsheet-like Grid Table (exactly as Screenshot 3) */}
          <div className="flex-1 overflow-auto bg-slate-50">
            <table className="w-full text-left border-collapse bg-white select-none table-fixed">
              <thead>
                <tr className="bg-[#f5f7fa] text-slate-500 font-semibold border-b border-slate-200 text-[10.5px] h-8 sticky top-0 z-10">
                  <th className="w-8 text-center border-r border-slate-200/60">
                    <input 
                      type="checkbox" 
                      checked={filteredStocks.length > 0 && selectedIds.length === filteredStocks.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                  </th>
                  <th className="w-11 text-center border-r border-slate-200/60">图片</th>
                  <th className="w-56 px-2 border-r border-slate-200/60">SKU / 产品名称</th>
                  <th className="w-44 px-2 border-r border-slate-200/60">产品条码 (Barcode)</th>
                  <th className="w-44 px-2 border-r border-slate-200/60">客户</th>
                  <th className="w-20 px-2 border-r border-slate-200/60 text-right">在库库存</th>
                  <th className="w-20 px-2 border-r border-slate-200/60 text-right text-emerald-600 font-bold">可用库存</th>
                  <th className="w-20 px-2 border-r border-slate-200/60 text-right text-amber-600">锁定库存</th>
                  <th className="w-20 px-2 border-r border-slate-200/60 text-right text-blue-600">在途库存</th>
                  <th className="w-20 px-2 border-r border-slate-200/60 text-right text-red-500">次品在库</th>
                  <th className="w-20 px-2 border-r border-slate-200/60 text-right text-indigo-600">换标中</th>
                  <th className="w-32 px-2 border-r border-slate-200/60">库位 (货架/货区)</th>
                  <th className="w-36 px-2 border-r border-slate-200/60">wms尺寸</th>
                  <th className="w-24 px-2 border-r border-slate-200/60 text-right">wms重量</th>
                  <th className="w-36 px-2 border-r border-slate-200/60">最后修改时间</th>
                  <th className="w-20 px-2 text-center sticky right-0 bg-[#f5f7fa] border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-[11px]">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="h-40 text-center text-slate-400 font-medium">
                      暂无对应的实物盘点或在库数据
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const isSelected = selectedIds.includes(stock.id);
                    return (
                      <tr 
                        key={stock.id}
                        className={`hover:bg-slate-50/80 h-10 transition-colors ${
                          isSelected ? 'bg-blue-500/[0.03]' : ''
                        }`}
                      >
                        <td className="text-center border-r border-slate-100">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleSelectRow(stock.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="text-center border-r border-slate-100 p-0.5">
                          <img 
                            src={stock.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=40&auto=format&fit=crop&q=60'} 
                            alt="SKU" 
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 object-cover rounded border border-slate-200 mx-auto"
                          />
                        </td>
                        <td className="px-2 border-r border-slate-100 font-medium text-slate-800">
                          <div className="font-mono text-slate-900 font-bold leading-tight">{stock.skuCode}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={stock.skuName}>
                            {stock.skuName}
                          </div>
                        </td>
                        <td className="px-2 border-r border-slate-100 font-mono text-slate-600" title={stock.barcode}>{stock.barcode}</td>
                        <td className="px-2 border-r border-slate-100 truncate text-slate-500" title={stock.client}>{stock.client}</td>
                        
                        <td className="px-2 border-r border-slate-100 text-right font-mono font-bold text-slate-700">{stock.totalQty.toLocaleString()}</td>
                        <td className="px-2 border-r border-slate-100 text-right font-mono font-extrabold text-emerald-600">{stock.availableQty.toLocaleString()}</td>
                        <td className="px-2 border-r border-slate-100 text-right font-mono font-semibold text-amber-600">{stock.reservedQty.toLocaleString()}</td>
                        <td className="px-2 border-r border-slate-100 text-right font-mono text-blue-600">{stock.inTransitQty.toLocaleString()}</td>
                        <td className="px-2 border-r border-slate-100 text-right font-mono text-red-500">{stock.damagedQty.toLocaleString()}</td>
                        <td className="px-2 border-r border-slate-100 text-right font-mono text-indigo-500">{stock.relabellingQty.toLocaleString()}</td>
                        
                        <td className="px-2 border-r border-slate-100">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600">
                            {stock.zone} - {stock.location}
                          </span>
                        </td>
                        <td className="px-2 border-r border-slate-100 font-mono text-slate-500 text-[10.5px] truncate">{stock.dimensions}</td>
                        <td className="px-2 border-r border-slate-100 font-mono text-slate-500 text-right">{stock.weight}</td>
                        <td className="px-2 border-r border-slate-100 font-mono text-slate-400" title={stock.lastUpdatedAt}>{stock.lastUpdatedAt}</td>
                        
                        {/* Action column */}
                        <td className="px-2 text-center sticky right-0 bg-white border-l border-slate-100 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                          <button
                            onClick={() => handleOpenAdjust(stock)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-bold cursor-pointer"
                          >
                            微调
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Adjust Stock Modal Popup */}
      {adjustingStock && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <form 
            onSubmit={handleSaveAdjustment}
            className="w-[420px] bg-white rounded-xl shadow-2xl p-6 border border-slate-200 text-xs text-slate-700 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-sm font-extrabold text-slate-800">手动实物盘库微调</span>
                <div className="text-[10px] text-slate-400 mt-0.5">{adjustingStock.skuCode}</div>
              </div>
              <button 
                type="button"
                onClick={() => setAdjustingStock(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 text-[10px] text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>重要安全提示</span>
              </div>
              <p>实物库存盘点调整是最高级别的WMS写操作，会直接影响订单智能锁库和分配物流。请认真核对。</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">可用库存(正品)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustForm.availableQty}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, availableQty: Number(e.target.value) || 0 }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">锁定占用库存</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustForm.reservedQty}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, reservedQty: Number(e.target.value) || 0 }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">次品破损数量</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustForm.damagedQty}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, damagedQty: Number(e.target.value) || 0 }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">存放物理库区</label>
                <select
                  value={adjustForm.zone}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, zone: e.target.value }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="A区">A区 (重型高架区)</option>
                  <option value="B区">B区 (中轻物料柜)</option>
                  <option value="C区">C区 (退货暂存区)</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 font-semibold">精细货位货位号</label>
                <input
                  type="text"
                  required
                  placeholder="例如: A-04-03"
                  value={adjustForm.location}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingStock(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-all cursor-pointer shadow shadow-blue-500/10"
              >
                保存调整
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
