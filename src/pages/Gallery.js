import React, { useMemo, useState, useEffect, useRef } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';
import Lightbox from '../components/Lightbox';
import { supabase } from '../lib/supabase';

function useMedia() {
  const [items, setItems] = useState([]);
  const chanRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase
        .from('media')
        .select('id, type, filename, url, views, likes, created_at')
        .order('created_at', { ascending: false });
      if (!error && mounted) setItems(data || []);
    }
    load();

    chanRef.current = supabase.channel('media-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, (payload) => {
        const rec = payload.new ?? payload.old;
        setItems(prev => {
          if (payload.eventType === 'INSERT') return [rec, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map(p => p.id === rec.id ? rec : p);
          if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== rec.id);
          return prev;
        });
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(chanRef.current); } catch (e) {}
      mounted = false;
    };
  }, []);

  return { items, setItems };
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

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const bucket = process.env.REACT_APP_SUPABASE_STORAGE_BUCKET;
    const path = `${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (upErr) {
      alert('Erreur upload: ' + upErr.message);
      e.target.value = '';
      return;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = urlData?.publicUrl || '';
    const type = file.type.startsWith('video') ? 'video' : 'image';
    await supabase.from('media').insert({ type, filename: file.name, url: publicUrl, views: 0, likes: 0 });
    e.target.value = '';
  };

  const toggleLike = async (id) => {
    const current = items.find(m => m.id === id);
    const nextLikes = (current?.likes || 0) + 1;
    setItems((prev) => prev.map(m => m.id === id ? { ...m, likes: nextLikes } : m));
    try { await supabase.from('media').update({ likes: nextLikes }).eq('id', id); } catch (e) {}
    
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
              <div key={m.id} onClick={async () => {
                const nextViews = (m.views || 0) + 1;
                setItems((prev) => prev.map(x => x.id === m.id ? { ...x, views: nextViews } : x));
                try { await supabase.from('media').update({ views: nextViews }).eq('id', m.id); } catch (e) {}
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
                      src={m.url || fallback}
                      controls
                      onError={(e) => { e.currentTarget.src = fallback; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <img
                      alt="media"
                      src={m.url || fallback}
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







