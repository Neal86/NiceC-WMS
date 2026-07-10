import React from 'react';

interface ActionButton {
  key: string;
  label: string;
  primary?: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionToolbarProps {
  buttons: ActionButton[];
  extra?: React.ReactNode;
}

export default function ActionToolbar({ buttons, extra }: ActionToolbarProps) {
  return (
    <div className="warehouse-action-toolbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
      padding: '0 12px',
      backgroundColor: '#fafafa',
      borderBottom: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {buttons.map(btn => (
          <button
            key={btn.key}
            onClick={btn.onClick}
            disabled={btn.disabled}
            style={{
              height: 28,
              padding: '0 12px',
              fontSize: 12,
              fontWeight: btn.primary ? 500 : 400,
              color: btn.danger ? '#d32f2f' : btn.primary ? '#fff' : '#374151',
              backgroundColor: btn.primary ? '#315bea' : '#fff',
              border: btn.primary ? 'none' : `1px solid ${btn.danger ? '#f5b5b5' : '#e5e7eb'}`,
              borderRadius: 2,
              cursor: btn.disabled ? 'not-allowed' : 'pointer',
              opacity: btn.disabled ? 0.5 : 1,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>
      {extra && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {extra}
        </div>
      )}
    </div>
  );
}
