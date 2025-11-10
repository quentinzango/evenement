import React, { useEffect, useRef, useState } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';

export default function Location() {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const [geoError, setGeoError] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const DEST_QUERY = 'CX8W+F86 Fotetsa';

  // Utility to load external CSS/JS once
  function ensureLeafletLoaded() {
    return new Promise((resolve) => {
      const hasCSS = document.querySelector('link[data-leaflet]');
      const hasJS = document.querySelector('script[data-leaflet]');
      if (!hasCSS) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        link.crossOrigin = '';
        link.setAttribute('data-leaflet', '1');
        document.head.appendChild(link);
      }
      function onReady() { resolve(); }
      if (window.L) return onReady();
      if (!hasJS) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-o9N1j7kG96Qb2V8Lfa1eyZ3j3WFQ5Maw3NDnD8l7c+I=';
        script.crossOrigin = '';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-leaflet', '1');
        script.onload = onReady;
        document.body.appendChild(script);
      } else {
        // If script tag exists but L not yet ready, wait for onload
        hasJS.addEventListener('load', onReady, { once: true });
      }
    });
  }

  // Haversine distance in km
  function distanceKmBetween(a, b) {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180;
    const la2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  useEffect(() => {
    let userMarker = null;
    let destMarker = null;
    let line = null;
    let watchId = null;
    let destroyed = false;

    async function init() {
      try {
        await ensureLeafletLoaded();
        if (destroyed) return;
        const L = window.L;
        mapRef.current = L.map(mapElRef.current, { zoomControl: true, attributionControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Geocode destination via Nominatim
        let dest = null;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(DEST_QUERY)}`, {
            headers: { 'Accept-Language': 'fr' }
          });
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            dest = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        } catch (e) {}

        if (dest) {
          destMarker = window.L.marker([dest.lat, dest.lng], { title: 'Destination' }).addTo(mapRef.current);
        }

        function updateLine(userPos) {
          if (dest && userPos) {
            const pts = [ [userPos.lat, userPos.lng], [dest.lat, dest.lng] ];
            if (!line) line = window.L.polyline(pts, { color: '#0ea5e9', weight: 4, opacity: 0.8 }).addTo(mapRef.current);
            else line.setLatLngs(pts);
            const d = distanceKmBetween(userPos, dest);
            if (d != null) setDistanceKm(Math.round(d * 10) / 10);
            mapRef.current.fitBounds(line.getBounds(), { padding: [30, 30] });
          } else if (userPos && !dest) {
            mapRef.current.setView([userPos.lat, userPos.lng], 15);
          } else if (!userPos && dest) {
            mapRef.current.setView([dest.lat, dest.lng], 15);
          }
        }

        // User position
        if (!navigator.geolocation) {
          setGeoError('Géolocalisation non supportée');
        } else {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              const user = { lat: latitude, lng: longitude };
              if (!userMarker) {
                userMarker = window.L.marker([user.lat, user.lng], { title: 'Vous' }).addTo(mapRef.current);
              } else {
                userMarker.setLatLng([user.lat, user.lng]);
              }
              updateLine(user);
            },
            (err) => {
              setGeoError(err.message || 'Impossible de récupérer la position');
              if (dest) mapRef.current.setView([dest.lat, dest.lng], 14);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
          );
        }
      } catch (e) {
        setGeoError('Erreur initialisation carte');
      }
    }

    init();
    return () => {
      destroyed = true;
      try { if (watchId != null) navigator.geolocation.clearWatch(watchId); } catch (e) {}
      try { mapRef.current && mapRef.current.remove(); } catch (e) {}
    };
  }, []);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_QUERY)}`;

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Container style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ color: theme.colors.text }}>Itinéraire vers la destination</h1>
        <div style={{ margin: '8px 0', color: theme.colors.textMuted }}>Destination: {DEST_QUERY}</div>

        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow.md, border: `1px solid ${theme.colors.border}`, height: 520 }}>
          <div ref={mapElRef} style={{ position: 'absolute', inset: 0 }} />
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: theme.colors.primary, color: '#1a120c', padding: '10px 14px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>Ouvrir l'itinéraire</a>
          {distanceKm != null && (
            <div style={{ color: theme.colors.textMuted }}>Distance: ~{distanceKm} km</div>
          )}
          {geoError && <div style={{ color: theme.colors.textMuted }}>• {geoError}</div>}
        </div>
      </Container>
    </div>
  );
}







