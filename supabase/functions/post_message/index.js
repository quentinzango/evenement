/**
 * Supabase Edge Function: post_message
 * Deploy under supabase/functions/post_message
 * Expects JSON body: { token, text }
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVICE_TOKEN_SECRET
 */
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';


// Use process.env. In Supabase Edge Functions set these env vars in the function settings.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || 'dev-secret-change-me';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { 'x-supabase-admin': 'true' } } });

export async function handler(req) {
  try {
    const body = await req.json();
    const { token, text } = body;
    if (!token) return new Response(JSON.stringify({ error: 'token required' }), { status: 401 });
    if (!text) return new Response(JSON.stringify({ error: 'text required' }), { status: 400 });

    let payload;
    try { payload = jwt.verify(token, DEVICE_TOKEN_SECRET); } catch (err) { return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401 }); }

    const profile_id = payload.profile_id;
    if (!profile_id) return new Response(JSON.stringify({ error: 'invalid token payload' }), { status: 401 });

    // optional: verify profile exists
    const { data: p } = await supabase.from('profiles').select('id').eq('id', profile_id).limit(1).single();
    if (!p) return new Response(JSON.stringify({ error: 'profile not found' }), { status: 404 });

    const { error } = await supabase.from('messages').insert({ profile_id, text });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
