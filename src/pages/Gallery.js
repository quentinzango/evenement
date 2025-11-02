import React, { useMemo, useState, useEffect } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';
import Lightbox from '../components/Lightbox';

const seed = [
  //{ id: '1', type: 'image', src: 'https://picsum.photos/seed/nzie1/600/400', views: 1200, likes: 87 },
  //{ id: '2', type: 'image', src: 'https://picsum.photos/seed/nzie2/600/400', views: 1500, likes: 120 },
  //{ id: '3', type: 'image', src: 'https://picsum.photos/seed/nzie3/600/400', views: 2100, likes: 210 },
  //{ id: '4', type: 'image', src: 'https://picsum.photos/seed/nzie4/600/400', views: 890, likes: 92 },
  //{ id: '5', type: 'image', src: 'https://picsum.photos/seed/nzie5/600/400', views: 650, likes: 55 },
];

function useMedia() {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem('media');
    return raw ? JSON.parse(raw) : seed;
  });
  const persist = (next) => {
    setItems(next);
    localStorage.setItem('media', JSON.stringify(next));
  };
  return { items, setItems: persist };
}

export default function Gallery() {
  const { theme } = useTheme();
  const { items, setItems } = useMedia();
  const [sort, setSort] = useState('views');
  const [dockIsOpen, setDockIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Écoute les changements d'état du QuickDock
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'dock-state-change') {
        setDockIsOpen(e.detail.isOpen);
      }
    };
    window.addEventListener('custom-event', handler);
    return () => window.removeEventListener('custom-event', handler);
  }, []);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
    return copy;
  }, [items, sort]);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newItem = { id: String(Date.now()), type: file.type.startsWith('video') ? 'video' : 'image', src: url, views: 0, likes: 0 };
    setItems([newItem, ...items]);
  };

  const toggleLike = (id) => {
    const next = items.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m);
    setItems(next);
  };

  const [active, setActive] = useState(null);
  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ 
        paddingTop: 24,
        paddingBottom: 40, 
        paddingRight: dockIsOpen ? 380 : 60,
        marginRight: dockIsOpen ? 360 : 0,
        transition: 'all 0.3s ease',
        maxWidth: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ color: theme.colors.text, margin: '8px 0' }}>Galerie Hommage Visuel</h1>
            <div style={{ color: theme.colors.textMuted }}>Parcourez les souvenirs partagés par la communauté.</div>
          </div>
          <label style={{ background: theme.colors.primary, color: '#1a120c', padding: '10px 14px', borderRadius: theme.radius.lg, fontWeight: 700, cursor: 'pointer' }}>
            Ajouter Média
            <input type="file" accept="image/*,video/*" onChange={onUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['views', 'likes'].map(key => (
            <button key={key} onClick={() => setSort(key)} style={{
              background: sort === key ? theme.colors.primary : theme.colors.chip,
              color: sort === key ? '#1a120c' : theme.colors.text,
              border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer'
            }}>{key === 'views' ? 'Les plus vus' : 'Les plus likés'}</button>
          ))}
        </div>

        <div style={{ 
          columnCount: windowWidth <= 768 ? 1 : 
                      windowWidth <= 1024 ? 2 : 4,
          columnGap: 14,
          width: dockIsOpen ? 'calc(100% - 360px)' : '100%',
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          marginTop: 20
        }}>
          {sorted.map((m) => {
            const thumbHeight = 280; // fixed thumbnail height for consistency
            return (
              <div key={m.id} onClick={() => {
                const next = items.map(x => x.id === m.id ? { ...x, views: (x.views || 0) + 1 } : x);
                setItems(next);
                setActive(m);
              }} style={{
                breakInside: 'avoid',
                marginBottom: 14,
                background: theme.colors.surface,
                borderRadius: theme.radius.md,
                overflow: 'hidden',
                boxShadow: theme.shadow.sm,
                cursor: 'pointer',
              }}>
                <div style={{ width: '100%', height: thumbHeight, overflow: 'hidden', display: 'block' }}>
                  {m.type === 'video' ? (
                    <video src={m.src} controls style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <img alt="media" src={m.src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', color: theme.colors.textMuted }}>
                  <div>👁️ {m.views} · ❤ {m.likes}</div>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(m.id); }} style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '6px 10px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>J'aime</button>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
      <Lightbox item={active} onClose={() => setActive(null)} />
    </div>
  );
}







