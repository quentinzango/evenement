import React from 'react';
import { layout } from '../theme';

export default function Container({ children, style }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: layout.maxWidth,
      margin: '0 auto',
      padding: '0 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}







