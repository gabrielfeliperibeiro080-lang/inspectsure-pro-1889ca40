import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, FileCheck2, Smartphone } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(form.email, form.password);
      } else {
        await signUp(form.name, form.email, form.password);
        toast.success("Conta criada com sucesso");
      }
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar p-12 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            C
          </div>
          <div>
            <div className="font-semibold">Córtex Engine</div>
            <div className="text-sm opacity-70">Vistoria Pro</div>
          </div>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Vistorias com validade jurídica, sem prejuízos.
          </h1>
          <p className="opacity-80">
            Plataforma completa para imobiliárias: checklist inteligente, fotos otimizadas,
            assinatura digital e relatórios comparativos automáticos.
          </p>
          <div className="space-y-3 text-sm opacity-90">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5" /> IP, geolocalização, timestamp e hash SHA-256
            </div>
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-5" /> Relatórios PDF profissionais em segundos
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="size-5" /> Mobile-first, funciona em campo
            </div>
          </div>
        </div>
        <div className="text-xs opacity-60">© Córtex Vistoria Pro</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
              C
            </div>
            <div>
              <div className="font-semibold leading-tight">Córtex Vistoria Pro</div>
              <div className="text-xs text-muted-foreground">Sistema profissional</div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Acesse sua conta para gerenciar vistorias."
                : "Cadastre sua imobiliária em segundos."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => toast.info("Em breve: recuperação de senha por e-mail.")}
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <Button className="w-full" disabled={loading} size="lg">
              {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Criar agora
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
