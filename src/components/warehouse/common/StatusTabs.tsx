import React from 'react';

interface StatusTabsProps {
  tabs: { key: string; label: string; count?: number }[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function StatusTabs({ tabs, activeKey, onChange }: StatusTabsProps) {
  return (
    <div className="warehouse-status-tabs" style={{
      display: 'flex',
      height: 36,
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#fff',
      paddingLeft: 8,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: '100%',
            padding: '0 16px',
            fontSize: 12,
            color: activeKey === tab.key ? '#315bea' : '#6b7280',
            fontWeight: activeKey === tab.key ? 600 : 400,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            borderBottom: activeKey === tab.key ? '2px solid #315bea' : '2px solid transparent',
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              fontSize: 11,
              color: activeKey === tab.key ? '#315bea' : '#9ca3af',
              marginLeft: 2,
            }}>
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
