import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatAddress } from "@/lib/utils";
import type { PropertyType } from "@/lib/types";

export const Route = createFileRoute("/app/imoveis/")({
  component: ImoveisList,
});

const empty = {
  type: "casa" as PropertyType,
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
};

function ImoveisList() {
  const { properties, addProperty } = useData();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(empty);

  const filtered = properties.filter((p) => {
    if (!q) return true;
    const text = `${p.code} ${formatAddress(p)} ${p.ownerName}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const save = async () => {
    if (!form.street || !form.number || !form.city || !form.ownerName) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    try {
      const p = await addProperty(form);
      toast.success(`Imóvel ${p.code} cadastrado`);
      setForm(empty);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao cadastrar");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Imóveis</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e gerencie os imóveis sob sua responsabilidade.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-1" /> Novo imóvel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar imóvel</DialogTitle>
              <DialogDescription>Informações usadas em todas as vistorias.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as PropertyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field
                label="Rua *"
                value={form.street}
                onChange={(v) => setForm({ ...form, street: v })}
                wide
              />
              <Field
                label="Número *"
                value={form.number}
                onChange={(v) => setForm({ ...form, number: v })}
              />
              <Field
                label="Complemento"
                value={form.complement}
                onChange={(v) => setForm({ ...form, complement: v })}
              />
              <Field
                label="Bairro"
                value={form.neighborhood}
                onChange={(v) => setForm({ ...form, neighborhood: v })}
              />
              <Field
                label="Cidade *"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <Field
                label="UF"
                value={form.state}
                onChange={(v) => setForm({ ...form, state: v.toUpperCase().slice(0, 2) })}
              />
              <Field
                label="CEP"
                value={form.zip}
                onChange={(v) => setForm({ ...form, zip: v })}
              />
              <Field
                label="Proprietário *"
                value={form.ownerName}
                onChange={(v) => setForm({ ...form, ownerName: v })}
                wide
              />
              <Field
                label="E-mail do proprietário"
                value={form.ownerEmail}
                onChange={(v) => setForm({ ...form, ownerEmail: v })}
              />
              <Field
                label="Telefone"
                value={form.ownerPhone}
                onChange={(v) => setForm({ ...form, ownerPhone: v })}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={save} className="w-full sm:w-auto">Salvar</Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, endereço ou proprietário"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Building2 className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-medium">Nenhum imóvel cadastrado</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Adicione seu primeiro imóvel para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to="/app/imoveis/$id" params={{ id: p.id }}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{p.code}</div>
                      <div className="mt-1 font-medium leading-tight">{p.street}, {p.number}</div>
                    </div>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] capitalize text-accent-foreground">
                      {p.type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 mt-0.5" />
                    <span className="line-clamp-2">
                      {p.neighborhood}, {p.city}/{p.state}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Proprietário: <span className="text-foreground">{p.ownerName}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
