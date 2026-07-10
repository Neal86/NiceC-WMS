import React, { useEffect, useState } from 'react';
import { outboundApi } from '../../../api';
import { formatDate, safeStr } from '../types';
import StatusBadge from '../common/StatusBadge';
import DetailSection from '../common/DetailSection';
import { WarehousePageProps } from '../types';

interface OutboundDetailProps extends WarehousePageProps {
  orderId?: string;
}

export default function OutboundDetailPage({ orderId, onNavigate, currentUser }: OutboundDetailProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    outboundApi.getOrderById(orderId)
      .then(res => {
        const o = res?.data || res?.order || res;
        setOrder(o);
      })
      .catch(err => setError(err?.message || '加载失败'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div style={{ padding: 24, color: '#9ca3af' }}>加载中...</div>;
  if (error) return <div style={{ padding: 24, color: '#d32f2f' }}>{error}</div>;
  if (!order) return <div style={{ padding: 24, color: '#9ca3af' }}>未找到订单</div>;

  const statusTimeline = [
    { label: '创建', time: order.createdTime || order.createdAt, done: true },
    { label: '生成波次', time: order.waveTime || order.wave?.createdTime, done: !!order.waveId || !!order.waveTime },
    { label: '拣货', time: order.pickTime || order.pickCompleteTime, done: order.status === 'PICKING' || order.status === 'REVIEW' || order.status === 'SHIPPING' || order.status === 'SHIPPED' },
    { label: '出库', time: order.shipTime || order.shippedTime, done: order.status === 'SHIPPED' },
  ];

  const items = order.items || [];

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => onNavigate?.('outbound')}
            style={{ background: 'none', border: 'none', color: '#315bea', cursor: 'pointer', fontSize: 12, padding: 0 }}
          >
            ← 返回
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
            {order.orderNo || order.id}
          </span>
          <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}
            onClick={() => navigator.clipboard.writeText(order.orderNo || order.id)}>
            📋
          </button>
          <StatusBadge status={order.status} />
        </div>
        <button
          style={{
            height: 28,
            padding: '0 12px',
            fontSize: 12,
            color: '#315bea',
            border: '1px solid #d0d9ff',
            borderRadius: 2,
            background: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => outboundApi.printLabel(order.id).catch(() => alert('打印失败'))}
        >
          打印发货清单
        </button>
      </div>

      {/* Timeline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 16,
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        padding: '12px 16px',
      }}>
        {statusTimeline.map((node, idx) => (
          <React.Fragment key={node.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: node.done ? '#2e7d32' : '#e5e7eb',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 11, color: node.done ? '#2e7d32' : '#9ca3af', fontWeight: node.done ? 600 : 400 }}>
                  {node.label}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{node.time ? formatDate(node.time) : '-'}</div>
              </div>
            </div>
            {idx < statusTimeline.length - 1 && (
              <div style={{ flex: 1, height: 1, backgroundColor: node.done ? '#2e7d32' : '#e5e7eb', margin: '0 12px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Basic Info */}
      <DetailSection title="基础信息" columns={4} fields={[
        { label: '客户', value: safeStr(order.customerName || order.customer?.name) },
        { label: '物流渠道', value: safeStr(order.logisticsChannelName || order.channel) },
        { label: '包裹数量', value: String(order.packageQty ?? order.packages ?? '-') },
        { label: '总数量', value: String(order.totalQty ?? order.qty ?? 0) },
        { label: '备注', value: safeStr(order.remark, ''), span: 2 },
        { label: '参考单号', value: safeStr(order.referenceNo || order.refNo) },
        { label: '订单品种类型', value: safeStr(order.orderType || order.type) },
        { label: 'SKU品种数', value: String(order.items?.length ?? '-') },
        { label: '平台单号', value: safeStr(order.platformOrderNo || order.salesPlatform) },
        { label: '签名类型', value: safeStr(order.signatureType) },
        { label: '保险服务', value: safeStr(order.insuranceService ? '是' : '否') },
      ]} />

      {/* Recipient Info */}
      <DetailSection title="收件信息" columns={4} fields={[
        { label: '收件人', value: showHidden ? safeStr(order.recipient || order.recipientName) : '****' },
        { label: '电话', value: showHidden ? safeStr(order.phone || order.recipientPhone) : '****' },
        { label: '邮箱', value: showHidden ? safeStr(order.email || order.recipientEmail) : '****' },
        { label: '邮编', value: showHidden ? safeStr(order.zipCode || order.postcode) : '****' },
        { label: '收件人税号', value: showHidden ? safeStr(order.taxId || order.recipientTaxId) : '****' },
        { label: '公司名称', value: showHidden ? safeStr(order.companyName || order.recipientCompany) : '****' },
        { label: '国家/地区', value: showHidden ? safeStr(order.country || order.destinationCountry) : '****' },
        { label: '门牌号', value: showHidden ? safeStr(order.streetNumber || order.doorNo) : '****' },
        { label: '省/州名称', value: showHidden ? safeStr(order.province || order.state) : '****' },
        { label: '区/县', value: showHidden ? safeStr(order.district || order.county) : '****' },
        { label: '城市名称', value: showHidden ? safeStr(order.city) : '****' },
        { label: '地址1', value: showHidden ? safeStr(order.address1 || order.address) : '****' },
        { label: '地址2', value: showHidden ? safeStr(order.address2) : '****', span: 2 },
      ]} />

      {/* Hidden Toggle */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
          显示隐藏信息
        </label>
      </div>

      {/* Logistics & Packages */}
      {order.packages && order.packages.length > 0 && (
        <DetailSection title="物流包裹" columns={4} fields={
          order.packages.map((pkg: any, idx: number) => ({
            label: `包裹${idx + 1}`,
            value: `${pkg.trackingNo || '-'} | ${pkg.weight || '-'}kg`,
          }))
        } />
      )}

      {/* Items */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        marginBottom: 8,
      }}>
        <div style={{
          height: 32,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontSize: 12,
          fontWeight: 600,
          color: '#1f2937',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
        }}>
          商品明细
        </div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ height: 32, backgroundColor: '#fafafa' }}>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>SKU</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>产品条码</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>产品名称</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>数量</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>分类</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={item.id || idx} style={{ height: 32, borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0 10px', color: '#315bea' }}>{item.skuCode || item.sku || '-'}</td>
                <td style={{ padding: '0 10px', color: '#374151' }}>{item.skuBarcode || item.barcode || '-'}</td>
                <td style={{ padding: '0 10px', color: '#374151' }}>{item.productName || item.name || '-'}</td>
                <td style={{ padding: '0 10px', color: '#374151' }}>{item.qty ?? item.quantity ?? 0}</td>
                <td style={{ padding: '0 10px', color: '#374151' }}>{item.category || '-'}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>暂无明细</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Operation Logs would go here if API available */}
    </div>
  );
}
