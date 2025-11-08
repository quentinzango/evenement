import { supabase } from './supabase';

const DEVICE_ID_KEY = 'device_id';
const DEVICE_TOKEN_KEY = 'device_token';

export function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    }
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getStoredToken() {
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function storeToken(token) {
  if (token) localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

// registerDevice calls the Supabase Edge Function 'register_device'
// functionUrl should be the full function URL provided by supabase when deployed.
export async function registerDevice({ functionUrl, display_name }) {
  const device_id = getOrCreateDeviceId();
  // Call Edge Function to register and get token
  const resp = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id, display_name })
  });
  const json = await resp.json();
  if (resp.ok && json?.token) {
    storeToken(json.token);
    return { ok: true, profile: json.profile, token: json.token };
  }
  return { ok: false, error: json?.error || 'register_failed' };
}
