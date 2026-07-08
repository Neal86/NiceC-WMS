import React, { useState } from 'react';
import { OutboundOrder, OrderStatus } from '../types';
import { 
  FileText, Edit, Trash2, Printer, Check, ChevronDown, 
  ChevronLeft, ChevronRight, AlertCircle, Eye, MoreHorizontal
} from 'lucide-react';

interface OrderTableProps {
  orders: OutboundOrder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectAll: (selected: boolean) => void;
  onSelectRow: (id: string, selected: boolean) => void;
  selectedIds: string[];
  onEdit: (order: OutboundOrder) => void;
  onDelete: (id: string) => void;
  onViewDetails: (order: OutboundOrder) => void;
  onTogglePrintStatus: (id: string, currentStatus: 'PRINTED' | 'NOT_PRINTED') => void;
}

export default function OrderTable({
  orders,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectAll,
  onSelectRow,
  selectedIds,
  onEdit,
  onDelete,
  onViewDetails,
  onTogglePrintStatus
}: OrderTableProps) {
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const isAllSelected = orders.length > 0 && orders.every(o => selectedIds.includes(o.id));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Toggle single row dropdown menu
  const toggleActionMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeActionMenuId === id) {
      setActiveActionMenuId(null);
    } else {
      setActiveActionMenuId(id);
    }
  };

  return (
    <div id="order-table-wrapper" className="flex-1 bg-white flex flex-col overflow-hidden font-sans select-none relative">
      
      {/* Outer Scroll Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-[11px] text-left border-collapse min-w-[1400px]">
          
          {/* Table Header */}
          <thead className="bg-[#f5f7fa] text-slate-600 font-semibold sticky top-0 border-b border-slate-200 shadow-sm z-10 h-8">
            <tr>
              {/* Checkbox */}
              <th className="w-9 text-center px-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                />
              </th>
              
              <th className="px-3 py-1.5 w-[140px]">出库单号</th>
              <th className="px-3 py-1.5 w-[110px]">备注</th>
              <th className="px-2 py-1.5 w-[65px] text-center">产品数量</th>
              <th className="px-3 py-1.5 w-[130px]">SKU * 数量</th>
              <th className="px-3 py-1.5 w-[160px]">产品条码 * 数量</th>
              <th className="px-3 py-1.5 min-w-[220px]">产品名称</th>
              <th className="px-3 py-1.5 w-[90px]">产品分类</th>
              <th className="px-3 py-1.5 w-[120px]">波次号</th>
              <th className="px-2 py-1.5 w-[75px] text-center">面单打印</th>
              <th className="px-3 py-1.5 w-[125px]">客户</th>
              <th className="px-3 py-1.5 w-[90px]">订单品种类型</th>
              <th className="px-3 py-1.5 w-[160px]">物流渠道</th>
              <th className="px-3 py-1.5 w-[90px]">承运商</th>
              <th className="px-3 py-1.5 w-[95px] text-center sticky right-0 bg-[#f5f7fa] border-l border-slate-200">操作</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-1.5 justify-center">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <span>暂无符合筛选条件的出库单数据</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                
                // Construct SKU string & Barcode string nicely
                const primaryItem = order.items && order.items[0];
                const skuQtyStr = primaryItem ? `${primaryItem.skuCode} * ${primaryItem.qty}` : '-';
                const barcodeQtyStr = primaryItem ? `${primaryItem.skuBarcode} | ${primaryItem.skuBarcode} * ${primaryItem.qty}` : '-';
                const productName = primaryItem ? primaryItem.productName : '-';
                const category = primaryItem ? primaryItem.category : '-';

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => onViewDetails(order)}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer h-7.5 ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Checkbox cell */}
                    <td className="text-center px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow(order.id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                      />
                    </td>

                    {/* Order No */}
                    <td className="px-3 font-mono font-semibold text-blue-600 hover:underline">
                      {order.orderNo}
                    </td>

                    {/* Remark */}
                    <td className="px-3 text-slate-500 max-w-[110px] truncate" title={order.remark}>
                      {order.remark}
                    </td>

                    {/* Product Qty */}
                    <td className="px-2 text-center font-semibold text-slate-800">
                      {order.totalQty}
                    </td>

                    {/* SKU * Qty */}
                    <td className="px-3 text-slate-600 font-medium truncate max-w-[130px]" title={skuQtyStr}>
                      {skuQtyStr}
                    </td>

                    {/* Barcode * Qty */}
                    <td className="px-3 font-mono text-slate-500 truncate max-w-[160px]" title={barcodeQtyStr}>
                      {barcodeQtyStr}
                    </td>

                    {/* Product Name */}
                    <td className="px-3 text-slate-700 truncate max-w-[220px]" title={productName}>
                      {productName}
                    </td>

                    {/* Category */}
                    <td className="px-3 text-slate-500 truncate max-w-[90px]" title={category}>
                      {category}
                    </td>

                    {/* Wave No */}
                    <td className="px-3 text-slate-500 font-mono">
                      {order.waveId ? `WV${order.waveId.substring(4, 10)}` : '-'}
                    </td>

                    {/* Label Printed status - Styled exactly like corporate SaaS */}
                    <td className="px-2 text-center">
                      {order.labelPrinted === 'PRINTED' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          已打印
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          未打印
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-3 text-slate-700 truncate max-w-[125px]" title={order.customerCode}>
                      {order.customerCode || order.customerId}
                    </td>

                    {/* Order Type */}
                    <td className="px-3 text-slate-600">
                      {order.orderType}
                    </td>

                    {/* Logistics Channel */}
                    <td className="px-3 text-slate-600 font-mono truncate max-w-[160px]" title={order.logisticsChannelName}>
                      {order.logisticsChannelName}
                    </td>

                    {/* Carrier */}
                    <td className="px-3 text-slate-500 font-bold">
                      {order.carrierName || order.carrierId}
                    </td>

                    {/* Actions sticky column */}
                    <td 
                      className="px-3 text-center sticky right-0 bg-white border-l border-slate-100 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => onEdit(order)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                        >
                          编辑
                        </button>

                        <span className="text-slate-300">|</span>

                        {/* Actions dropdown trigger */}
                        <div className="relative">
                          <button
                            onClick={(e) => toggleActionMenu(order.id, e)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold"
                          >
                            <span>操作</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Dropdown Options */}
                          {activeActionMenuId === order.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-20" 
                                onClick={() => setActiveActionMenuId(null)}
                              ></div>
                              <ul className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded shadow-lg py-1 z-30 text-[10px] text-slate-700 font-sans text-left">
                                <li>
                                  <button
                                    onClick={() => {
                                      onViewDetails(order);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>查看详情</span>
                                  </button>
                                </li>
                                <li>
                                  <button
                                    onClick={() => {
                                      onTogglePrintStatus(order.id, order.labelPrinted);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{order.labelPrinted === 'PRINTED' ? '标记未打印' : '标记已打印'}</span>
                                  </button>
                                </li>
                                <li className="border-t border-slate-100 my-1"></li>
                                <li>
                                  <button
                                    onClick={() => {
                                      if (confirm(`确认要删除出库单 ${order.orderNo} 吗？`)) {
                                        onDelete(order.id);
                                      }
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5 font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    <span>删除订单</span>
                                  </button>
                                </li>
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

      {/* Footer statistics + Pagination row */}
      <div id="table-footer-stats" className="h-8 bg-slate-50 border-t border-slate-200 px-3.5 flex items-center justify-between z-10">
        
        {/* Total Statistics matching the screenshot summary */}
        <div className="flex items-center gap-2 text-slate-600 text-[11px] font-sans font-medium">
          <span className="text-slate-500">总计</span>
          <span className="font-bold text-slate-800 font-mono text-xs">{totalCount}</span>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-sans">
          <span>共 {totalCount} 条</span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            
            <span className="font-mono text-slate-700">
              第 <strong className="font-bold">{currentPage}</strong> / {totalPages} 页
            </span>

            <button
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
