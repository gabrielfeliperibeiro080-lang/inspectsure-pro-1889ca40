import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, useData } from "@/lib/store";
import { DEFAULT_ROOMS, type InspectionType, type Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getGeolocation, getClientIp } from "@/lib/hash";
import { formatAddress } from "@/lib/utils";

export const Route = createFileRoute("/app/vistorias/nova")({
  validateSearch: (s: Record<string, unknown>) => ({
    propertyId: typeof s.propertyId === "string" ? s.propertyId : undefined,
  }),
  component: NovaVistoria,
});

function NovaVistoria() {
  const { propertyId } = Route.useSearch();
  const navigate = useNavigate();
  const { properties, addInspection } = useData();
  const { user } = useAuth();

  const [selected, setSelected] = useState<string | undefined>(propertyId);
  const [type, setType] = useState<InspectionType>("entrada");
  const [tenant, setTenant] = useState("");
  const [inspector, setInspector] = useState(user?.name ?? "");
  const [chosenRooms, setChosenRooms] = useState<string[]>(
    DEFAULT_ROOMS.map((r) => r.name),
  );
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    getGeolocation()
      .then((p) => setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }))
      .catch((e) => setGeoError(e.message));
  }, []);

  const start = async () => {
    if (!selected) return toast.error("Selecione um imóvel");
    if (!inspector) return toast.error("Informe o responsável pela vistoria");
    if (!geo) return toast.error("Aguardando geolocalização — verifique permissão");

    const rooms: Room[] = DEFAULT_ROOMS.filter((r) => chosenRooms.includes(r.name)).map(
      (r) => ({
        id: crypto.randomUUID(),
        name: r.name,
        items: r.items.map((it) => ({
          id: crypto.randomUUID(),
          name: it,
          status: null,
          photos: [],
          note: "",
        })),
      }),
    );

    const ip = await getClientIp();
    try {
      const inspection = await addInspection({
        propertyId: selected,
        type,
        inspectorName: inspector,
        tenantName: tenant || undefined,
        rooms,
        signatures: [],
        geo: { ...geo },
        ip,
      });
      toast.success("Vistoria iniciada");
      navigate({ to: "/app/vistorias/$id", params: { id: inspection.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar vistoria");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/vistorias" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova vistoria</h1>
        <p className="text-sm text-muted-foreground">
          Configure os dados iniciais e o checklist será aplicado automaticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da vistoria</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Imóvel</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um imóvel" />
              </SelectTrigger>
              <SelectContent>
                {properties.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Cadastre um imóvel primeiro
                  </div>
                )}
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {formatAddress(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as InspectionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável pela vistoria</Label>
            <Input value={inspector} onChange={(e) => setInspector(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Inquilino (opcional)</Label>
            <Input value={tenant} onChange={(e) => setTenant(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ambientes do checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEFAULT_ROOMS.map((r) => {
              const checked = chosenRooms.includes(r.name);
              return (
                <label
                  key={r.name}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm ${
                    checked ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      setChosenRooms((prev) =>
                        v ? [...prev, r.name] : prev.filter((x) => x !== r.name),
                      )
                    }
                  />
                  {r.name}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <MapPin className="size-4 mt-0.5 text-primary" />
          <div className="flex-1">
            <div className="font-medium">Geolocalização</div>
            {geo ? (
              <div className="text-xs text-muted-foreground">
                {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} — registrada
              </div>
            ) : geoError ? (
              <div className="text-xs text-destructive">
                {geoError} · habilite o GPS para iniciar
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Obtendo localização…</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 md:bottom-0 flex justify-end">
        <Button size="lg" onClick={start} disabled={!geo || !selected}>
          Iniciar vistoria
        </Button>
      </div>
    </div>
  );
}
