import React from 'react';
import SearchField from './SearchField';
import DateRangeFilter from './DateRangeFilter';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterFieldConfig {
  type: 'select' | 'text' | 'date' | 'search' | 'number';
  key: string;
  label: string;
  placeholder?: string;
  options?: FilterOption[];
  width?: number;
}

interface FilterBarProps {
  fields: FilterFieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  extra?: React.ReactNode;
}

export default function FilterBar({ fields, values, onChange, onReset, extra }: FilterBarProps) {
  const hasAnyValue = Object.values(values).some(v => v && v.length > 0);

  return (
    <div className="warehouse-filter-bar" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      flexWrap: 'wrap',
      minHeight: 40,
    }}>
      {fields.map(field => {
        if (field.type === 'select') {
          return (
            <select
              key={field.key}
              value={values[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              style={{
                height: 28,
                fontSize: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                padding: '0 6px',
                outline: 'none',
                backgroundColor: '#fff',
                color: values[field.key] ? '#1f2937' : '#9ca3af',
                maxWidth: field.width || 140,
              }}
            >
              <option value="">{field.label}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          );
        }
        if (field.type === 'search') {
          return (
            <div key={field.key}>
              <SearchField
                value={values[field.key] || ''}
                onChange={v => onChange(field.key, v)}
                placeholder={field.placeholder || 'Search...'}
                width={field.width || 160}
              />
            </div>
          );
        }
        if (field.type === 'date') {
          return (
            <div key={field.key}>
              <DateRangeFilter
                startValue={values[field.key + 'Start'] || ''}
                endValue={values[field.key + 'End'] || ''}
                onStartChange={v => onChange(field.key + 'Start', v)}
                onEndChange={v => onChange(field.key + 'End', v)}
              />
            </div>
          );
        }
        if (field.type === 'text') {
          return (
            <input
              key={field.key}
              value={values[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || field.label}
              style={{
                height: 28,
                fontSize: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                padding: '0 8px',
                outline: 'none',
                width: field.width || 130,
              }}
            />
          );
        }
        return null;
      })}
      <button
        onClick={onReset}
        style={{
          height: 28,
          padding: '0 10px',
          fontSize: 12,
          color: '#315bea',
          border: '1px solid #d0d9ff',
          borderRadius: 2,
          backgroundColor: '#fff',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          opacity: hasAnyValue ? 1 : 0.5,
        }}
      >
        重置
      </button>
      {extra}
    </div>
  );
}
