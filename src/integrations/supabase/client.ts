import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rintyyxvllqsbikuocjb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnR5eXh2bGxxc2Jpa3VvY2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDAwNjUsImV4cCI6MjA5NTQxNjA2NX0.mYo_2qtJnSCrvRU0ubNg-y0zpVIennvQSghgKKmi56c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "cortex_supabase_auth",
  },
});
