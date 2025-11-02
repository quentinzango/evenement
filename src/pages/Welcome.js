import React from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';
import welcomeImages from '../welcomeImages';

export default function Welcome() {
  const { theme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
          justifyItems: 'center',
          textAlign: 'center',
        }}>
          <div style={{ height: 180, position: 'relative' }}>
            {welcomeImages.map((img, i) => (
              <img key={i} src={img.src} alt={img.alt || 'welcome'} style={{
                position: 'absolute',
                ...img.style,
                borderRadius: img.radius || 24,
                boxShadow: theme.shadow.md,
                width: img.width || 120,
                height: img.height || 120,
                objectFit: 'cover',
              }} />
            ))}
          </div>
          <h1 style={{ color: theme.colors.text, fontSize: 42, margin: 0 }}>Hommage vibrant à nos racines</h1>
          <p style={{ color: theme.colors.textMuted, maxWidth: 720, margin: 0 }}>
            Rejoignez-nous pour une semaine de célébration et de mémoire, du 24 au 30 Novembre 2025, à Nzie, Ouest Cameroun. Partagez vos souvenirs, photos et vidéos, et participez à des discussions de groupe pour honorer nos ancêtres.
          </p>
          <a href="/galerie" style={{
            background: theme.colors.primary,
            color: '#1a120c',
            textDecoration: 'none',
            padding: '14px 22px',
            borderRadius: theme.radius.lg,
            fontWeight: 700,
            marginTop: 12,
            boxShadow: theme.shadow.md,
          }}>Accéder à l'application</a>
        </div>
      </Container>
    </div>
  );
}







