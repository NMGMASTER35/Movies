import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const ADMIN_USER_IDS = new Set(['ae8d08c2-43e1-4fb1-b75d-0d9bd989f632']);

export const isAdminUser = (user) => Boolean(user?.role === 'admin' || (user?.id && ADMIN_USER_IDS.has(user.id)));
