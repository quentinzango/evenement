import React, { useEffect, useState } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';

export default function Location() {
  const { theme } = useTheme();
  // Destination as a Plus Code (Fotetsa)
  const destinationPlusCode = 'CX8W+F86 Fotetsa';
  const destinationForUrl = encodeURIComponent(destinationPlusCode);

  const [origin, setOrigin] = useState(null);
  const [geoError, setGeoError] = useState(null);

  // Build a generic maps URL (opens in new tab) as fallback
  const mapsUrlFallback = `https://www.google.com/maps/dir/?api=1&destination=${destinationForUrl}`;

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée');
      return;
    }

    const success = (pos) => {
      const { latitude, longitude } = pos.coords;
      setOrigin({ lat: latitude, lng: longitude });
    };
    const fail = (err) => {
      setGeoError(err.message || 'Impossible de récupérer la position');
    };

    navigator.geolocation.getCurrentPosition(success, fail, { enableHighAccuracy: false, timeout: 10000 });
    return () => {};
  }, []);
  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ color: theme.colors.text }}>Bienvenue à Nzie</h1>
        <div style={{ margin: '12px 0', color: theme.colors.textMuted }}>Semaine du 24 au 30 Novembre 2025</div>
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow.md, border: `1px solid ${theme.colors.border}` }}>
          {origin ? (
            // Use Google Maps directions with origin coords and Plus Code destination
            <iframe
              title="map-directions"
              width="100%"
              height="520"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destinationForUrl}&travelmode=driving&dir_action=navigate`}
            />
          ) : (
            // Fallback: show embed centered on destination (Plus Codes work in search query)
            <iframe
              title="map"
              width="100%"
              height="520"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${destinationForUrl}&z=14&output=embed`}
            />
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href={mapsUrlFallback} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: theme.colors.primary, color: '#1a120c', padding: '12px 16px', borderRadius: 14, fontWeight: 800, textDecoration: 'none' }}>Itinéraire (ouvrir)</a>
          {geoError && <div style={{ color: theme.colors.textMuted }}>{geoError}</div>}
        </div>
      </Container>
    </div>
  );
}







