import React, { useState, useEffect } from 'react';
import { dashboardApi, outboundApi, inboundApi, waveApi } from '../../../api';
import { normalizeListResponse, formatDate } from '../types';
import { WarehousePageProps } from '../types';

interface SummaryCard {
  label: string;
  value: string | number;
  color: string;
}

export default function HomePage({ currentUser }: WarehousePageProps) {
  const [summary, setSummary] = useState<any>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, outboundRes] = await Promise.all([
          dashboardApi.getSummary().catch(() => ({})),
          outboundApi.getOrders({ pageSize: 10, page: 1 }).catch(() => ({})),
        ]);
        setSummary(summaryRes?.data || summaryRes || {});
        setRecentOrders(normalizeListResponse(outboundRes).slice(0, 10));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards: SummaryCard[] = [
    { label: '待处理出库', value: summary?.pendingOutbound ?? '-', color: '#315bea' },
    { label: '待入库', value: summary?.pendingInbound ?? '-', color: '#e68a00' },
    { label: '待拣货', value: summary?.pendingPick ?? '-', color: '#9333ea' },
    { label: '待复核', value: summary?.pendingReview ?? '-', color: '#d32f2f' },
  ];

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 16 }}>
        仓库概览
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {cards.map(card => (
          <div key={card.label} style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{card.label}</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</span>
          </div>
        ))}
      </div>
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontSize: 13,
          fontWeight: 600,
          color: '#1f2937',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fafafa',
        }}>
          最近出库订单
        </div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ height: 32, backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>出库单号</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>客户</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>状态</th>
              <th style={{ padding: '0 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order: any, idx: number) => (
              <tr key={order.id || idx} style={{ height: 32, borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0 10px', color: '#315bea' }}>{order.orderNo || order.id || '-'}</td>
                <td style={{ padding: '0 10px', color: '#374151' }}>{order.customerName || order.customerCode || '-'}</td>
                <td style={{ padding: '0 10px' }}>{order.status || '-'}</td>
                <td style={{ padding: '0 10px', color: '#6b7280' }}>{formatDate(order.createdTime || order.createdAt)}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && !loading && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
