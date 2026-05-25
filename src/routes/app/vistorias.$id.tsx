import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Download,
  Share2,
  GitCompareArrows,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { SignaturePad } from "@/components/SignaturePad";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ItemStatus, Signature } from "@/lib/types";
import { sha256, getClientIp, getGeolocation } from "@/lib/hash";
import { generateInspectionPdf } from "@/lib/pdf";
import { formatAddress } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/vistorias/$id")({
  component: VistoriaDetail,
});

const STATUS: { value: ItemStatus; label: string; tone: string; icon: any }[] = [
  { value: "ok", label: "OK", tone: "bg-emerald-100 text-emerald-900 border-emerald-200", icon: CheckCircle2 },
  { value: "danificado", label: "Dano", tone: "bg-red-100 text-red-900 border-red-200", icon: AlertTriangle },
  { value: "observacao", label: "Obs.", tone: "bg-amber-100 text-amber-900 border-amber-200", icon: MessageSquare },
];

function VistoriaDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { inspections, properties, updateInspection, deleteInspection } = useData();
  const inspection = inspections.find((i) => i.id === id);
  const property = properties.find((p) => p.id === inspection?.propertyId);

  const [openRoom, setOpenRoom] = useState<string | null>(
    inspection?.rooms[0]?.id ?? null,
  );
  const [showSign, setShowSign] = useState(false);

  const counterpart = useMemo(() => {
    if (!inspection || !property) return null;
    const other = inspections.find(
      (i) =>
        i.propertyId === inspection.propertyId &&
        i.type !== inspection.type &&
        i.id !== inspection.id,
    );
    return other ?? null;
  }, [inspections, inspection, property]);

  if (!inspection || !property) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate({ to: "/app/vistorias" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
        <p className="text-sm text-muted-foreground">Vistoria não encontrada.</p>
      </div>
    );
  }

  const setItem = (roomId: string, itemId: string, patch: any) => {
    const rooms = inspection.rooms.map((r) =>
      r.id !== roomId
        ? r
        : { ...r, items: r.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) },
    );
    updateInspection(inspection.id, { rooms });
  };

  const progress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const r of inspection.rooms) for (const it of r.items) {
      total++;
      if (it.status) done++;
    }
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [inspection]);

  const finalize = async () => {
    if (progress.done < progress.total) {
      if (!confirm(`${progress.total - progress.done} itens sem status. Concluir mesmo assim?`)) return;
    }
    const payload = JSON.stringify({
      id: inspection.id,
      rooms: inspection.rooms,
      signatures: inspection.signatures,
    });
    const hash = await sha256(payload);
    updateInspection(inspection.id, {
      status: "concluida",
      finishedAt: new Date().toISOString(),
      hash,
    });
    toast.success("Vistoria concluída com hash de integridade");
  };

  const downloadPdf = async () => {
    const doc = await generateInspectionPdf(inspection, property);
    doc.save(`vistoria-${property.code}-${inspection.type}.pdf`);
  };

  const sendWhatsapp = async () => {
    const msg = `Olá! Segue o relatório da vistoria de ${inspection.type} do imóvel ${property.code} — ${formatAddress(property)}.\nHash: ${inspection.hash ?? "(gerar ao finalizar)"}`;
    const phone = (property.ownerPhone ?? "").replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const damageCount = inspection.rooms.reduce(
    (acc, r) => acc + r.items.filter((it) => it.status === "danificado").length,
    0,
  );

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/vistorias" })}>
          <ArrowLeft className="size-4 mr-1" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Excluir esta vistoria?")) {
                deleteInspection(inspection.id);
                navigate({ to: "/app/vistorias" });
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="size-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={sendWhatsapp}>
            <Share2 className="size-4 mr-1" /> WhatsApp
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg capitalize">
                Vistoria de {inspection.type}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatAddress(property)} · {property.code}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Iniciada em{" "}
                {format(new Date(inspection.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·{" "}
                {inspection.inspectorName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={inspection.status === "concluida" ? "default" : "secondary"} className="capitalize">
                {inspection.status.replace("_", " ")}
              </Badge>
              {damageCount > 0 && <Badge variant="destructive">{damageCount} danos</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              {progress.done}/{progress.total} ({progress.pct}%)
            </div>
          </div>
        </CardContent>
      </Card>

      {counterpart && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-accent">
                <GitCompareArrows className="size-4 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Comparação automática disponível</div>
                <div className="text-xs text-muted-foreground">
                  Existe uma vistoria de {counterpart.type} para este imóvel.
                </div>
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/app/comparar/$a/$b" params={{ a: counterpart.id, b: inspection.id }}>
                Comparar agora
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rooms */}
      <div className="space-y-3">
        {inspection.rooms.map((room) => {
          const opened = openRoom === room.id;
          const done = room.items.filter((it) => it.status).length;
          return (
            <Card key={room.id}>
              <button
                className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setOpenRoom(opened ? null : room.id)}
              >
                <div>
                  <div className="text-sm font-semibold">{room.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {done}/{room.items.length} itens preenchidos
                  </div>
                </div>
                <Badge variant={done === room.items.length ? "default" : "secondary"}>
                  {done === room.items.length ? "Completo" : "Pendente"}
                </Badge>
              </button>
              {opened && (
                <div className="space-y-3 px-4 pb-4">
                  {room.items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex gap-1">
                          {STATUS.map((s) => {
                            const active = item.status === s.value;
                            const Icon = s.icon;
                            return (
                              <button
                                key={s.value}
                                onClick={() => setItem(room.id, item.id, { status: s.value })}
                                className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  active ? s.tone : "border-input text-muted-foreground"
                                }`}
                              >
                                <Icon className="size-3.5" />
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Observações (opcional)"
                          value={item.note ?? ""}
                          onChange={(e) =>
                            setItem(room.id, item.id, { note: e.target.value })
                          }
                          rows={2}
                        />
                        <PhotoUploader
                          photos={item.photos}
                          onChange={(photos) => setItem(room.id, item.id, { photos })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inspection.generalNotes ?? ""}
            onChange={(e) => updateInspection(inspection.id, { generalNotes: e.target.value })}
            rows={3}
            placeholder="Anote condições gerais, contadores, chaves entregues, etc."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Assinaturas</CardTitle>
          <Button size="sm" onClick={() => setShowSign(true)}>
            Adicionar assinatura
          </Button>
        </CardHeader>
        <CardContent>
          {inspection.signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {inspection.signatures.map((s, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <img src={s.dataUrl} alt="" className="h-20 w-full object-contain" />
                  <div className="mt-2 text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{s.role}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    IP {s.ip ?? "—"} · Geo{" "}
                    {s.geo ? `${s.geo.lat.toFixed(3)}, ${s.geo.lng.toFixed(3)}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inspection.hash && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <ShieldCheck className="size-4 mt-0.5 text-emerald-600" />
            <div>
              <div className="font-medium">Documento com integridade verificável</div>
              <div className="break-all font-mono text-[11px] text-muted-foreground">
                SHA-256: {inspection.hash}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-20 md:bottom-4 z-10 flex justify-end gap-2">
        <Button size="lg" onClick={finalize} disabled={inspection.status === "concluida"}>
          {inspection.status === "concluida" ? "Vistoria concluída" : "Concluir vistoria"}
        </Button>
      </div>

      {showSign && (
        <SignDialog
          onClose={() => setShowSign(false)}
          onSave={(s) =>
            updateInspection(inspection.id, {
              signatures: [...inspection.signatures, s],
            })
          }
        />
      )}
    </div>
  );
}

function SignDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: Signature) => void;
}) {
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [role, setRole] = useState<"vistoriador" | "cliente">("cliente");
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name || !data) return toast.error("Informe o nome e assine");
    setLoading(true);
    try {
      const ip = await getClientIp();
      let geo: any = undefined;
      try {
        const p = await getGeolocation();
        geo = { lat: p.coords.latitude, lng: p.coords.longitude };
      } catch { /* opcional */ }
      onSave({
        name,
        document: doc || undefined,
        role,
        dataUrl: data,
        signedAt: new Date().toISOString(),
        ip,
        geo,
      });
      toast.success("Assinatura registrada");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Assinatura digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                {(["cliente", "vistoriador"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                      role === r ? "border-primary bg-primary/5 text-primary" : ""
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Documento (opcional)</Label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="CPF/RG" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <SignaturePad onChange={setData} />
        </CardContent>
        <div className="flex justify-end gap-2 p-4 pt-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={loading}>
            {loading ? "Salvando…" : "Registrar assinatura"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
