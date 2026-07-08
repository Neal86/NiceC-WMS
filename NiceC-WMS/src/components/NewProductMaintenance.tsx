import React, { useState } from 'react';
import { 
  Search, RefreshCw, Layers, SlidersHorizontal, Settings, 
  HelpCircle, Ruler, Scale, Cpu, FileCheck2, ArrowRight
} from 'lucide-react';

interface ProductMeasure {
  id: string;
  sku: string;
  name: string;
  client: string;
  wmsDimensions: string; // Length * Width * Height
  wmsWeight: string;
  omsDimensions: string;
  omsWeight: string;
  measureTime: string;
}

const INITIAL_MEASUREMENTS: ProductMeasure[] = [
  {
    id: 'pm_1',
    sku: '001-JCX-01-2',
    name: '001#交叉心-01',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_2',
    sku: '001-JCX-02-2',
    name: '001#交叉心-02',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_3',
    sku: '001-JCX-03-2',
    name: '001#交叉心-03',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_4',
    sku: '001-JCX-06-2',
    name: '001#交叉心-06',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_5',
    sku: '001-JCX-07-2',
    name: '001#交叉心-07',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_6',
    sku: '001-JCX-08-2',
    name: '001#交叉心-08',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_7',
    sku: '001-JCX-09-2',
    name: '001#交叉心-09',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_8',
    sku: '001-JCX-10-2',
    name: '001#交叉心-10',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.575 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_9',
    sku: '01GDXX-1',
    name: '3-01DXX大小心',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.134 * 3.15 * 1.969 in',
    omsWeight: '0.287 lb',
    measureTime: '-'
  },
  {
    id: 'pm_10',
    sku: '01WXX-01',
    name: '4-01WXX无限心',
    client: '具奥 (1108029)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '4.724 * 3.937 * 2.362 in',
    omsWeight: '0.282 lb',
    measureTime: '-'
  },
  {
    id: 'pm_11',
    sku: '0207-R2313BlackAG39',
    name: 'R2313',
    client: '泉州之道 - 鞋子类 - 一件代发(1108035)',
    wmsDimensions: '-',
    wmsWeight: '-',
    omsDimensions: '9.843 * 5.906 * 3.937 in',
    omsWeight: '1.323 lb',
    measureTime: '-'
  }
];

