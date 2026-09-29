import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sanitize URL in case /rest/v1 or trailing slashes were copied
const sanitizeUrl = (url?: string) => {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const supabaseUrl = sanitizeUrl(rawSupabaseUrl);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  // Enforce HTTPS communication for external APIs (Rule 2)
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost') || supabaseUrl.startsWith('http://127.0.0.1'))
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey!)
  : null;
