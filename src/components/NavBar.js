import React from 'react';
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
      <nav style={{ display: 'flex', gap: 20 }}>
        {tabs.map(t => (
          <a key={t.href} href={t.href} style={{
            color: theme.colors.textMuted,
            textDecoration: 'none',
            fontWeight: 600,
          }} onMouseOver={e => (e.currentTarget.style.color = theme.colors.text)}
             onMouseOut={e => (e.currentTarget.style.color = theme.colors.textMuted)}>
            {t.label}
          </a>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggle} title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'} style={{ background: theme.colors.chip, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '6px 10px', cursor: 'pointer' }}>
          {mode === 'dark' ? '🌙' : '☀️'}
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: theme.colors.chip }} />
      </div>
    </div>
  );
}







