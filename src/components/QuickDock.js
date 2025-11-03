import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../ThemeContext';

export default function QuickDock({ onSendGlobal }) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('messages') || '[]'));
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('profile') || 'null');
    } catch (e) { return null; }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar || '');

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
    // require profile
    if (!profile) {
      setShowProfileModal(true);
      return;
    }
    const msg = { id: Date.now(), text, mediaUrl: '', author: profile.name, avatar: profile.avatar || '', ts: new Date().toISOString() };
    onSendGlobal?.(msg);
    setText('');
    // update local messages immediately so user sees the message without waiting for interval
    try {
      setMessages((prev) => {
        const next = [...prev, msg];
        try { localStorage.setItem('messages', JSON.stringify(next)); } catch (e) { }
        return next;
      });
    } catch (e) { }
  };

  const saveProfile = () => {
    const name = (profileName || '').trim();
    if (!name) {
      alert('Le nom de profil est obligatoire');
      return;
    }
    const p = { name, avatar: profileAvatar || '' };
    try { localStorage.setItem('profile', JSON.stringify(p)); } catch (e) { console.warn(e); }
    setProfile(p);
    setShowProfileModal(false);
    // notify other components in same tab
    try { window.dispatchEvent(new CustomEvent('profile-changed', { detail: p })); } catch (e) { }
  };

  const onAvatarSelect = (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('La photo doit être inférieure à 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  // listen for profile updates triggered elsewhere in the app
  useEffect(() => {
    const handler = (e) => {
      try {
        const p = e.detail || (localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')) : null);
        setProfile(p);
        setProfileName(p?.name || '');
        setProfileAvatar(p?.avatar || '');
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('profile-changed', handler);
    return () => window.removeEventListener('profile-changed', handler);
  }, []);

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
              <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden', flexShrink: 0 }}>
                  {m.avatar ? <img src={m.avatar} alt={m.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: theme.colors.chip }} />}
                </div>
                <div style={{ background: theme.colors.surfaceElevated, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 8, flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.author}</div>
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: `1px solid ${theme.colors.border}`, display: 'flex', gap: 8 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message..." style={{ flex: 1, background: theme.colors.surfaceElevated, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, padding: '10px 12px', borderRadius: 12 }} />
            <button onClick={send} style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '10px 12px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Envoyer</button>
          </div>
        </>
      )}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, padding: 20, borderRadius: 12, width: 'min(420px, 96%)' }}>
            <h3 style={{ marginTop: 0 }}>Créer votre profil</h3>
            <div style={{ marginBottom: 8 }}>Le nom est obligatoire; la photo est optionnelle.</div>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Votre nom" style={{ width: '100%', padding: '8px 10px', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', background: theme.colors.chip }}>
                {profileAvatar ? <img src={profileAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
              <label style={{ cursor: 'pointer', padding: '8px 10px', background: theme.colors.chip, borderRadius: 8 }}>
                Choisir une photo
                <input type="file" accept="image/*" onChange={(e) => onAvatarSelect(e.target.files?.[0])} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowProfileModal(false)} style={{ background: theme.colors.surfaceElevated, padding: '8px 12px', borderRadius: 8 }}>Annuler</button>
              <button onClick={saveProfile} style={{ background: theme.colors.primary, padding: '8px 12px', borderRadius: 8, fontWeight: 700, color: '#1a120c' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


