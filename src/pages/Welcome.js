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
          <div style={{ width: '100%' }}>
            <div style={{ width: '100%', marginBottom: 8 }}>
              <style>{`
                .collage{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; grid-auto-rows: 120px; }
                .collage-item{ position: relative; overflow: hidden; border-radius: 18px; box-shadow: 0 8px 20px rgba(12,12,12,0.12); cursor: pointer; transition: transform 320ms ease, box-shadow 320ms ease; }
                .collage-item:hover{ transform: translateY(-6px) scale(1.02); box-shadow: 0 18px 40px rgba(12,12,12,0.18); }
                .collage-img{ width: 100%; height: 100%; object-fit: cover; display: block; }
                .collage-caption{ position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 12px; color: #fff; font-weight: 700; font-size: 14px; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%); }
                /* Decorative spanning for a dynamic collage */
                .collage-item:nth-child(1){ grid-column: span 3; grid-row: span 2; }
                .collage-item:nth-child(2){ grid-column: span 2; grid-row: span 1; }
                .collage-item:nth-child(3){ grid-column: span 1; grid-row: span 2; }
                .collage-item:nth-child(4){ grid-column: span 2; grid-row: span 2; }
                .collage-item:nth-child(5){ grid-column: span 2; grid-row: span 1; }
                .collage-item:nth-child(6){ grid-column: span 3; grid-row: span 1; }
                .collage-item:nth-child(7){ grid-column: span 2; grid-row: span 1; }
                .collage-item:nth-child(8){ grid-column: span 1; grid-row: span 1; }
                @media (max-width: 900px){ .collage{ grid-template-columns: repeat(3, 1fr); grid-auto-rows: 120px; } .collage-item:nth-child(1){ grid-column: span 2; grid-row: span 2; } }
                @media (max-width: 480px){ .collage{ grid-template-columns: repeat(2, 1fr); grid-auto-rows: 100px; } .collage-item{ border-radius: 12px; } }
              `}</style>

              <div className="collage">
                {welcomeImages.map((img, i) => (
                  <figure key={i} className="collage-item" aria-hidden={false} style={{ borderRadius: img.radius || 18 }}>
                    <img
                      className="collage-img"
                      src={img.src}
                      alt={img.alt || `welcome-${i}`}
                      onError={(e) => { e.currentTarget.src = '/logo192.svg'; }}
                    />
                    {img.caption ? <figcaption className="collage-caption">{img.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </div>
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







