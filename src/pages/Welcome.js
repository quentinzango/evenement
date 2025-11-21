import React from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';
import welcomeImages from '../welcomeImages';

export default function Welcome() {
  const { theme } = useTheme();
  const [activeImage, setActiveImage] = React.useState(null);
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
                .collage-item{ position: relative; overflow: hidden; border-radius: 18px; box-shadow: 0 8px 20px rgba(12,12,12,0.16); cursor: pointer; transition: transform 320ms ease, box-shadow 320ms ease, filter 320ms ease; animation: collageFloat 12s ease-in-out infinite; transform-origin: center; }
                .collage-item:hover{ transform: translateY(-10px) scale(1.06) rotateZ(-1.5deg); box-shadow: 0 22px 55px rgba(0,0,0,0.35); filter: brightness(1.06) saturate(1.08); }
                .collage-img{ width: 100%; height: 100%; object-fit: cover; display: block; }
                .collage-caption{ position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 12px; color: #fff; font-weight: 700; font-size: 14px; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%); }
                @keyframes collageFloat {
                  0% { transform: translateY(0px) translateX(0px) scale(1) rotateZ(0deg); }
                  20% { transform: translateY(-6px) translateX(4px) scale(1.04) rotateZ(-1deg); }
                  40% { transform: translateY(4px) translateX(-4px) scale(1.02) rotateZ(1deg); }
                  60% { transform: translateY(-3px) translateX(-2px) scale(1.03) rotateZ(0deg); }
                  80% { transform: translateY(3px) translateX(3px) scale(1.01) rotateZ(1deg); }
                  100% { transform: translateY(0px) translateX(0px) scale(1) rotateZ(0deg); }
                }
                .collage-item:nth-child(1){ animation-delay: 0s; }
                .collage-item:nth-child(2){ animation-delay: 2s; }
                .collage-item:nth-child(3){ animation-delay: 4s; }
                .collage-item:nth-child(4){ animation-delay: 6s; }
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
                  <figure
                    key={i}
                    className="collage-item"
                    aria-hidden={false}
                    style={{ borderRadius: img.radius || 18 }}
                    onClick={() => setActiveImage(img)}
                  >
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
        {activeImage && (
          <div
            onClick={() => setActiveImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 60,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: theme.shadow.lg,
                position: 'relative',
              }}
            >
              <img
                src={activeImage.src}
                alt={activeImage.alt || 'souvenir'}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}







