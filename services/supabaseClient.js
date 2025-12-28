import { createClient } from '@supabase/supabase-js';

const SUPABASE_STORAGE_KEY = 'supabase-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const getStoredConfig = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(SUPABASE_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.url && parsed?.anonKey) {
      return parsed;
    }
  } catch (_error) {
    // Ignore parsing failures and fall back to defaults.
  }

  return null;
};

const createSupabaseClient = () => {
  const runtimeConfig = getStoredConfig();
  const url = supabaseUrl || runtimeConfig?.url;
  const anonKey = supabaseAnonKey || runtimeConfig?.anonKey;

  return url && anonKey ? createClient(url, anonKey) : null;
};

export let supabase = createSupabaseClient();

export const saveSupabaseConfig = ({ url, anonKey }) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const sanitizedUrl = url?.trim();
  const sanitizedKey = anonKey?.trim();

  if (!sanitizedUrl || !sanitizedKey) {
    return null;
  }

  const payload = { url: sanitizedUrl, anonKey: sanitizedKey };
  window.localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(payload));
  supabase = createClient(sanitizedUrl, sanitizedKey);

  return supabase;
};

export const clearSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SUPABASE_STORAGE_KEY);
  supabase = createSupabaseClient();
};

export const getSupabaseConfig = () => getStoredConfig();

export const ADMIN_USER_IDS = new Set(['ae8d08c2-43e1-4fb1-b75d-0d9bd989f632']);

export const isAdminUser = (user) => Boolean(user?.role === 'admin' || (user?.id && ADMIN_USER_IDS.has(user.id)));
