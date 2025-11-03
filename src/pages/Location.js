import React, { useEffect, useState } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';

export default function Location() {
  const { theme } = useTheme();
  const [geoError, setGeoError] = useState(null);
  
  // OpenStreetMap URL for Fotetsa location
  const mapsUrl = `https://www.openstreetmap.org/?mlat=5.4391&mlon=5.4391&zoom=14`;

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée');
      return;
    }

    const fail = (err) => {
      setGeoError(err.message || 'Impossible de récupérer la position');
    };

    navigator.geolocation.getCurrentPosition(
      () => {}, // Success - nous n'utilisons plus les coordonnées avec OpenStreetMap
      fail,
      { enableHighAccuracy: false, timeout: 10000 }
    );
    
    return () => {};
  }, []);
  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ color: theme.colors.text }}>Bienvenue à Nzie</h1>
        <div style={{ margin: '12px 0', color: theme.colors.textMuted }}>Semaine du 24 au 30 Novembre 2025</div>
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow.md, border: `1px solid ${theme.colors.border}` }}>
          <iframe
            title="map"
            width="100%"
            height="520"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${5.3891},${5.4891},${5.3891},${5.4891}&layer=mapnik&marker=${5.4391},${5.4391}`}
          />
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: theme.colors.primary, color: '#1a120c', padding: '12px 16px', borderRadius: 14, fontWeight: 800, textDecoration: 'none' }}>Voir sur OpenStreetMap</a>
          {geoError && <div style={{ color: theme.colors.textMuted }}>{geoError}</div>}
        </div>
      </Container>
    </div>
  );
}







