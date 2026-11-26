
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createBrowserClient(url!, anonKey!)
  : null;
console.log("Supabase URL:", url);
console.log("Supabase key loaded:", Boolean(anonKey));
console.log("Supabase configured:", isSupabaseConfigured);