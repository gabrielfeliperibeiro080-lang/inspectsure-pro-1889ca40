import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, useData } from "@/lib/store";
import { toast } from "sonner";
import { Database, Cloud, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/configuracoes")({
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const { reset, properties, inspections } = useData();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Conta, dados e integrações da sua imobiliária.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Info label="Nome" value={user?.name ?? "—"} />
          <Info label="E-mail" value={user?.email ?? "—"} />
          <Info label="Perfil" value={user?.role ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Trial gratuito</div>
              <div className="text-xs text-muted-foreground">
                7 dias para conhecer todos os recursos.
              </div>
            </div>
            <Button onClick={() => toast.info("Integração com Mercado Pago disponível após conectar o Supabase.")}>
              Assinar plano
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3 rounded-lg border bg-amber-50 p-3 text-amber-900">
            <AlertTriangle className="size-4 mt-0.5" />
            <div>
              <div className="font-medium">Modo offline — dados locais</div>
              <p className="text-xs">
                Por enquanto, os dados estão sendo salvos apenas no seu dispositivo
                (localStorage). Conecte o Supabase para sincronização entre usuários,
                backup automático e área do cliente.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Database className="size-4" /> Imóveis salvos
              </div>
              <div className="mt-1 text-2xl font-semibold">{properties.length}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Cloud className="size-4" /> Vistorias salvas
              </div>
              <div className="mt-1 text-2xl font-semibold">{inspections.length}</div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Apagar TODOS os imóveis e vistorias deste dispositivo?")) {
                reset();
                toast.success("Dados apagados");
              }
            }}
          >
            Limpar dados locais
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
