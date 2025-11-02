import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../ThemeContext';

export default function QuickDock({ onSendGlobal }) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('messages') || '[]'));

  useEffect(() => {
    const i = setInterval(() => {
      const raw = localStorage.getItem('messages');
      const arr = raw ? JSON.parse(raw) : [];
      setMessages(arr);
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const recent = useMemo(() => messages.slice(-10).reverse(), [messages]);

  const send = () => {
    if (!text) return;
    onSendGlobal?.({ id: Date.now(), text, mediaUrl: '', author: 'Vous', ts: new Date().toISOString() });
    setText('');
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 64,
      bottom: 0,
      width: isOpen ? (window.innerWidth <= 768 ? '100%' : 360) : 50,
      background: theme.colors.surface,
      borderLeft: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadow.md,
      transform: isOpen ? 'translateX(0)' : 'translateX(0)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30,
      transition: 'width 0.3s ease',
    }}>
      <div 
        style={{ 
          padding: 12, 
          color: theme.colors.text, 
          fontWeight: 800, 
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          // Émettre un événement pour informer la Gallery
          window.dispatchEvent(new CustomEvent('custom-event', { 
            detail: { type: 'dock-state-change', isOpen: newState } 
          }));
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 30,
          height: 30,
          marginRight: isOpen ? 8 : 0,
          transition: 'transform 0.3s ease',
          fontSize: '24px',
        }}>
          {isOpen ? '💬' : '💭'}
        </div>
        {isOpen && <span>Discussion</span>}
      </div>
      {isOpen && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(m => (
              <div key={m.id} style={{ background: theme.colors.surfaceElevated, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.author}</div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: `1px solid ${theme.colors.border}`, display: 'flex', gap: 8 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message..." style={{ flex: 1, background: theme.colors.surfaceElevated, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, padding: '10px 12px', borderRadius: 12 }} />
            <button onClick={send} style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '10px 12px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Envoyer</button>
          </div>
        </>
      )}
    </div>
  );
}


