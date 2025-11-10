import React, { useEffect, useRef, useState } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';
import useMessagesSupabase from '../hooks/useMessagesSupabase';
import { getStoredToken, registerDevice, getOrCreateDeviceId } from '../lib/device';
import { supabase } from '../lib/supabase';

export default function Discussion() {
  const { theme } = useTheme();
  const { messages, postMessage } = useMessagesSupabase();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const endRef = useRef(null);
  const [myProfileId, setMyProfileId] = useState(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load my profile_id via device_id to distinguish own messages
  useEffect(() => {
    (async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const { data } = await supabase.from('profiles').select('id').eq('device_id', deviceId).limit(1).single();
        if (data?.id) setMyProfileId(data.id);
      } catch (e) {}
    })();
  }, []);

  const send = () => {
    if (!text) return;
    const token = getStoredToken();
    const POST_URL = process.env.REACT_APP_SUPABASE_FN_POST_MESSAGE;
    if (!token) {
      const name = window.prompt('Entrez votre nom pour participer à la discussion :');
      if (!name) return;
      const REGISTER_URL = process.env.REACT_APP_SUPABASE_FN_REGISTER_DEVICE;
      registerDevice({ functionUrl: REGISTER_URL, display_name: name }).then((res) => {
        if (res.ok) {
          postMessage({ functionUrl: POST_URL, token: res.token, text }).then(() => {
            setText('');
            setReplyTo(null);
          }).catch(() => {});
        }
      });
      return;
    }
    postMessage({ functionUrl: POST_URL, token, text }).then(() => {
      setText('');
      setReplyTo(null);
    }).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ paddingTop: 24, paddingBottom: 24 }}>
        <h1 style={{ color: theme.colors.text, margin: '8px 0 16px' }}>Group Discussion</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map(m => {
            const author = m.profiles?.display_name || 'Anonyme';
            const mine = myProfileId && m.profile_id === myProfileId;
            const bubbleStyle = {
              maxWidth: 720,
              alignSelf: mine ? 'flex-end' : 'flex-start',
              background: mine ? theme.colors.primary : theme.colors.surfaceElevated,
              color: mine ? '#1a120c' : theme.colors.text,
              padding: '12px 14px',
              borderRadius: 16,
            };
            return (
              <div key={m.id} style={bubbleStyle}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{author}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                {!mine && (
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => setReplyTo(m.id)} style={{ background: 'transparent', color: 'inherit', border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '4px 8px', cursor: 'pointer' }}>Répondre</button>
                  </div>
                )}
              </div>
            );
          })}
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







