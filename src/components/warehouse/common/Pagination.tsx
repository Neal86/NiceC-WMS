import React, { useState } from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const [goValue, setGoValue] = useState('');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleGo = () => {
    const p = parseInt(goValue, 10);
    if (p >= 1 && p <= totalPages) {
      onPageChange(p);
      setGoValue('');
    }
  };

  return (
    <div className="warehouse-pagination" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      height: 36,
      padding: '0 12px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#fff',
      fontSize: 12,
      color: '#6b7280',
      flexShrink: 0,
    }}>
      <span>共 {total} 条</span>

      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{
          padding: '2px 8px',
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          background: '#fff',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
          opacity: page <= 1 ? 0.4 : 1,
          fontSize: 12,
        }}
      >
        上一页
      </button>

      {getPageNumbers().map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            style={{
              minWidth: 24,
              height: 24,
              padding: '0 4px',
              border: 'none',
              borderRadius: 2,
              background: p === page ? '#315bea' : 'transparent',
              color: p === page ? '#fff' : '#6b7280',
              fontWeight: p === page ? 600 : 400,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {p}
          </button>
        ) : (
          <span key={i} style={{ color: '#9ca3af', padding: '0 2px' }}>...</span>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{
          padding: '2px 8px',
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          background: '#fff',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          opacity: page >= totalPages ? 0.4 : 1,
          fontSize: 12,
        }}
      >
        下一页
      </button>

      <select
        value={pageSize}
        onChange={e => onPageSizeChange(Number(e.target.value))}
        style={{
          height: 24,
          fontSize: 12,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          padding: '0 4px',
          outline: 'none',
        }}
      >
        {[10, 20, 50, 100].map(s => (
          <option key={s} value={s}>{s}条/页</option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>前往</span>
        <input
          value={goValue}
          onChange={e => setGoValue(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handleGo()}
          style={{
            width: 40,
            height: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            textAlign: 'center',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <span>页</span>
      </div>
    </div>
  );
}
