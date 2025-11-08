/**
 * Supabase Edge Function: register_device
 * Deploy under supabase/functions/register_device
 * Expects JSON body: { device_id, display_name }
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVICE_TOKEN_SECRET
 */
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// read env in a way that works both in Deno (Supabase Functions) and Node (local testing)
// Use process.env. In Supabase Edge Functions set these env vars in the function settings.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || 'dev-secret-change-me';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { 'x-supabase-admin': 'true' } } });

export async function handler(req) {
  try {
    const body = await req.json();
    const { device_id, display_name } = body;
    if (!device_id) return new Response(JSON.stringify({ error: 'device_id required' }), { status: 400 });

    // upsert profile by device_id
    const { data, error } = await supabase.from('profiles').upsert({ device_id, display_name }, { onConflict: 'device_id' }).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    // sign token with profile id and device id
    const token = jwt.sign({ profile_id: data.id, device_id }, DEVICE_TOKEN_SECRET, { expiresIn: '30d' });
    return new Response(JSON.stringify({ token, profile: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
