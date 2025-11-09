const DEVICE_ID_KEY = 'device_id';
const DEVICE_TOKEN_KEY = 'device_token';

export function getOrCreateDeviceId() {
  let id = getCookie(DEVICE_ID_KEY);
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    }
    setCookie(DEVICE_ID_KEY, id, 365);
  }
  return id;
}

export function getStoredToken() {
  return getCookie(DEVICE_TOKEN_KEY) || '';
}

export function storeToken(token) {
  if (token) setCookie(DEVICE_TOKEN_KEY, token, 30);
}

// registerDevice calls the Supabase Edge Function 'register_device'
// functionUrl should be the full function URL provided by supabase when deployed.
export async function registerDevice({ functionUrl, display_name }) {
  const device_id = getOrCreateDeviceId();
  // Call Edge Function to register and get token
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const resp = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anonKey ? { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey } : {}),
    },
    body: JSON.stringify({ device_id, display_name })
  });
  let json = null;
  try { json = await resp.json(); } catch (e) { json = null; }
  if (resp.ok && json?.token) {
    storeToken(json.token);
    return { ok: true, profile: json.profile, token: json.token };
  }
  return { ok: false, error: json?.error || 'register_failed' };
}

function setCookie(name, value, days) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/;SameSite=Lax';
  } catch (e) {}
}

function getCookie(name) {
  try {
    const cname = name + '=';
    const decodedCookie = decodeURIComponent(document.cookie || '');
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
    }
  } catch (e) {}
  return '';
}
