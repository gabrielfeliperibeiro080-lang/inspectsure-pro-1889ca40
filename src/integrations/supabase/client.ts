import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dqcvbyjsdehairrsbukj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3ZieWpzZGVoYWlycnNidWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjAzOTMsImV4cCI6MjA5NTUzNjM5M30.m1T0SUDi02l5-MIuI3pqIZWWWY4UJZ8NhJdg_SwyGDI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "cortex_supabase_auth",
  },
});
