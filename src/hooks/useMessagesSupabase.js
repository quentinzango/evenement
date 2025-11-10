import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Hook to read messages (public) and subscribe realtime.
export default function useMessagesSupabase() {
  const [messages, setMessages] = useState([]);
  const chanRef = useRef(null);
  const tempsRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase
        .from('messages')
        .select('id, text, profile_id, created_at, profiles(display_name)')
        .order('created_at', { ascending: true });
      if (error) console.error('load messages error', error);
      else if (mounted) setMessages(data || []);
    }
    load();

    chanRef.current = supabase.channel('messages-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        const rec = payload.new ?? payload.old;
        const apply = (r) => setMessages(prev => {
          if (payload.eventType === 'INSERT') {
            // Remove matching temp messages (same author and text)
            const filtered = prev.filter(p => !(p._temp && p.profile_id === r.profile_id && p.text === r.text));
            return [...filtered, r];
          }
          if (payload.eventType === 'UPDATE') return prev.map(p => p.id === r.id ? r : p);
          if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== r.id);
          return prev;
        });
        if (payload.eventType === 'INSERT' && (!rec.profiles || !rec.profiles.display_name)) {
          // Enrich author name immediately for new messages
          supabase
            .from('profiles')
            .select('display_name')
            .eq('id', rec.profile_id)
            .limit(1)
            .single()
            .then(({ data }) => {
              if (data?.display_name) rec.profiles = { display_name: data.display_name };
              apply(rec);
            })
            .catch(() => apply(rec));
        } else {
          apply(rec);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(chanRef.current); } catch (e) { }
    };
  }, []);

  // postMessage uses Edge Function endpoint to enforce server-side rules.
  async function postMessage({ functionUrl, token, text, optimistic }) {
    if (!functionUrl) throw new Error('functionUrl required');
    // Optimistic insert (optional)
    if (optimistic && optimistic.profile_id && optimistic.display_name && text) {
      const temp = {
        id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        text,
        profile_id: optimistic.profile_id,
        created_at: new Date().toISOString(),
        profiles: { display_name: optimistic.display_name },
        _temp: true,
      };
      tempsRef.current.push(temp.id);
      setMessages(prev => [...prev, temp]);
    }
    const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey } : {}),
      },
      body: JSON.stringify({ token, text })
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'post_failed');
    return j;
  }

  return { messages, postMessage };
}
