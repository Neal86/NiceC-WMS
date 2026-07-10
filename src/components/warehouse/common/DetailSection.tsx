import React from 'react';

interface DetailField {
  label: string;
  value: string | React.ReactNode;
  span?: number;
}

interface DetailSectionProps {
  title: string;
  fields: DetailField[];
  columns?: 2 | 3 | 4;
}

export default function DetailSection({ title, fields, columns = 4 }: DetailSectionProps) {
  return (
    <div className="warehouse-detail-section" style={{
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
        {title}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 0,
      }}>
        {fields.map((field, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              padding: '6px 12px',
              borderBottom: '1px solid #f3f4f6',
              borderRight: '1px solid #f3f4f6',
              fontSize: 12,
              gridColumn: field.span ? `span ${field.span}` : undefined,
            }}
          >
            <span style={{ color: '#9ca3af', width: 80, flexShrink: 0 }}>{field.label}</span>
            <span style={{ color: '#374151', flex: 1 }}>{field.value ?? '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
