import React from 'react';

const statusColorMap: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: '#eef1ff', text: '#315bea', border: '#d0d9ff' },
  processing: { bg: '#fff6e5', text: '#e68a00', border: '#ffe0b2' },
  picking: { bg: '#f3e8ff', text: '#9333ea', border: '#d8b4fe' },
  completed: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  done: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  shipped: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  cancelled: { bg: '#f5f5f5', text: '#757575', border: '#e0e0e0' },
  canceled: { bg: '#f5f5f5', text: '#757575', border: '#e0e0e0' },
  exception: { bg: '#fce4e4', text: '#d32f2f', border: '#f5b5b5' },
  review: { bg: '#fff6e5', text: '#e68a00', border: '#ffe0b2' },
  approved: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  voided: { bg: '#f5f5f5', text: '#757575', border: '#e0e0e0' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = status?.toLowerCase().trim() || 'pending';
  const colors = statusColorMap[key] || statusColorMap.pending;
  const display = label || status;

  return (
    <span
      className="warehouse-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: '0 6px',
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 2,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {display}
    </span>
  );
}
