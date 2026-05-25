import { createFileRoute, Link } from "@tanstack/react-router";
import { useData } from "@/lib/store";
import {
  Building2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { properties, inspections } = useData();
  const concluidas = inspections.filter((i) => i.status === "concluida");
  const pendentes = inspections.filter((i) => i.status !== "concluida");

  // tempo médio (min) entre createdAt e finishedAt
  const tempos = concluidas
    .map((i) =>
      i.finishedAt
        ? (new Date(i.finishedAt).getTime() - new Date(i.createdAt).getTime()) / 60000
        : 0,
    )
    .filter((t) => t > 0);
  const tempoMedio = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;

  // ranking vistoriadores
  const rankingMap = new Map<string, number>();
  for (const i of concluidas) {
    rankingMap.set(i.inspectorName, (rankingMap.get(i.inspectorName) ?? 0) + 1);
  }
  const ranking = [...rankingMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // imóveis com mais problemas
  const problemMap = new Map<string, number>();
  for (const i of inspections) {
    let dmg = 0;
    for (const r of i.rooms) for (const it of r.items) if (it.status === "danificado") dmg++;
    if (dmg > 0) problemMap.set(i.propertyId, (problemMap.get(i.propertyId) ?? 0) + dmg);
  }
  const topProblemas = [...problemMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, count]) => ({
      property: properties.find((p) => p.id === pid),
      count,
    }))
    .filter((x) => x.property);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das suas vistorias e imóveis.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/vistorias/nova">
            <Plus className="size-4 mr-1" /> Nova vistoria
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Imóveis" value={properties.length} icon={Building2} />
        <Stat label="Vistorias" value={inspections.length} icon={ClipboardList} />
        <Stat label="Concluídas" value={concluidas.length} icon={ClipboardCheck} accent="success" />
        <Stat label="Pendentes" value={pendentes.length} icon={AlertTriangle} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Vistorias recentes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/vistorias">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {inspections.length === 0 ? (
              <Empty
                title="Nenhuma vistoria ainda"
                hint="Cadastre um imóvel e crie sua primeira vistoria."
              />
            ) : (
              <div className="divide-y">
                {inspections.slice(0, 6).map((i) => {
                  const prop = properties.find((p) => p.id === i.propertyId);
                  return (
                    <Link
                      key={i.id}
                      to="/app/vistorias/$id"
                      params={{ id: i.id }}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {prop ? formatAddress(prop) : "Imóvel removido"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(i.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·{" "}
                          {i.inspectorName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={i.type === "entrada" ? "secondary" : "outline"}>
                          {i.type}
                        </Badge>
                        <StatusBadge status={i.status} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-muted">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Tempo médio</div>
                <div className="text-xs text-muted-foreground">
                  {tempoMedio > 0 ? `${tempoMedio} min por vistoria` : "Sem dados ainda"}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Ranking de vistoriadores</div>
              {ranking.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem vistorias concluídas.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {ranking.map(([name, n], idx) => (
                    <li key={name} className="flex items-center justify-between">
                      <span className="truncate">
                        {idx + 1}. {name}
                      </span>
                      <Badge variant="secondary">{n}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imóveis com mais problemas</CardTitle>
        </CardHeader>
        <CardContent>
          {topProblemas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item marcado como danificado até o momento.
            </p>
          ) : (
            <div className="divide-y">
              {topProblemas.map(({ property, count }) => (
                <Link
                  key={property!.id}
                  to="/app/imoveis/$id"
                  params={{ id: property!.id }}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{formatAddress(property!)}</div>
                    <div className="text-xs text-muted-foreground">{property!.code}</div>
                  </div>
                  <Badge variant="destructive">{count} itens</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: any;
  accent?: "success" | "warning";
}) {
  const tone =
    accent === "success"
      ? "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]"
      : accent === "warning"
        ? "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning-foreground)]"
        : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid size-10 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    rascunho: { label: "Rascunho", cls: "bg-muted text-foreground" },
    em_andamento: { label: "Em andamento", cls: "bg-amber-100 text-amber-900" },
    concluida: { label: "Concluída", cls: "bg-emerald-100 text-emerald-900" },
  };
  const v = map[status] ?? map.rascunho;
  return <span className={`rounded-full px-2 py-0.5 text-xs ${v.cls}`}>{v.label}</span>;
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed py-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
