/**
 * Supabase Edge Function: register_device
 * Deploy under supabase/functions/register_device
 * Expects JSON body: { device_id, display_name }
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVICE_TOKEN_SECRET
 */
import { createClient } from 'npm:@supabase/supabase-js';
import { SignJWT } from 'npm:jose';

// read env in a way that works both in Deno (Supabase Functions) and Node (local testing)
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
    const { device_id, display_name, avatar } = body || {};
    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ device_id, display_name, avatar }, { onConflict: 'device_id' })
      .select()
      .single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const key = await getSecretKey();
    const token = await new SignJWT({ profile_id: data.id, device_id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(key);
    return new Response(JSON.stringify({ token, profile: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'internal_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
