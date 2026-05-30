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
              <div className="font-medium">
                {user?.subscriptionStatus === "active" ? "Plano InspectSure Pro" : "Trial gratuito"}
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.subscriptionStatus === "active" 
                  ? "Sua assinatura está ativa." 
                  : "7 dias para conhecer todos os recursos."}
              </div>
            </div>
            {user?.subscriptionStatus === "active" ? (
              <Button variant="outline" disabled>Assinatura Ativa</Button>
            ) : (
              <Button onClick={async () => {
                try {
                  toast.loading("Gerando link de pagamento...");
                  const { supabase } = await import("@/integrations/supabase/client");
                  const { data, error } = await supabase.functions.invoke("create-subscription", {
                    body: { email: user?.email, userId: user?.id }
                  });
                  toast.dismiss();
                  if (error) throw new Error(error.message);
                  if (data?.init_point) {
                    window.location.href = data.init_point;
                  } else {
                    throw new Error("Link de pagamento não retornado.");
                  }
                } catch (err: any) {
                  toast.dismiss();
                  toast.error(`Erro: ${err.message}`);
                }
              }}>
                Assinar plano
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
