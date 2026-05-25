import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/imoveis/$id")({
  component: ImovelDetail,
});

function ImovelDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { properties, inspections, deleteProperty } = useData();
  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate({ to: "/app/imoveis" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
        <p className="text-sm text-muted-foreground">Imóvel não encontrado.</p>
      </div>
    );
  }

  const history = inspections.filter((i) => i.propertyId === id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/imoveis" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Excluir este imóvel e suas vistorias?")) {
                deleteProperty(id);
                toast.success("Imóvel excluído");
                navigate({ to: "/app/imoveis" });
              }
            }}
          >
            <Trash2 className="size-4 mr-1" /> Excluir
          </Button>
          <Button asChild size="sm">
            <Link to="/app/vistorias/nova" search={{ propertyId: id }}>
              <Plus className="size-4 mr-1" /> Nova vistoria
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{formatAddress(property)}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {property.code} · CEP {property.zip || "—"}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {property.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Proprietário" value={property.ownerName} />
          <Info label="Telefone" value={property.ownerPhone || "—"} />
          <Info label="E-mail" value={property.ownerEmail || "—"} />
          <Info
            label="Cadastrado em"
            value={format(new Date(property.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Histórico de vistorias</CardTitle>
          <Badge variant="outline">{history.length}</Badge>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <ClipboardList className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma vistoria realizada ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {history.map((i) => (
                <Link
                  key={i.id}
                  to="/app/vistorias/$id"
                  params={{ id: i.id }}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="text-sm font-medium capitalize">Vistoria de {i.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(i.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·{" "}
                      {i.inspectorName}
                    </div>
                  </div>
                  <Badge
                    variant={i.status === "concluida" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {i.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
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
