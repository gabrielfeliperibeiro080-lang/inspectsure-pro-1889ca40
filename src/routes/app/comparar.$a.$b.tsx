import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/lib/utils";

export const Route = createFileRoute("/app/comparar/$a/$b")({
  component: Comparar,
});

function Comparar() {
  const { a, b } = Route.useParams();
  const navigate = useNavigate();
  const { inspections, properties } = useData();
  const A = inspections.find((i) => i.id === a);
  const B = inspections.find((i) => i.id === b);

  if (!A || !B) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" onClick={() => navigate({ to: "/app/vistorias" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
        <p className="text-sm text-muted-foreground">Vistorias não encontradas.</p>
      </div>
    );
  }

  // Ensure entrada → A, saida → B
  const entrada = A.type === "entrada" ? A : B;
  const saida = A.type === "saida" ? A : B;
  const property = properties.find((p) => p.id === entrada.propertyId);

  // Build diff: for each room/item in entrada, find counterpart by name
  const rows: {
    room: string;
    item: string;
    before: string;
    after: string;
    change: "novo_dano" | "resolvido" | "igual" | "ausente";
  }[] = [];

  for (const r of entrada.rooms) {
    const roomS = saida.rooms.find((x) => x.name === r.name);
    for (const it of r.items) {
      const itS = roomS?.items.find((x) => x.name === it.name);
      const before = it.status ?? "—";
      const after = itS?.status ?? "—";
      let change: typeof rows[number]["change"] = "igual";
      if (!itS) change = "ausente";
      else if (before !== after) {
        if (after === "danificado" && before !== "danificado") change = "novo_dano";
        else if (before === "danificado" && after !== "danificado") change = "resolvido";
        else change = "novo_dano";
      }
      rows.push({ room: r.name, item: it.name, before, after, change });
    }
  }

  const novosDanos = rows.filter((r) => r.change === "novo_dano").length;
  const resolvidos = rows.filter((r) => r.change === "resolvido").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/vistorias" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparativo</h1>
        <p className="text-sm text-muted-foreground">
          {property ? formatAddress(property) : "Imóvel"} — entrada vs saída
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-10 place-items-center rounded-lg bg-red-100 text-red-700">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{novosDanos}</div>
              <div className="text-xs text-muted-foreground">Novos danos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{resolvidos}</div>
              <div className="text-xs text-muted-foreground">Resolvidos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-10 place-items-center rounded-lg bg-muted">
              <MinusCircle className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{rows.length - novosDanos - resolvidos}</div>
              <div className="text-xs text-muted-foreground">Sem alteração</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens com alteração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            <div className="grid grid-cols-12 gap-2 py-2 text-xs font-medium uppercase text-muted-foreground">
              <div className="col-span-3">Ambiente</div>
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Entrada</div>
              <div className="col-span-2">Saída</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {rows
              .filter((r) => r.change !== "igual")
              .map((r, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 py-2">
                  <div className="col-span-3">{r.room}</div>
                  <div className="col-span-3">{r.item}</div>
                  <div className="col-span-2 capitalize">{r.before}</div>
                  <div className="col-span-2 capitalize">{r.after}</div>
                  <div className="col-span-2 text-right">
                    <Badge
                      variant={
                        r.change === "novo_dano"
                          ? "destructive"
                          : r.change === "resolvido"
                            ? "default"
                            : "outline"
                      }
                    >
                      {r.change === "novo_dano"
                        ? "Novo dano"
                        : r.change === "resolvido"
                          ? "Resolvido"
                          : "Ausente"}
                    </Badge>
                  </div>
                </div>
              ))}
            {rows.every((r) => r.change === "igual") && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma alteração detectada entre as vistorias.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button asChild variant="outline">
          <Link to="/app/vistorias/$id" params={{ id: entrada.id }}>
            Ver entrada
          </Link>
        </Button>
        <Button asChild>
          <Link to="/app/vistorias/$id" params={{ id: saida.id }}>
            Ver saída
          </Link>
        </Button>
      </div>
    </div>
  );
}
