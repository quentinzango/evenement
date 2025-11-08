import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Hook to read messages (public) and subscribe realtime.
export default function useMessagesSupabase() {
  const [messages, setMessages] = useState([]);
  const chanRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase
        .from('messages')
        .select('id, text, created_at, profiles(display_name)')
        .order('created_at', { ascending: false });
      if (error) console.error('load messages error', error);
      else if (mounted) setMessages(data || []);
    }
    load();

    chanRef.current = supabase.channel('messages-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        const rec = payload.new ?? payload.old;
        setMessages(prev => {
          if (payload.eventType === 'INSERT') return [rec, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map(p => p.id === rec.id ? rec : p);
          if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== rec.id);
          return prev;
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(chanRef.current); } catch (e) { }
    };
  }, []);

  // postMessage uses Edge Function endpoint to enforce server-side rules.
  async function postMessage({ functionUrl, token, text }) {
    if (!functionUrl) throw new Error('functionUrl required');
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, text })
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'post_failed');
    return j;
  }

  return { messages, postMessage };
}
