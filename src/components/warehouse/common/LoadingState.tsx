import React from 'react';

interface LoadingStateProps {
  text?: string;
}

export default function LoadingState({ text = '加载中...' }: LoadingStateProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0',
      color: '#9ca3af',
      fontSize: 13,
    }}>
      {text}
    </div>
  );
}
