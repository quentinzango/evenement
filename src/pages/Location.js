import React, { useEffect } from 'react';

export default function Location() {
  useEffect(() => {
    const DEST_QUERY = 'CX8W+F86 Fotetsa';
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_QUERY)}`;
    try {
      window.location.href = mapsUrl;
    } catch (e) {
      // en cas d'échec, l'utilisateur pourra toujours cliquer sur le lien ci-dessous
    }
  }, []);

  const DEST_QUERY = 'CX8W+F86 Fotetsa';
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_QUERY)}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <a href={mapsUrl} target="_blank" rel="noreferrer" style={{
        background: '#10b981',
        color: '#111827',
        padding: '12px 18px',
        borderRadius: 999,
        fontWeight: 800,
        textDecoration: 'none',
      }}>
        Ouvrir mon itinéraire dans Google Maps
      </a>
    </div>
  );
}







