import React from 'react';
import { sidebarNavItems, pageLabels } from '../config/navigation';

interface WarehouseSidebarProps {
  activePage: string;
  onPageChange: (key: string) => void;
}

export default function WarehouseSidebar({ activePage, onPageChange }: WarehouseSidebarProps) {
  const [expandedMenus, setExpandedMenus] = React.useState<Set<string>>(() => {
    // Auto-expand the parent of active page
    const set = new Set<string>();
    for (const item of sidebarNavItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.key === activePage) {
            set.add(item.key);
          }
        }
      }
    }
    return set;
  });

  const toggleExpand = (key: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="warehouse-sidebar" style={{
      width: 126,
      backgroundColor: '#071326',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {sidebarNavItems.map(item => {
        if (item.children) {
          const isExpanded = expandedMenus.has(item.key);
          const hasActiveChild = item.children.some(c => c.key === activePage);
          return (
            <div key={item.key}>
              <button
                onClick={() => toggleExpand(item.key)}
                style={{
                  width: '100%',
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontSize: 12,
                  color: hasActiveChild ? '#fff' : 'rgba(255,255,255,0.75)',
                  backgroundColor: hasActiveChild ? 'rgba(49,91,234,0.3)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 4,
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
              {isExpanded && item.children.map(child => (
                <button
                  key={child.key}
                  onClick={() => onPageChange(child.key)}
                  style={{
                    width: '100%',
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px 0 20px',
                    fontSize: 12,
                    color: activePage === child.key ? '#fff' : 'rgba(255,255,255,0.65)',
                    backgroundColor: activePage === child.key ? '#315bea' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {child.label}
                </button>
              ))}
            </div>
          );
        }

        return (
          <button
            key={item.key}
            onClick={() => onPageChange(item.key)}
            style={{
              width: '100%',
              height: 36,
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              fontSize: 12,
              color: activePage === item.key ? '#fff' : 'rgba(255,255,255,0.75)',
              backgroundColor: activePage === item.key ? '#315bea' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              gap: 6,
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
