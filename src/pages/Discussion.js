import React, { useEffect, useRef, useState } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';

export default function Discussion() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('messages') || '[]'));
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!text) return;
    const msg = { id: Date.now(), text, author: 'Vous', ts: new Date().toISOString(), replyTo };
    const next = [...messages, msg];
    setMessages(next);
    localStorage.setItem('messages', JSON.stringify(next));
    setText('');
    setReplyTo(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ paddingTop: 24, paddingBottom: 24 }}>
        <h1 style={{ color: theme.colors.text, margin: '8px 0 16px' }}>Group Discussion</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map(m => (
            <div key={m.id} style={{ maxWidth: 720, alignSelf: m.author === 'Vous' ? 'flex-end' : 'flex-start', background: m.author === 'Vous' ? theme.colors.primary : theme.colors.surfaceElevated, color: m.author === 'Vous' ? '#1a120c' : theme.colors.text, padding: '12px 14px', borderRadius: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.author}</div>
              {m.replyTo && (
                <div style={{ borderLeft: `3px solid ${theme.colors.border}`, paddingLeft: 8, marginBottom: 6, color: theme.colors.textMuted }}>
                  Réponse à: {messages.find(x => x.id === m.replyTo)?.text?.slice(0, 80) || 'message'}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => setReplyTo(m.id)} style={{ background: 'transparent', color: 'inherit', border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '4px 8px', cursor: 'pointer' }}>Répondre</button>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: theme.colors.background, paddingTop: 12 }}>
          {replyTo && (
            <div style={{ marginBottom: 6, color: theme.colors.textMuted }}>Répondre à un message – <button onClick={() => setReplyTo(null)} style={{ background: 'transparent', color: theme.colors.textMuted, border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Annuler</button></div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message..." style={{ flex: 1, background: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, padding: '12px 14px', borderRadius: 14 }} />
            <button onClick={send} style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '12px 16px', borderRadius: 14, fontWeight: 800, cursor: 'pointer' }}>Envoyer</button>
          </div>
        </div>
      </Container>
    </div>
  );
}







