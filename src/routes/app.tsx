import { createFileRoute, redirect } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("cortex_auth");
      let signedIn = false;
      if (raw) {
        try {
          signedIn = !!JSON.parse(raw)?.state?.user;
        } catch {
          /* noop */
        }
      }
      if (!signedIn) throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <>
      <AppShell />
      <Toaster richColors position="top-right" />
    </>
  ),
});
