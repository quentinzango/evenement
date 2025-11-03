import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  const [items, setItemsState] = useState(() => {
    try {
      const raw = localStorage.getItem('media');
      if (!raw) return seed;
      const parsed = JSON.parse(raw);
      // Sanitize blob: URLs (they are not valid after reload). Replace any blob:... with null src so fallback shows.
      const sanitized = parsed.map((m) => {
        if (typeof m.src === 'string' && m.src.startsWith('blob:')) {
          return { ...m, src: null };
        }
        return m;
      });
      return sanitized;
    } catch (err) {
      console.warn('Failed to read media from localStorage', err);
      return seed;
    }
  });

  const persist = (next) => {
    // Allow updater function for atomic updates
    if (typeof next === 'function') {
      setItemsState((prev) => {
        const computed = next(prev);
        try {
          localStorage.setItem('media', JSON.stringify(computed));
          // broadcast to other tabs
          try { if (window.BroadcastChannel) new BroadcastChannel('media_channel').postMessage({ type: 'update', items: computed }); } catch (e) { /* ignore */ }
        } catch (err) {
          console.warn('Failed to persist media to localStorage', err);
        }
        return computed;
      });
      return;
    }

    setItemsState(next);
    try {
      localStorage.setItem('media', JSON.stringify(next));
      try { if (window.BroadcastChannel) new BroadcastChannel('media_channel').postMessage({ type: 'update', items: next }); } catch (e) { /* ignore */ }
    } catch (err) {
      // Could be quota exceeded; warn but keep app usable
      console.warn('Failed to persist media to localStorage', err);
    }
  };

  // Keep state in sync across tabs using storage event and BroadcastChannel
  const bcRef = useRef(null);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'media') {
        try {
          const raw = e.newValue;
          const parsed = raw ? JSON.parse(raw) : [];
          // sanitize blob: urls
          const sanitized = parsed.map((m) => (typeof m.src === 'string' && m.src.startsWith('blob:')) ? { ...m, src: null } : m);
          setItemsState(sanitized);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);

    if ('BroadcastChannel' in window) {
      try {
        bcRef.current = new BroadcastChannel('media_channel');
        bcRef.current.onmessage = (ev) => {
          if (ev.data?.type === 'update' && Array.isArray(ev.data.items)) {
            const sanitized = ev.data.items.map((m) => (typeof m.src === 'string' && m.src.startsWith('blob:')) ? { ...m, src: null } : m);
            setItemsState(sanitized);
          }
        };
      } catch (e) {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      try { bcRef.current?.close(); } catch (e) { }
    };
  }, []);

  return { items, setItems: persist };
}

export default function Gallery() {
  const { theme } = useTheme();
  const { items, setItems } = useMedia();
  const [sort, setSort] = useState('views');
  const [lastLikedId, setLastLikedId] = useState(null);
  const likeTimeoutRef = useRef(null);
  const [dockIsOpen, setDockIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

    // Convert file to data URL so it survives page reloads (blob URLs do not)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const newItem = {
        id: String(Date.now()),
        type: file.type.startsWith('video') ? 'video' : 'image',
        src: dataUrl,
        views: 0,
        likes: 0
      };
      setItems((prev) => [newItem, ...prev]);
    };
    reader.onerror = (err) => {
      console.error('FileReader error', err);
      alert('Erreur lors de la lecture du fichier. Veuillez réessayer avec un autre fichier.');
    };
    reader.readAsDataURL(file);

    // Clear the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const toggleLike = (id) => {
    setItems((prev) => prev.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m));
    // transient visual feedback for the like button
    try { clearTimeout(likeTimeoutRef.current); } catch (e) { }
    setLastLikedId(id);
    likeTimeoutRef.current = setTimeout(() => setLastLikedId(null), 800);
  };

  const [activeId, setActiveId] = useState(null);
  const active = items.find(i => i.id === activeId) || null;
  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ 
        paddingTop: 24,
        paddingBottom: 40, 
        // When dock is open on mobile it overlays the screen, don't add large padding/margin
        paddingRight: dockIsOpen && !isMobile ? 380 : 60,
        marginRight: dockIsOpen && !isMobile ? 360 : 0,
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
          {['views', 'likes'].map(key => {
            const isActive = sort === key;
            const btnStyle = {
              background: isActive ? theme.colors.primary : theme.colors.chip,
              color: isActive ? '#1a120c' : theme.colors.text,
              border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
              fontWeight: isActive ? 800 : 600,
              transition: 'all 180ms ease',
              boxShadow: isActive ? `inset 0 -3px 0 0 ${theme.colors.primary}` : 'none',
              transform: isActive ? 'translateY(-1px)' : 'none'
            };
            return (
              <button key={key} onClick={() => setSort(key)} style={btnStyle} aria-pressed={isActive}>
                {key === 'views' ? 'Les plus vus' : 'Les plus likés'}
              </button>
            );
          })}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
          width: dockIsOpen ? 'calc(100% - 360px)' : '100%',
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          marginTop: 20
        }}>
          {sorted.map((m) => {
            const thumbHeight = 200; // responsive thumbnail height
            const fallback = '/logo192.svg';
            return (
              <div key={m.id} onClick={() => {
                setItems((prev) => prev.map(x => x.id === m.id ? { ...x, views: (x.views || 0) + 1 } : x));
                setActiveId(m.id);
              }} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: theme.colors.surface,
                borderRadius: theme.radius.md,
                overflow: 'hidden',
                boxShadow: theme.shadow.sm,
                cursor: 'pointer',
              }}>
                <div style={{ width: '100%', height: thumbHeight, overflow: 'hidden', display: 'block', background: theme.colors.surface }}>
                  {m.type === 'video' ? (
                    <video
                      src={m.src || fallback}
                      controls
                      onError={(e) => { e.currentTarget.src = fallback; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <img
                      alt="media"
                      src={m.src || fallback}
                      onError={(e) => { e.currentTarget.src = fallback; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', color: theme.colors.textMuted }}>
                  <div>👁️ {m.views} · ❤ {m.likes}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(m.id); }}
                    aria-pressed={lastLikedId === m.id}
                    style={{
                      background: lastLikedId === m.id ? theme.colors.surfaceElevated : theme.colors.primary,
                      color: lastLikedId === m.id ? theme.colors.text : '#1a120c',
                      border: 'none', padding: '6px 10px', borderRadius: 999, cursor: 'pointer', fontWeight: 700,
                      transform: lastLikedId === m.id ? 'scale(1.06)' : 'none',
                      transition: 'transform 180ms ease, background 180ms ease'
                    }}
                  >J'aime</button>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
  <Lightbox item={active} onClose={() => setActiveId(null)} />
    </div>
  );
}







