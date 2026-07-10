import React from 'react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number;
}

export default function SearchField({ value, onChange, placeholder = 'Search...', width }: SearchFieldProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', width: width || 160 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 28,
          width: '100%',
          fontSize: 12,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          padding: '0 24px 0 8px',
          outline: 'none',
          backgroundColor: '#fff',
        }}
      />
      <svg
        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: 14, height: 14 }}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}
