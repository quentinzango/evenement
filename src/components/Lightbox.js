import React, { useEffect } from 'react';
import { useTheme } from '../ThemeContext';

export default function Lightbox({ item, onClose }) {
  const { theme } = useTheme();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!item) return null;
  const download = () => {
    const a = document.createElement('a');
    a.href = item.src;
    a.download = item.id + (item.type === 'video' ? '.mp4' : '.jpg');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 'min(90vw, 1200px)', height: 'min(80vh, 900px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.type === 'video' ? (
            <video
              src={item.src}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12, background: '#000' }}
            />
          ) : (
            <img alt="media" src={item.src} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <button onClick={onClose} style={{ background: theme.colors.chip, color: theme.colors.text, border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>Fermer</button>
          <button onClick={download} style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '8px 12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Télécharger</button>
        </div>
      </div>
    </div>
  );
}





