import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Client-only auth check; on SSR just redirect to /login
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("cortex_auth");
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p?.state?.user) throw redirect({ to: "/app" });
        } catch (e) {
          if ((e as any)?.options) throw e;
        }
      }
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
