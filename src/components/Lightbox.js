import React, { useEffect } from 'react';
import { useTheme } from '../ThemeContext';

export default function Lightbox({ item, onClose, items, onSelect }) {
  const { theme } = useTheme();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!item) return null;
  const src = item.url || item.src || '';
  const list = Array.isArray(items) ? items : [];
  const others = list.filter((m) => m && m.id !== item.id);
  const download = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.id + (item.type === 'video' ? '.mp4' : '.jpg');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // fallback: ouvrir le média dans un nouvel onglet si le téléchargement échoue
      window.open(src, '_blank');
    }
  };
  const isNarrow = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(95vw, 1200px)',
          height: 'min(85vh, 900px)',
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          gap: 12,
        }}
      >
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.type === 'video' ? (
            <video
              src={src}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12, background: '#000' }}
            />
          ) : (
            <img alt="media" src={src} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
          )}
        </div>

        {/* Liste latérale façon YouTube quand d'autres médias sont disponibles */}
        {others.length > 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            padding: 4,
          }}>
            {others.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelect?.(m.id)}
                style={{
                  display: 'flex',
                  gap: 8,
                  cursor: 'pointer',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  padding: 4,
                  alignItems: 'center',
                }}
              >
                <div style={{ width: 80, height: 50, overflow: 'hidden', borderRadius: 6, background: '#000' }}>
                  {m.type === 'video' ? (
                    <video
                      src={m.url || m.src || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      muted
                    />
                  ) : (
                    <img
                      src={m.url || m.src || ''}
                      alt="media"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, color: '#fff', fontSize: 13, lineHeight: 1.3, overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.filename || 'Souvenir'}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>👁️ {m.views ?? 0} · ❤ {m.likes ?? 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 12px',
        }}>
          <button onClick={onClose} style={{ background: theme.colors.chip, color: theme.colors.text, border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>Fermer</button>
          <button onClick={download} style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '8px 12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Télécharger</button>
        </div>
      </div>
    </div>
  );
}





