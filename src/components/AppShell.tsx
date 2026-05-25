import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Settings,
  LogOut,
  Plus,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/app/imoveis", label: "Imóveis", icon: Building2 },
  { to: "/app/vistorias", label: "Vistorias", icon: ClipboardList },
  { to: "/app/configuracoes", label: "Ajustes", icon: Settings },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            C
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Córtex</div>
            <div className="text-xs opacity-70">Vistoria Pro</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.to, n.exact);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid size-8 place-items-center rounded-full bg-sidebar-accent">
              <User className="size-4" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="truncate text-xs opacity-70 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
              className="rounded p-1.5 hover:bg-sidebar-accent"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
            C
          </div>
          <div className="text-sm font-semibold">Córtex Vistoria</div>
        </div>
        <button
          onClick={() => {
            signOut();
            navigate({ to: "/login" });
          }}
          className="rounded p-2 text-muted-foreground"
        >
          <LogOut className="size-5" />
        </button>
      </header>

      {/* Main */}
      <main className="md:pl-64 pb-24 md:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t bg-background md:hidden">
        {nav.slice(0, 2).map((n) => {
          const Icon = n.icon;
          const active = isActive(n.to, n.exact);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {n.label}
            </Link>
          );
        })}
        <Link
          to="/app/vistorias/nova"
          className="-mt-6 mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <Plus className="size-6" />
        </Link>
        {nav.slice(2).map((n) => {
          const Icon = n.icon;
          const active = isActive(n.to, n.exact);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
