import React from 'react';

interface EmptyStateProps {
  text?: string;
}

export default function EmptyState({ text = '暂无数据' }: EmptyStateProps) {
  return (
    <div className="warehouse-empty-state" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0',
      color: '#9ca3af',
      fontSize: 13,
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
      {text}
    </div>
  );
}
