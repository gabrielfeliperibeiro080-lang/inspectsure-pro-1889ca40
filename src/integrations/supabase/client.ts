import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kknzgvfzhmmcfuyxgzkv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbnpndmZ6aG1tY2Z1eXhnemt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODk0OTMsImV4cCI6MjA5NTM2NTQ5M30.53CPuawCLzkwFR_oIb88wXDCV-nKMGAHvzOvElR1C2c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "cortex_supabase_auth",
  },
});
