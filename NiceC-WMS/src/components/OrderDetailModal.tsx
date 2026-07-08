import { OutboundOrder } from '../types';
import { X, FileText, Calendar, Truck, User, Info, CheckCircle2, Box } from 'lucide-react';

interface OrderDetailModalProps {
  order: OutboundOrder | null;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-sans backdrop-blur-xs select-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#062B66] text-white px-4.5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5" />
            <span className="font-semibold text-xs tracking-wider">出库单详情：{order.orderNo}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar text-xs">
          
          {/* Order basic grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded border border-slate-200">
            <div>
              <span className="text-slate-400 block mb-0.5">订单状态</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                order.status === 'PICKING' ? 'bg-blue-100 text-blue-800' :
                order.status === 'REVIEWS' ? 'bg-purple-100 text-purple-800' :
                order.status === 'SHIPPED' ? 'bg-emerald-100 text-emerald-800' :
                order.status === 'CANCELLED' ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'
              }`}>
                {order.status === 'PENDING' ? '待处理' :
                 order.status === 'PICKING' ? '待拣货' :
                 order.status === 'REVIEWS' ? '待复核' :
                 order.status === 'SHIPPED' ? '已出库' :
                 order.status === 'CANCELLED' ? '已取消' : '异常'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">面单打印</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                order.labelPrinted === 'PRINTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {order.labelPrinted === 'PRINTED' ? '已打印' : '未打印'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">创建时间</span>
              <span className="text-slate-800 font-mono font-medium">{order.createdTime}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">客户代码</span>
              <span className="text-slate-800 font-medium">{order.customerCode || order.customerId}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">销售平台</span>
              <span className="text-slate-800 font-semibold">{order.salesPlatform}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">订单类型</span>
              <span className="text-slate-800">{order.orderType}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">预估重量 (Weight)</span>
              <span className="text-slate-800 font-mono font-semibold">{order.totalWeight} kg</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">包裹件数 (Qty)</span>
              <span className="text-slate-800 font-bold font-mono">{order.totalQty}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">波次号</span>
              <span className="text-slate-800 font-mono">{order.waveId ? `WV${order.waveId.substring(4, 10)}` : '-'}</span>
            </div>
          </div>

          {/* Logistics and Recipient section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Logistics details */}
            <div className="border border-slate-200 rounded p-3.5">
              <h3 className="font-semibold text-[#062B66] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Truck className="w-4 h-4" />
                <span>物流服务</span>
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">承运商:</span>
                  <span className="font-bold text-slate-800">{order.carrierName || order.carrierId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">物流渠道:</span>
                  <span className="font-mono text-slate-800">{order.logisticsChannelName}</span>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="border border-slate-200 rounded p-3.5">
              <h3 className="font-semibold text-[#062B66] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <User className="w-4 h-4" />
                <span>收件人信息</span>
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">收货地址 / 收件人:</span>
                  <span className="font-medium text-slate-800 text-right">{order.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">备注说明:</span>
                  <span className="text-slate-800">{order.remark}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Outbound Products list */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-[#062B66]" />
              <h3 className="font-semibold text-[#062B66]">出库产品明细</h3>
            </div>
            
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-1.5">SKU</th>
                  <th className="px-3 py-1.5">产品名称</th>
                  <th className="px-3 py-1.5">条码</th>
                  <th className="px-2 py-1.5 text-center">数量</th>
                  <th className="px-3 py-1.5">分类</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800">{item.skuCode}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate" title={item.productName}>{item.productName}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{item.skuBarcode}</td>
                      <td className="px-2 py-2 text-center font-bold text-slate-900">{item.qty}</td>
                      <td className="px-3 py-2 text-slate-500">{item.category}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">无明细记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 px-4.5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            关闭窗口
          </button>
        </div>

      </div>
    </div>
  );
}
