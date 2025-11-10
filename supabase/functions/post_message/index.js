/**
 * Supabase Edge Function: post_message
 * Deploy under supabase/functions/post_message
 * Expects JSON body: { token, text }
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVICE_TOKEN_SECRET
 */
import { createClient } from 'npm:@supabase/supabase-js';
import { jwtVerify } from 'npm:jose';


// Use process.env. In Supabase Edge Functions set these env vars in the function settings.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || 'dev-secret-change-me';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { 'x-supabase-admin': 'true' } } });

async function getSecretKey() {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(DEVICE_TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const { token, text } = body || {};
    if (!token) {
      return new Response(JSON.stringify({ error: 'token required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let payload;
    try {
      const key = await getSecretKey();
      const { payload: pl } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = pl;
    } catch (err) {
      return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const profile_id = payload.profile_id;
    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'invalid token payload' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: p } = await supabase.from('profiles').select('id').eq('id', profile_id).limit(1).single();
    if (!p) {
      return new Response(JSON.stringify({ error: 'profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error } = await supabase.from('messages').insert({ profile_id, text });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'internal_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
