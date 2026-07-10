import React from 'react';

interface DateRangeFilterProps {
  startValue: string;
  endValue: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

export default function DateRangeFilter({ startValue, endValue, onStartChange, onEndChange }: DateRangeFilterProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <input
        type="date"
        value={startValue}
        onChange={e => onStartChange(e.target.value)}
        style={{
          height: 28,
          fontSize: 11,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          padding: '0 4px',
          outline: 'none',
          width: 125,
        }}
      />
      <span style={{ color: '#9ca3af', fontSize: 11 }}>~</span>
      <input
        type="date"
        value={endValue}
        onChange={e => onEndChange(e.target.value)}
        style={{
          height: 28,
          fontSize: 11,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          padding: '0 4px',
          outline: 'none',
          width: 125,
        }}
      />
    </div>
  );
}
