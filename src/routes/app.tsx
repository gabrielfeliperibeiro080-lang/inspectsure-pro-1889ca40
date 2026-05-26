import { createFileRoute, redirect } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: () => (
    <>
      <AppShell />
      <Toaster richColors position="top-right" />
    </>
  ),
});
