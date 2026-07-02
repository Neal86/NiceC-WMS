import React, { useState, useEffect } from 'react';
import { OutboundOrder, Customer, Carrier, LogisticsChannel, OutboundOrderItem } from '../types';
import { X, Save, Plus, Trash2, Box, Info } from 'lucide-react';

interface OrderFormModalProps {
  order: OutboundOrder | null; // Null means create, otherwise edit
  customers: Customer[];
  carriers: Carrier[];
  channels: LogisticsChannel[];
  products: any[];
  onClose: () => void;
  onSave: (orderData: any) => void;
}

export default function OrderFormModal({
  order,
  customers,
  carriers,
  channels,
  products,
  onClose,
  onSave
}: OrderFormModalProps) {
  const isEdit = !!order;

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [logisticsChannelId, setLogisticsChannelId] = useState('');
  const [salesPlatform, setSalesPlatform] = useState('Amazon');
  const [orderType, setOrderType] = useState('单品单件');
  const [recipient, setRecipient] = useState('');
  const [remark, setRemark] = useState('');
  const [status, setStatus] = useState<any>('PENDING');

  // Order Items state
  const [items, setItems] = useState<Partial<OutboundOrderItem>[]>([
    { skuCode: '', productName: '', qty: 1, category: '汽车配件' }
  ]);

  // Load editing values if in Edit mode
  useEffect(() => {
    if (order) {
      setCustomerId(order.customerId);
      setCarrierId(order.carrierId);
      setLogisticsChannelId(order.logisticsChannelId);
      setSalesPlatform(order.salesPlatform);
      setOrderType(order.orderType);
      setRecipient(order.recipient);
      setRemark(order.remark === '-' ? '' : order.remark);
      setStatus(order.status);
      
      if (order.items && order.items.length > 0) {
        setItems(order.items.map(i => ({ ...i })));
      }
    } else {
      // Default creation setups
      if (customers.length > 0) setCustomerId(customers[0].id);
      if (carriers.length > 0) setCarrierId(carriers[0].id);
      if (channels.length > 0) setLogisticsChannelId(channels[0].id);
    }
  }, [order, customers, carriers, channels]);

  // Handle Carrier change -> Auto select first available channel for that carrier
  const handleCarrierChange = (newCarrierId: string) => {
    setCarrierId(newCarrierId);
    const relatedChannels = channels.filter(c => c.carrierId === newCarrierId);
    if (relatedChannels.length > 0) {
      setLogisticsChannelId(relatedChannels[0].id);
    }
  };

  // Modify SKU item line
  const handleItemChange = (index: number, key: keyof OutboundOrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    
    // Auto populate product name if SKU is selected from existing list
    if (key === 'skuCode') {
      const match = products.find(p => p.sku === value);
      if (match) {
        updated[index].productName = match.name;
        updated[index].category = match.category;
        updated[index].skuId = match.id;
        updated[index].skuBarcode = match.barcode;
      } else {
        // Fallback or custom SKU creation
        updated[index].skuBarcode = value;
      }
    }

    setItems(updated);
  };

  const handleAddItemLine = () => {
    setItems([...items, { skuCode: '', productName: '', qty: 1, category: '汽车配件' }]);
  };

  const handleRemoveItemLine = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check valid lines
    const validItems = items.filter(i => i.skuCode && i.productName && (i.qty || 0) > 0);
    if (validItems.length === 0) {
      alert('请至少添加一个包含有效 SKU 和产品名称的产品明细行。');
      return;
    }

    const payload = {
      customerId,
      carrierId,
      logisticsChannelId,
      salesPlatform,
      orderType,
      recipient,
      remark: remark || '-',
      status,
      items: validItems
    };

    onSave(payload);
  };

  // Filter channels list based on current carrier selection
  const filteredChannels = channels.filter(c => c.carrierId === carrierId);

  return (
    <div id="form-modal-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-sans backdrop-blur-xs select-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#062B66] text-white px-4.5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4.5 h-4.5" />
            <span className="font-semibold text-xs tracking-wider">
              {isEdit ? `修改出库单：${order?.orderNo}` : '新建一件代发出库单'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left side column */}
            <div className="space-y-3.5">
              
              {/* Customer Selector */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">所属客户 *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.code}</option>
                  ))}
                </select>
              </div>

              {/* Carrier & Channel */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">承运商 *</label>
                  <select
                    required
                    value={carrierId}
                    onChange={(e) => handleCarrierChange(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  >
                    {carriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">物流渠道 *</label>
                  <select
                    required
                    value={logisticsChannelId}
                    onChange={(e) => setLogisticsChannelId(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  >
                    {filteredChannels.map((chan) => (
                      <option key={chan.id} value={chan.id}>{chan.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Platform & Order Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">销售平台</label>
                  <select
                    value={salesPlatform}
                    onChange={(e) => setSalesPlatform(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Shopify">Shopify</option>
                    <option value="eBay">eBay</option>
                    <option value="Walmart">Walmart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">订单品种类型</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="单品单件">单品单件</option>
                    <option value="单品多件">单品多件</option>
                    <option value="多品多件">多品多件</option>
                  </select>
                </div>
              </div>

              {/* Status Selector - Only visible when editing */}
              {isEdit && (
                <div>
                  <label className="block text-slate-500 font-medium mb-1">订单处理阶段</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="PENDING">待处理</option>
                    <option value="PICKING">待拣货</option>
                    <option value="REVIEWS">待复核</option>
                    <option value="SHIPPING">待出库</option>
                    <option value="SHIPPED">已出库</option>
                    <option value="EXCEPTIONS">异常</option>
                    <option value="CANCELLED">已取消</option>
                  </select>
                </div>
              )}

            </div>

            {/* Right side column */}
            <div className="space-y-3.5">
              
              {/* Recipient Input */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">收件地址 / 接收人姓名 *</label>
                <textarea
                  required
                  rows={3}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="例如: Michael Chang, 1045 Tech Blvd, Houston, TX, 77001, USA"
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 resize-none font-sans"
                />
              </div>

              {/* Remark */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">出库备注</label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="例如: SN/序列号、特定交付等说明"
                  className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>

          </div>

          {/* Lines of SKU details */}
          <div className="border border-slate-200 rounded mt-4 overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">出库产品与 SKU 配置 (至少配置1项)</span>
              
              <button
                type="button"
                onClick={handleAddItemLine}
                className="h-6 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>增加产品明细</span>
              </button>
            </div>

            {/* SKU Config Table */}
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-1.5 w-[150px]">SKU 编码 *</th>
                  <th className="px-3 py-1.5">产品名称 *</th>
                  <th className="px-2 py-1.5 w-[75px] text-center">出货数量 *</th>
                  <th className="px-3 py-1.5 w-[110px]">产品分类</th>
                  <th className="px-3 py-1.5 w-[50px] text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    
                    {/* SKU Code selection / input */}
                    <td className="px-3 py-1.5">
                      <select
                        required
                        value={item.skuCode}
                        onChange={(e) => handleItemChange(index, 'skuCode', e.target.value)}
                        className="w-full h-7 px-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white font-mono"
                      >
                        <option value="">-- 选择 SKU --</option>
                        {/* Demo preset SKUs */}
                        <option value="289-TX-69">289-TX-69 (Tacoma Running Boards)</option>
                        <option value="LJJX-TX-38">LJJX-TX-38 (Wrangler Tubular Steps)</option>
                        <option value="LJJX-TX-33">LJJX-TX-33 (Silverado Crew Cab Steps)</option>
                        <option value="TS-V-NA-4">TS-V-NA-4 (Smart Safety Knob)</option>
                      </select>
                    </td>

                    {/* Product Name input */}
                    <td className="px-3 py-1.5">
                      <input
                        required
                        type="text"
                        value={item.productName || ''}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        placeholder="产品英文或中文品名"
                        className="w-full h-7 px-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-2 py-1.5">
                      <input
                        required
                        type="number"
                        min="1"
                        value={item.qty || 1}
                        onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value, 10) || 1)}
                        className="w-full h-7 text-center border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-bold font-mono"
                      />
                    </td>

                    {/* Category Selection */}
                    <td className="px-3 py-1.5">
                      <select
                        value={item.category || '未分类'}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className="w-full h-7 px-1 bg-white border border-slate-300 rounded focus:outline-none"
                      >
                        <option value="汽车配件">汽车配件</option>
                        <option value="智能家居">智能家居</option>
                        <option value="办公用品">办公用品</option>
                        <option value="未分类">未分类</option>
                      </select>
                    </td>

                    {/* Remove item line */}
                    <td className="px-3 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemLine(index)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions panel */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="submit"
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs flex items-center gap-1 transition-colors shadow cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>保存出库单</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
