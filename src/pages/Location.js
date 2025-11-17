import React, { useEffect, useRef, useState } from 'react';
import Container from '../components/Container';
import { useTheme } from '../ThemeContext';

export default function Location() {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const routeLayerRef = useRef(null);
  const lineRef = useRef(null);
  const userInteractedRef = useRef(false);
  const [geoError, setGeoError] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // distance & durée via OSRM
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
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        link.setAttribute('data-leaflet', '1');
        document.head.appendChild(link);
      }
      function onReady() { resolve(); }
      if (window.L) return onReady();
      if (!hasJS) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
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
    let lastRouteFrom = null;
    let watchId = null;
    let destroyed = false;

    async function init() {
      try {
        await ensureLeafletLoaded();
        if (destroyed) return;
        const L = window.L;
        mapRef.current = L.map(mapElRef.current, { zoomControl: true, attributionControl: true });
        mapRef.current.on('movestart', () => { userInteractedRef.current = true; });
        mapRef.current.on('zoomstart', () => { userInteractedRef.current = true; });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Geocode destination with reinforcement (multiple queries, then ENV fallback)
        let dest = null;
        async function nominatim(q) {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
          const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
          if (!res.ok) return null;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
          return null;
        }
        try { dest = await nominatim(DEST_QUERY); } catch (e) {}
        if (!dest) { try { dest = await nominatim('CX8W+F86, Fotetsa, Dschang, Cameroon'); } catch (e) {} }
        if (!dest) { try { dest = await nominatim('Fotetsa, Dschang, Cameroon'); } catch (e) {} }
        if (!dest) {
          const envLat = parseFloat(process.env.REACT_APP_DEST_LAT || '');
          const envLng = parseFloat(process.env.REACT_APP_DEST_LNG || '');
          if (!Number.isNaN(envLat) && !Number.isNaN(envLng)) {
            dest = { lat: envLat, lng: envLng };
          }
        }

        if (dest) {
          window.L.marker([dest.lat, dest.lng], { title: 'Destination' }).addTo(mapRef.current);
        }

        async function updateRoute(userPos) {
          if (!dest || !userPos) return;
          const fromKey = `${userPos.lat.toFixed(5)},${userPos.lng.toFixed(5)}`;
          if (lastRouteFrom === fromKey) return;
          lastRouteFrom = fromKey;
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
            const r = await fetch(url);
            const j = await r.json();
            const coords = j?.routes?.[0]?.geometry?.coordinates;
            if (Array.isArray(coords)) {
              const latlngs = coords.map(([lng, lat]) => [lat, lng]);
              if (!routeLayerRef.current) {
                routeLayerRef.current = window.L.polyline(latlngs, { color: '#22c55e', weight: 6, opacity: 0.95 }).addTo(mapRef.current);
                try { routeLayerRef.current.bringToFront(); } catch (e) {}
              } else {
                routeLayerRef.current.setLatLngs(latlngs);
                try { routeLayerRef.current.bringToFront(); } catch (e) {}
              }
              if (!userInteractedRef.current) {
                try {
                  const bounds = routeLayerRef.current.getBounds();
                  mapRef.current.fitBounds(bounds.pad(0.15), { padding: [30, 30] });
                } catch (e) {}
              }

              // Met à jour les infos de trajet (distance/durée routières) si disponibles
              try {
                const route = j?.routes?.[0];
                if (route && typeof route.distance === 'number' && typeof route.duration === 'number') {
                  const dk = Math.round((route.distance / 1000) * 10) / 10; // km
                  const dm = Math.round(route.duration / 60); // minutes
                  setRouteInfo({ distanceKm: dk, durationMin: dm });
                  setDistanceKm(dk);
                }
              } catch (e) {}
            }
          } catch (e) {}
        }

        function updateLine(userPos) {
          if (dest && userPos) {
            const pts = [ [userPos.lat, userPos.lng], [dest.lat, dest.lng] ];
            if (!lineRef.current) lineRef.current = window.L.polyline(pts, { color: '#0ea5e9', weight: 4, opacity: 0.8 }).addTo(mapRef.current);
            else lineRef.current.setLatLngs(pts);
            const d = distanceKmBetween(userPos, dest);
            if (d != null) setDistanceKm(Math.round(d * 10) / 10);
            if (!userInteractedRef.current) {
              try {
                const bounds = routeLayerRef.current ? routeLayerRef.current.getBounds() : lineRef.current.getBounds();
                mapRef.current.fitBounds(bounds, { padding: [30, 30] });
              } catch (e) {}
            }
            // fetch route polyline asynchronously (throttled by lastRouteFrom)
            updateRoute(userPos);
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
          <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                try {
                  const bounds = (routeLayerRef.current && routeLayerRef.current.getBounds)
                    ? routeLayerRef.current.getBounds()
                    : (lineRef.current && lineRef.current.getBounds ? lineRef.current.getBounds() : null);
                  if (bounds) {
                    mapRef.current.fitBounds(bounds, { padding: [30, 30] });
                    userInteractedRef.current = false;
                  }
                } catch (e) {}
              }}
              style={{ background: theme.colors.primary, color: '#1a120c', border: 'none', padding: '8px 12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: theme.shadow.sm }}
            >
              Recentrer
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: theme.colors.primary, color: '#1a120c', padding: '10px 14px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>Ouvrir l'itinéraire</a>
          {routeInfo ? (
            <div style={{ color: theme.colors.textMuted }}>
              Distance routière: ~{routeInfo.distanceKm} km · ~{routeInfo.durationMin} min
            </div>
          ) : distanceKm != null && (
            <div style={{ color: theme.colors.textMuted }}>Distance: ~{distanceKm} km</div>
          )}
          {geoError && <div style={{ color: theme.colors.textMuted }}>• {geoError}</div>}
        </div>
      </Container>
    </div>
  );
}







