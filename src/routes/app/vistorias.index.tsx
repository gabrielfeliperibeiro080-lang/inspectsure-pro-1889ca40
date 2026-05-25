import { createFileRoute, Link } from "@tanstack/react-router";
import { useData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Search } from "lucide-react";
import { useState } from "react";
import { formatAddress } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/vistorias/")({
  component: VistoriasList,
});

function VistoriasList() {
  const { inspections, properties } = useData();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "entrada" | "saida" | "pendentes">("all");

  const filtered = inspections.filter((i) => {
    const prop = properties.find((p) => p.id === i.propertyId);
    if (filter === "entrada" && i.type !== "entrada") return false;
    if (filter === "saida" && i.type !== "saida") return false;
    if (filter === "pendentes" && i.status === "concluida") return false;
    if (q) {
      const text = `${prop ? formatAddress(prop) : ""} ${i.inspectorName}`.toLowerCase();
      if (!text.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vistorias</h1>
          <p className="text-sm text-muted-foreground">
            Histórico completo, filtros e ações rápidas.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/vistorias/nova">
            <Plus className="size-4 mr-1" /> Nova vistoria
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por endereço ou vistoriador"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 rounded-md border bg-card p-1">
          {(["all", "entrada", "saida", "pendentes"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded px-3 py-1.5 text-xs capitalize ${
                filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {k === "all" ? "Todas" : k}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Nenhuma vistoria encontrada</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie a primeira selecionando um imóvel.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((i) => {
            const prop = properties.find((p) => p.id === i.propertyId);
            const damaged = i.rooms.reduce(
              (acc, r) => acc + r.items.filter((it) => it.status === "danificado").length,
              0,
            );
            return (
              <Link key={i.id} to="/app/vistorias/$id" params={{ id: i.id }}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {prop ? formatAddress(prop) : "Imóvel removido"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(i.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·{" "}
                        {i.inspectorName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {i.type}
                      </Badge>
                      <Badge
                        variant={i.status === "concluida" ? "default" : "outline"}
                        className="capitalize"
                      >
                        {i.status.replace("_", " ")}
                      </Badge>
                      {damaged > 0 && <Badge variant="destructive">{damaged} danos</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
