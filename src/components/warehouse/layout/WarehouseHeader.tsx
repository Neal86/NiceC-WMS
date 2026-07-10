import React from 'react';
import { topNavItems } from '../config/navigation';

interface WarehouseHeaderProps {
  activeTopNav: string;
  onTopNavChange: (key: string) => void;
  currentUser: any;
  warehouseName: string;
  onLogout: () => void;
  onSwitchAdmin: () => void;
}

export default function WarehouseHeader({
  activeTopNav,
  onTopNavChange,
  currentUser,
  warehouseName,
  onLogout,
  onSwitchAdmin,
}: WarehouseHeaderProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const email = currentUser?.email || currentUser?.username || 'user@example.com';

  return (
    <header className="warehouse-header" style={{
      height: 38,
      backgroundColor: '#061b45',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      zIndex: 100,
      position: 'relative',
    }}>
      {/* Logo area */}
      <div style={{
        width: 126,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.5,
        flexShrink: 0,
      }}>
        NiceC WMS
      </div>

      {/* Top nav items */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        flex: 1,
        overflow: 'hidden',
      }}>
        {topNavItems.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 && (
              <div style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            )}
            <button
              onClick={() => onTopNavChange(item.key)}
              style={{
                height: '100%',
                padding: '0 14px',
                fontSize: 12,
                color: activeTopNav === item.key ? '#061b45' : 'rgba(255,255,255,0.85)',
                backgroundColor: activeTopNav === item.key ? '#fff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: activeTopNav === item.key ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                borderTopLeftRadius: activeTopNav === item.key ? 3 : 0,
                borderTopRightRadius: activeTopNav === item.key ? 3 : 0,
              }}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Right area: icons + user */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        paddingRight: 12,
        height: '100%',
        flexShrink: 0,
      }}>
        {/* Tool icons */}
        {[/* tools, messages, notifications, settings */].map((_, i) => (
          <button key={i} style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            borderRadius: 2,
            fontSize: 14,
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                i === 0 ? "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" :
                i === 1 ? "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" :
                i === 2 ? "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" :
                "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              } />
            </svg>
          </button>
        ))}

        {/* User info */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 28,
              padding: '0 6px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: '#4b6cb7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {email.charAt(0).toUpperCase()}
            </div>
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{warehouseName || '仓库'}</span>
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <>
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 199,
              }} onClick={() => setShowUserMenu(false)} />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 200,
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                minWidth: 140,
                padding: 4,
              }}>
                {['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(String(currentUser?.role || '').toUpperCase()) && (
                  <button
                    onClick={() => { setShowUserMenu(false); onSwitchAdmin(); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: 12,
                      color: '#374151',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: 2,
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    切换管理后台
                  </button>
                )}
                <button
                  onClick={() => { setShowUserMenu(false); onLogout(); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 12px',
                    fontSize: 12,
                    color: '#d32f2f',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 2,
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
