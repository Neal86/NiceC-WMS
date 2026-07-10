import React from 'react';

interface Column<T = any> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  fixed?: 'left' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  rowKey: string | ((row: T, index: number) => string);
  loading?: boolean;
  emptyText?: string;
  selectedKeys?: Set<string>;
  onSelectChange?: (keys: Set<string>) => void;
  onRowClick?: (row: T) => void;
  summaryRow?: Record<string, any>;
  error?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading,
  emptyText = '暂无数据',
  selectedKeys,
  onSelectChange,
  onRowClick,
  summaryRow,
  error,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedKeys?.size === data.length;
  const someSelected = selectedKeys && selectedKeys.size > 0 && selectedKeys.size < data.length;

  const getKey = (row: T, idx: number): string => {
    if (typeof rowKey === 'function') return rowKey(row, idx);
    return String(row[rowKey] ?? idx);
  };

  const handleSelectAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange(new Set());
    } else {
      const keys = new Set(data.map((row, idx) => getKey(row, idx)));
      onSelectChange(keys);
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectChange(next);
  };

  const hasCheckbox = !!onSelectChange;

  return (
    <div className="warehouse-table-wrapper" style={{
      flex: 1,
      overflowX: 'auto',
      overflowY: 'auto',
      position: 'relative',
    }}>
      <table className="warehouse-table" style={{
        width: '100%',
        minWidth: columns.reduce((s, c) => s + (c.width || 120), hasCheckbox ? 40 : 0) + 40,
        borderCollapse: 'collapse',
        fontSize: 12,
        tableLayout: 'fixed',
      }}>
        <thead>
          <tr style={{ height: 34, backgroundColor: '#fafafa' }}>
            {hasCheckbox && (
              <th style={{ width: 36, padding: '0 8px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = !!someSelected; }}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: col.minWidth || col.width,
                  padding: '0 8px',
                  textAlign: col.align || 'left',
                  fontWeight: 500,
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb',
                  position: col.fixed === 'left' ? 'sticky' : col.fixed === 'right' ? 'sticky' : undefined,
                  left: col.fixed === 'left' ? (hasCheckbox ? 36 : 0) : undefined,
                  right: col.fixed === 'right' ? 0 : undefined,
                  zIndex: col.fixed ? 2 : undefined,
                  backgroundColor: '#fafafa',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length + (hasCheckbox ? 1 : 0)} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                加载中...
              </td>
            </tr>
          )}
          {!loading && error && (
            <tr>
              <td colSpan={columns.length + (hasCheckbox ? 1 : 0)} style={{ textAlign: 'center', padding: '40px 0', color: '#d32f2f' }}>
                {error}
              </td>
            </tr>
          )}
          {!loading && !error && data.length === 0 && (
            <tr>
              <td colSpan={columns.length + (hasCheckbox ? 1 : 0)} className="warehouse-empty-cell" style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>📋</div>
                {emptyText}
              </td>
            </tr>
          )}
          {!loading && !error && data.map((row, idx) => {
            const key = getKey(row, idx);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                style={{
                  height: 36,
                  borderBottom: '1px solid #f3f4f6',
                  cursor: onRowClick ? 'pointer' : undefined,
                  backgroundColor: selectedKeys?.has(key) ? '#f0f4ff' : undefined,
                }}
                onMouseEnter={e => {
                  if (!selectedKeys?.has(key)) e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={e => {
                  if (!selectedKeys?.has(key)) e.currentTarget.style.backgroundColor = '';
                }}
              >
                {hasCheckbox && (
                  <td style={{ padding: '0 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                    <input
                      type="checkbox"
                      checked={selectedKeys?.has(key) || false}
                      onChange={() => handleSelectRow(key)}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                )}
                {columns.map(col => {
                  const val = row[col.key];
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '0 8px',
                        textAlign: col.align || 'left',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      {col.render ? col.render(val, row, idx) : (val ?? '-')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {summaryRow && !loading && data.length > 0 && (
            <tr style={{ height: 32, backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
              {hasCheckbox && <td style={{ padding: '0 8px', borderBottom: '1px solid #e5e7eb' }} />}
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    padding: '0 8px',
                    textAlign: col.align || 'left',
                    fontWeight: 600,
                    color: '#1f2937',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: 11,
                  }}
                >
                  {summaryRow[col.key] ?? ''}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
