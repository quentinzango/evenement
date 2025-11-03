import React, { useState, useEffect } from 'react';
import { layout } from '../theme';
import { useTheme } from '../ThemeContext';

const tabs = [
  { href: '/', label: 'Accueil' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/discussion', label: 'Discussion' },
  { href: '/localisation', label: 'Localisation' },
];

export default function NavBar() {
  const { theme, mode, toggle } = useTheme();
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [profile, setProfile] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('profile') || 'null'); } catch (e) { return null; }
  });

  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'profile') {
        try { setProfile(e.newValue ? JSON.parse(e.newValue) : null); } catch (err) { setProfile(null); }
      }
    };
    window.addEventListener('storage', onStorage);
    // update currentPath when navigation happens (back/forward)
    const onPop = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('storage', onStorage);
    // cleanup popstate
    // note: we separately remove popstate below because return only executes once; ensure both removed
  }, []);
  useEffect(() => {
    const onPop = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [editName, setEditName] = React.useState(profile?.name || '');
  const [editAvatar, setEditAvatar] = React.useState(profile?.avatar || '');

  const onAvatarSelect = (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('La photo doit être inférieure à 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const saveEditProfile = () => {
    const name = (editName || '').trim();
    if (!name) {
      alert('Le nom de profil est obligatoire');
      return;
    }
    const p = { name, avatar: editAvatar || '' };
    try { localStorage.setItem('profile', JSON.stringify(p)); } catch (e) { console.warn(e); }
    setProfile(p);
    try { window.dispatchEvent(new CustomEvent('profile-changed', { detail: p })); } catch (e) { }
    setEditProfileOpen(false);
  };
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return (
    <div style={{
      height: layout.headerHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: theme.colors.surface,
      borderBottom: `1px solid ${theme.colors.border}`,
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: theme.colors.primary,
          boxShadow: theme.shadow.sm,
        }} />
        <div style={{ color: theme.colors.text, fontWeight: 700 }}>Nzie Memories</div>
      </div>
      {/* Desktop nav or mobile hamburger */}
      {!isMobile ? (
        <nav style={{ display: 'flex', gap: 20 }}>
          {tabs.map(t => {
            const isActive = currentPath === t.href;
            return (
              <a
                key={t.href}
                href={t.href}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPath(t.href);
                  window.history.pushState({}, '', t.href);
                }}
                style={{
                  color: isActive ? theme.colors.primary : theme.colors.textMuted,
                  textDecoration: 'none',
                  fontWeight: isActive ? 800 : 600,
                  padding: '8px 16px',
                  borderRadius: 8,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  background: isActive ? `${theme.colors.primary}15` : 'transparent',
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = `${theme.colors.primary}08`;
                    e.currentTarget.style.color = theme.colors.text;
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme.colors.textMuted;
                  }
                }}
              >
                {t.label}
              </a>
            );
          })}
        </nav>
      ) : (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(s => !s)}
            aria-expanded={showMenu}
            aria-label="Ouvrir le menu"
            style={{ background: 'transparent', border: 'none', color: theme.colors.text, fontSize: 22, cursor: 'pointer' }}
          >
            ☰
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: layout.headerHeight,
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 8,
              boxShadow: theme.shadow.md,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              zIndex: 50,
            }}>
              {tabs.map(t => {
                const isActive = currentPath === t.href;
                return (
                  <a
                    key={t.href}
                    href={t.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPath(t.href);
                      window.history.pushState({}, '', t.href);
                      setShowMenu(false);
                    }}
                    style={{
                      color: isActive ? theme.colors.primary : theme.colors.text,
                      textDecoration: 'none',
                      fontWeight: isActive ? 800 : 600,
                      padding: '10px 16px',
                      borderRadius: 8,
                      background: isActive ? `${theme.colors.primary}15` : 'transparent',
                      transition: 'all 0.2s ease',
                      display: 'block',
                      width: '100%'
                    }}
                  >
                    {t.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggle} title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'} style={{ background: theme.colors.chip, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '6px 10px', cursor: 'pointer' }}>
          {mode === 'dark' ? '🌙' : '☀️'}
        </button>
        <div role="button" tabIndex={0} onClick={() => setEditProfileOpen(true)} onKeyDown={(e) => e.key === 'Enter' && setEditProfileOpen(true)} style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden', background: theme.colors.chip, cursor: 'pointer' }}>
          {profile?.avatar ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        </div>
        {editProfileOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, padding: 20, borderRadius: 12, width: 'min(420px, 96%)' }}>
              <h3 style={{ marginTop: 0 }}>Modifier votre profil</h3>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Votre nom" style={{ width: '100%', padding: '8px 10px', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', background: theme.colors.chip }}>
                  {editAvatar ? <img src={editAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
                <label style={{ cursor: 'pointer', padding: '8px 10px', background: theme.colors.chip, borderRadius: 8 }}>
                  Choisir une photo
                  <input type="file" accept="image/*" onChange={(e) => onAvatarSelect(e.target.files?.[0])} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setEditProfileOpen(false)} style={{ background: theme.colors.surfaceElevated, padding: '8px 12px', borderRadius: 8 }}>Annuler</button>
                <button onClick={saveEditProfile} style={{ background: theme.colors.primary, padding: '8px 12px', borderRadius: 8, fontWeight: 700, color: '#1a120c' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}