export default function NewProductMaintenance() {
  const [products, setProducts] = useState<ProductMeasure[]>(INITIAL_MEASUREMENTS);
  const [clientSearch, setClientSearch] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [searchType, setSearchType] = useState('sku');

  // Interactive 测显 Modal state
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMeasure | null>(null);
  
  // Measured values form
  const [lengthVal, setLengthVal] = useState('');
  const [widthVal, setWidthVal] = useState('');
  const [heightVal, setHeightVal] = useState('');
  const [weightVal, setWeightVal] = useState('');
  const [unitType, setUnitType] = useState<'in' | 'cm'>('in');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [isCapturing, setIsCapturing] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReset = () => {
    setClientSearch('');
    setSearchVal('');
    setSearchType('sku');
    showToast('已重置新品尺寸维护筛选条件', 'info');
  };

  const filteredProducts = products.filter(p => {
    if (clientSearch && !p.client.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    if (searchVal) {
      const sLower = searchVal.toLowerCase();
      if (searchType === 'sku' && !p.sku.toLowerCase().includes(sLower)) return false;
      if (searchType === 'name' && !p.name.toLowerCase().includes(sLower)) return false;
    }
    return true;
  });

  const handleOpenMeasure = (p: ProductMeasure) => {
    setSelectedProduct(p);
    
    // Auto-prepopulate OMS reference sizes to start with
    const sizes = p.omsDimensions.replace(' in', '').replace(' cm', '').split('*').map(s => s.trim());
    const weight = p.omsWeight.replace(' lb', '').replace(' kg', '').trim();
    
    setLengthVal(sizes[0] || '');
    setWidthVal(sizes[1] || '');
    setHeightVal(sizes[2] || '');
    setWeightVal(weight || '');
    
    setUnitType(p.omsDimensions.includes('in') ? 'in' : 'cm');
    setWeightUnit(p.omsWeight.includes('lb') ? 'lb' : 'kg');

    setIsMeasureModalOpen(true);
  };

  const handleAutoCapture = () => {
    setIsCapturing(true);
    showToast('正在通过 WMS 智能红外激光光幕测重仪自动感应货品...', 'info');
    
    setTimeout(() => {
      // Mock light-curtain sensor capturing slightly altered and high-precision measurements
      if (selectedProduct) {
        const sizes = selectedProduct.omsDimensions.replace(' in', '').replace(' cm', '').split('*').map(s => parseFloat(s.trim()));
        const weight = parseFloat(selectedProduct.omsWeight.replace(' lb', '').replace(' kg', '').trim());

        // Introduce a slight variance for realism
        const laserLength = (sizes[0] ? (sizes[0] * (0.98 + Math.random() * 0.04)).toFixed(3) : '4.130');
        const laserWidth = (sizes[1] ? (sizes[1] * (0.98 + Math.random() * 0.04)).toFixed(3) : '3.148');
        const laserHeight = (sizes[2] ? (sizes[2] * (0.98 + Math.random() * 0.04)).toFixed(3) : '1.572');
        const sensorWeight = (weight ? (weight * (0.97 + Math.random() * 0.06)).toFixed(3) : '0.285');

        setLengthVal(laserLength);
        setWidthVal(laserWidth);
        setHeightVal(laserHeight);
        setWeightVal(sensorWeight);

        showToast('高精度光幕传感器和重力电子秤校准成功！数据已全自动填入。', 'success');
      }
      setIsCapturing(false);
    }, 1200);
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const wmsDimStr = `${lengthVal || '0'} * ${widthVal || '0'} * ${heightVal || '0'} ${unitType}`;
    const wmsWtStr = `${weightVal || '0'} ${weightUnit}`;

    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          wmsDimensions: wmsDimStr,
          wmsWeight: wmsWtStr,
          measureTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return p;
    }));

    showToast(`SKU ${selectedProduct.sku} 的 WMS 实测数据 (${wmsDimStr}, ${wmsWtStr}) 保存成功！`, 'success');
    setIsMeasureModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans text-[12px] text-slate-700 select-none">
      
      {/* Toast banner */}
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

      {/* 1. Header Filter Row */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
        
        {/* Client Selector */}
        <div className="flex items-center border border-slate-300 rounded h-7 px-2 bg-slate-50 text-[11px]">
          <span className="text-slate-500 font-medium">客户:</span>
          <input
            type="text"
            placeholder="客户名称/代码"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="h-full px-1.5 bg-transparent outline-none text-slate-700 font-semibold w-32"
          />
        </div>

        {/* Dynamic Search selector */}
        <div className="flex items-center border border-slate-300 rounded overflow-hidden h-7 bg-white text-[11px]">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="h-full px-1 bg-slate-50 text-slate-600 border-r border-slate-300 outline-none font-semibold cursor-pointer"
          >
            <option value="sku">SKU</option>
            <option value="name">产品名称</option>
          </select>
          <input
            type="text"
            placeholder="请输入关键字..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="h-full px-2 w-48 outline-none"
          />
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="h-7 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded font-bold transition-all cursor-pointer"
        >
          重置
        </button>

      </div>

      {/* 2. Secondary Title & Summary Row */}
      <div className="h-9 bg-[#f9fafb] border-b border-slate-200 px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">领星 WMS 待测新品尺寸清单</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-medium">建议将实测尺寸重量回填，以确保包装计算、出库核重和国际空海运体积计费准确。</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>共 {filteredProducts.length} 个新品待维护 WMS 实测数据</span>
          <RefreshCw
            onClick={() => {
              setProducts(INITIAL_MEASUREMENTS);
              showToast('已重新加载最新待测产品列表', 'success');
            }}
            className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Data Grid Table */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full border-collapse bg-white select-none text-left table-fixed">
          <thead>
            <tr className="bg-[#f5f7fa] text-slate-500 font-semibold border-b border-slate-200 text-[10.5px] h-8 sticky top-0 z-10">
              <th className="w-44 px-3.5 border-r border-slate-200/60">SKU</th>
              <th className="w-56 px-2 border-r border-slate-200/60">产品名称</th>
              <th className="w-52 px-2 border-r border-slate-200/60">客户</th>
              <th className="w-36 px-2 border-r border-slate-200/60 text-center text-amber-700 bg-amber-50/20">WMS 测量尺寸</th>
              <th className="w-28 px-2 border-r border-slate-200/60 text-center text-amber-700 bg-amber-50/20">WMS 测量重量</th>
              <th className="w-36 px-2 border-r border-slate-200/60 text-center text-slate-600">oms 尺寸</th>
              <th className="w-28 px-2 border-r border-slate-200/60 text-center text-slate-600">oms 重量</th>
              <th className="w-36 px-2 border-r border-slate-200/60">测量时间</th>
              <th className="w-20 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-[11px]">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="h-40 text-center text-slate-400 font-medium">
                  所有新品均已完成尺寸和重量实测，暂无待维护项
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => {
                const hasWmsData = p.wmsDimensions !== '-';
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 h-9.5 transition-colors"
                  >
                    <td className="px-3.5 border-r border-slate-100 font-mono font-bold text-blue-600 hover:underline cursor-pointer">
                      {p.sku}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-medium text-slate-700 truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="px-2 border-r border-slate-100 text-slate-500 truncate" title={p.client}>
                      {p.client}
                    </td>
                    <td className={`px-2 border-r border-slate-100 font-mono text-center font-semibold ${
                      hasWmsData ? 'text-emerald-700 bg-emerald-500/[0.02]' : 'text-slate-400'
                    }`}>
                      {p.wmsDimensions}
                    </td>
                    <td className={`px-2 border-r border-slate-100 font-mono text-center font-semibold ${
                      hasWmsData ? 'text-emerald-700 bg-emerald-500/[0.02]' : 'text-slate-400'
                    }`}>
                      {p.wmsWeight}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 text-center">
                      {p.omsDimensions}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500 text-center">
                      {p.omsWeight}
                    </td>
                    <td className={`px-2 border-r border-slate-100 font-mono ${
                      hasWmsData ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {p.measureTime}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleOpenMeasure(p)}
                        className="text-blue-600 hover:text-blue-800 font-bold transition-all cursor-pointer flex items-center justify-center mx-auto gap-0.5"
                      >
                        <Ruler className="w-3 h-3 text-blue-500" />
                        <span>测显</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 测显 Interactive Modal */}
      {isMeasureModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center">
          <form 
            onSubmit={handleSaveMeasurement}
            className="w-[480px] bg-white rounded-xl shadow-2xl p-5 border border-slate-200 space-y-4 text-xs text-slate-700"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>货品高精度WMS测显仪录入</span>
              </span>
              <button 
                type="button"
                onClick={() => {
                  setIsMeasureModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target info */}
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-1">
              <div className="flex">
                <span className="text-slate-500 w-16">货品 SKU:</span>
                <span className="font-mono font-bold text-blue-700">{selectedProduct.sku}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-16">产品名称:</span>
                <span className="font-semibold text-slate-800">{selectedProduct.name}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-16">OMS预报:</span>
                <span className="font-mono text-slate-600">
                  {selectedProduct.omsDimensions} / {selectedProduct.omsWeight}
                </span>
              </div>
            </div>

            {/* Smart Hardware trigger */}
            <div className="bg-slate-50 p-2 rounded border border-dashed border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Cpu className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className="font-semibold text-[11px]">NiceC WMS 蓝牙称重光幕一体机</span>
              </div>
              <button
                type="button"
                onClick={handleAutoCapture}
                disabled={isCapturing}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded text-[10.5px] transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                {isCapturing ? '正在感应...' : '自动读取感应器数据'}
              </button>
            </div>

            {/* Manual entry inputs */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-slate-50/30">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-slate-500" />
                    <span>外箱实测尺寸</span>
                  </span>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded text-[10px] px-1 focus:outline-none"
                  >
                    <option value="in">英寸 (in)</option>
                    <option value="cm">厘米 (cm)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 w-6">长:</span>
                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="L"
                      value={lengthVal}
                      onChange={(e) => setLengthVal(e.target.value)}
                      className="h-7 w-28 px-2 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 w-6">宽:</span>
                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="W"
                      value={widthVal}
                      onChange={(e) => setWidthVal(e.target.value)}
                      className="h-7 w-28 px-2 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 w-6">高:</span>
                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="H"
                      value={heightVal}
                      onChange={(e) => setHeightVal(e.target.value)}
                      className="h-7 w-28 px-2 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-slate-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-slate-500" />
                      <span>外箱实测重量</span>
                    </span>
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded text-[10px] px-1 focus:outline-none"
                    >
                      <option value="lb">磅 (lb)</option>
                      <option value="kg">千克 (kg)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3">
                    <span className="text-slate-500 w-8">毛重:</span>
                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="G.W."
                      value={weightVal}
                      onChange={(e) => setWeightVal(e.target.value)}
                      className="h-8 w-28 px-2 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 font-mono font-bold text-center text-blue-700"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-amber-50 p-1.5 rounded border border-amber-100 leading-relaxed mt-2">
                  提示：实测长宽高将自动参与出货纸箱自动排箱体积重校准。
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMeasureModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow transition-all cursor-pointer flex items-center gap-1"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>确认提交测显</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
