import React, { useState } from 'react';
import { FilterParams, Customer, Carrier, LogisticsChannel } from '../types';
import { Search, Calendar, ChevronDown, RotateCcw, Filter } from 'lucide-react';

interface FilterSectionProps {
  customers: Customer[];
  carriers: Carrier[];
  channels: LogisticsChannel[];
  categories: string[];
  onFilterChange: (filters: Partial<FilterParams>) => void;
}

export default function FilterSection({
  customers,
  carriers,
  channels,
  categories,
  onFilterChange
}: FilterSectionProps) {
  // Local state for all fields
  const [customerNameCode, setCustomerNameCode] = useState('');
  const [orderType, setOrderType] = useState('');
  const [salesPlatform, setSalesPlatform] = useState('');
  const [logisticsChannel, setLogisticsChannel] = useState('');
  const [carrier, setCarrier] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [warehouseZone, setWarehouseZone] = useState('');
  const [metricUnit, setMetricUnit] = useState('公制单位');
  const [location, setLocation] = useState('');
  const [skuQtyExplosive, setSkuQtyExplosive] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sku, setSku] = useState('');
  const [outboundOrderNo, setOutboundOrderNo] = useState('');
  
  // Date states - Default values close to screenshot range: 2026-03-29 to 2026-06-30
  const [createdTimeStart, setCreatedTimeStart] = useState('2026-03-29');
  const [createdTimeEnd, setCreatedTimeEnd] = useState('2026-06-30');
  
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      customerNameCode: customerNameCode || undefined,
      orderType: orderType || undefined,
      salesPlatform: salesPlatform || undefined,
      logisticsChannel: logisticsChannel || undefined,
      carrier: carrier || undefined,
      productCategory: productCategory || undefined,
      destinationCountry: destinationCountry || undefined,
      warehouseZone: warehouseZone || undefined,
      metricUnit: metricUnit || undefined,
      location: location || undefined,
      skuQtyExplosive: skuQtyExplosive || undefined,
      recipient: recipient || undefined,
      sku: sku || undefined,
      outboundOrderNo: outboundOrderNo || undefined,
      createdTimeStart: createdTimeStart ? `${createdTimeStart} 00:00:00` : undefined,
      createdTimeEnd: createdTimeEnd ? `${createdTimeEnd} 23:59:59` : undefined,
      minQty: minQty ? parseInt(minQty, 10) : undefined,
      maxQty: maxQty ? parseInt(maxQty, 10) : undefined,
    });
  };

  const handleReset = () => {
    setCustomerNameCode('');
    setOrderType('');
    setSalesPlatform('');
    setLogisticsChannel('');
    setCarrier('');
    setProductCategory('');
    setDestinationCountry('');
    setWarehouseZone('');
    setMetricUnit('公制单位');
    setLocation('');
    setSkuQtyExplosive('');
    setRecipient('');
    setSku('');
    setOutboundOrderNo('');
    setCreatedTimeStart('2026-03-29');
    setCreatedTimeEnd('2026-06-30');
    setMinQty('');
    setMaxQty('');

    // Trigger parent update with reset values
    onFilterChange({
      customerNameCode: undefined,
      orderType: undefined,
      salesPlatform: undefined,
      logisticsChannel: undefined,
      carrier: undefined,
      productCategory: undefined,
      destinationCountry: undefined,
      warehouseZone: undefined,
      metricUnit: '公制单位',
      location: undefined,
      skuQtyExplosive: undefined,
      recipient: undefined,
      sku: undefined,
      outboundOrderNo: undefined,
      createdTimeStart: '2026-03-29 00:00:00',
      createdTimeEnd: '2026-06-30 23:59:59',
      minQty: undefined,
      maxQty: undefined,
    });
  };

  return (
    <div id="filter-section-container" className="bg-white p-3 border-b border-slate-200 select-none text-[11px] font-sans">
      {/* 4x Grid columns or flex wrap to be highly dense and look like screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9 gap-2 items-center">
        
        {/* 1. 客户名称/代码 */}
        <div className="relative">
          <select
            value={customerNameCode}
            onChange={(e) => { setCustomerNameCode(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700 font-medium"
          >
            <option value="">客户名称/代码</option>
            {customers.map((c) => (
              <option key={c.id} value={c.code}>{c.code}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 2. 订单品种类型 */}
        <div className="relative">
          <select
            value={orderType}
            onChange={(e) => { setOrderType(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">订单品种类型</option>
            <option value="单品单件">单品单件</option>
            <option value="单品多件">单品多件</option>
            <option value="多品多件">多品多件</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 3. 销售平台 */}
        <div className="relative">
          <select
            value={salesPlatform}
            onChange={(e) => { setSalesPlatform(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">销售平台</option>
            <option value="Amazon">Amazon</option>
            <option value="Shopify">Shopify</option>
            <option value="eBay">eBay</option>
            <option value="Walmart">Walmart</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 4. 物流渠道 */}
        <div className="relative">
          <select
            value={logisticsChannel}
            onChange={(e) => { setLogisticsChannel(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">物流渠道</option>
            {channels.map((chan) => (
              <option key={chan.id} value={chan.id}>{chan.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 5. 承运商 */}
        <div className="relative">
          <select
            value={carrier}
            onChange={(e) => { setCarrier(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">承运商</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 6. 产品分类 */}
        <div className="relative">
          <select
            value={productCategory}
            onChange={(e) => { setProductCategory(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">产品分类</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 7. 目的国家 */}
        <div className="relative">
          <select
            value={destinationCountry}
            onChange={(e) => { setDestinationCountry(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">目的国家</option>
            <option value="USA">美国 (USA)</option>
            <option value="CAN">加拿大 (CAN)</option>
            <option value="GBR">英国 (GBR)</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 8. 库区 */}
        <div className="relative">
          <select
            value={warehouseZone}
            onChange={(e) => { setWarehouseZone(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700"
          >
            <option value="">库区</option>
            <option value="A区">A区 (重货区)</option>
            <option value="B区">B区 (轻小件区)</option>
            <option value="C区">C区 (爆品区)</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
        </div>

        {/* 9. 公制单位 */}
        <div className="relative">
          <select
            value={metricUnit}
            onChange={(e) => setMetricUnit(e.target.value)}
            className="w-full h-7 pl-2 pr-6 bg-slate-50 border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 appearance-none text-slate-700 font-semibold"
          >
            <option value="公制单位">公制单位</option>
            <option value="英制单位">英制单位</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-500 pointer-events-none" />
        </div>

        {/* 10. 库位 */}
        <div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder="库位"
            className="w-full h-7 px-2 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* 11. SKU * 数量 (爆品) */}
        <div className="relative">
          <input
            type="text"
            value={skuQtyExplosive}
            onChange={(e) => setSkuQtyExplosive(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder="SKU * 数量 (爆品)"
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-slate-400" />
        </div>

        {/* 12. 收件人 */}
        <div className="relative">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder="收件人"
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-slate-400" />
        </div>

        {/* 13. SKU */}
        <div className="relative">
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder="SKU"
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-slate-400" />
        </div>

        {/* 14. 出库单号 */}
        <div className="relative col-span-1 md:col-span-1">
          <input
            type="text"
            value={outboundOrderNo}
            onChange={(e) => setOutboundOrderNo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder="出库单号"
            className="w-full h-7 pl-2 pr-6 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400 font-mono"
          />
          <Search className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-slate-400" />
        </div>

        {/* 15. 创建时间日期范围 */}
        <div className="col-span-2 flex items-center gap-1 bg-white border border-slate-300 rounded h-7 px-1.5 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="date"
            value={createdTimeStart}
            onChange={(e) => { setCreatedTimeStart(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="bg-transparent border-none text-[10px] w-24 p-0 text-slate-600 focus:outline-none font-mono"
          />
          <span className="text-slate-300">~</span>
          <input
            type="date"
            value={createdTimeEnd}
            onChange={(e) => { setCreatedTimeEnd(e.target.value); setTimeout(handleApplyFilters, 50); }}
            className="bg-transparent border-none text-[10px] w-24 p-0 text-slate-600 focus:outline-none font-mono"
          />
        </div>

        {/* 16. 最小数量 ~ 最大数量 */}
        <div className="col-span-1 flex items-center border border-slate-300 rounded h-7 bg-white">
          <input
            type="number"
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            placeholder="最小数量"
            className="w-1/2 h-full text-center p-0 text-[10px] focus:outline-none border-none text-slate-700"
          />
          <span className="text-slate-300 bg-slate-50 px-1 font-mono">→</span>
          <input
            type="number"
            value={maxQty}
            onChange={(e) => setMaxQty(e.target.value)}
            placeholder="最大数量"
            className="w-1/2 h-full text-center p-0 text-[10px] focus:outline-none border-none text-slate-700"
          />
        </div>

        {/* 17. 常用动作 / 按钮 */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2 flex items-center gap-1.5 pt-0.5">
          <button
            onClick={handleApplyFilters}
            className="h-7 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>查询</span>
          </button>
          
          <button
            onClick={handleReset}
            className="h-7 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded font-medium flex items-center gap-1 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>重置</span>
          </button>

          <button
            onClick={() => alert('已载入您的常用 WMS 出库筛选视图')}
            className="h-7 px-2.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded font-medium flex items-center gap-1 transition-all cursor-pointer"
          >
            <Filter className="w-3 h-3 text-slate-400" />
            <span>常用筛选</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

      </div>
    </div>
  );
}
