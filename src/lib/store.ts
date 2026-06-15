import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  Inspection,
  Property,
  User,
  UserRole,
  Room,
  Signature,
  InspectionStatus,
  InspectionType,
  PropertyType,
} from "./types";

// Debounced persistence for inspection patches (avoids sending megabytes of
// base64 photos on every keystroke / status click).
const pendingPatches = new Map<string, Partial<Inspection>>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const inflight = new Map<string, Promise<void>>();

async function flushInspectionPatch(id: string) {
  const patch = pendingPatches.get(id);
  if (!patch) return;
  pendingPatches.delete(id);
  const prev = inflight.get(id) ?? Promise.resolve();
  const run = prev.then(async () => {
    const { error } = await supabase
      .from("inspections")
      .update(inspectionToDb(patch))
      .eq("id", id);
    if (error) {
      console.error("[updateInspection] save failed", error);
      toast.error("Não foi possível salvar. Verifique a conexão.");
    }
  });
  inflight.set(id, run);
  await run;
}

function scheduleInspectionPatch(id: string, patch: Partial<Inspection>, immediate = false) {
  const merged = { ...(pendingPatches.get(id) ?? {}), ...patch };
  pendingPatches.set(id, merged);
  const existing = pendingTimers.get(id);
  if (existing) clearTimeout(existing);
  if (immediate) {
    pendingTimers.delete(id);
    void flushInspectionPatch(id);
    return;
  }
  const t = setTimeout(() => {
    pendingTimers.delete(id);
    void flushInspectionPatch(id);
  }, 800);
  pendingTimers.set(id, t);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    for (const id of pendingTimers.keys()) {
      const t = pendingTimers.get(id);
      if (t) clearTimeout(t);
      void flushInspectionPatch(id);
    }
  });
}



// ============================================================================
// AUTH STORE — backed by Supabase Auth
// ============================================================================

interface AuthState {
  user: User | null;
  initialized: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string, role?: UserRole) => Promise<User>;
  signOut: () => Promise<void>;
}

async function hydrateUserFromAuth(authUserId: string, fallbackEmail: string): Promise<User> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at, subscription_status, subscription_id")
    .eq("id", authUserId)
    .maybeSingle();

  if (profile) {
    return {
      id: profile.id,
      name: profile.name ?? fallbackEmail,
      email: profile.email ?? fallbackEmail,
      role: (profile.role as UserRole) ?? "admin",
      subscriptionStatus: profile.subscription_status ?? "trial",
      subscriptionId: profile.subscription_id ?? undefined,
      createdAt: profile.created_at,
    };
  }
  // fallback when trigger didn't run
  return {
    id: authUserId,
    name: fallbackEmail,
    email: fallbackEmail,
    role: "admin",
    subscriptionStatus: "trial",
    createdAt: new Date().toISOString(),
  };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  init: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const u = await hydrateUserFromAuth(
        data.session.user.id,
        data.session.user.email ?? "",
      );
      set({ user: u, initialized: true });
    } else {
      set({ user: null, initialized: true });
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = await hydrateUserFromAuth(session.user.id, session.user.email ?? "");
        set({ user: u });
      } else {
        set({ user: null });
        useData.getState().reset();
      }
    });
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Falha ao autenticar");
    const u = await hydrateUserFromAuth(data.user.id, data.user.email ?? email);
    set({ user: u });
    return u;
  },
  signUp: async (name, email, password, role = "admin") => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { name, role },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Falha ao criar conta");

    // Upsert profile (in case trigger isn't installed yet)
    await supabase.from("profiles").upsert(
      { id: data.user.id, name, email, role },
      { onConflict: "id" },
    );

    const u: User = {
      id: data.user.id,
      name,
      email,
      role,
      subscriptionStatus: "trial",
      createdAt: new Date().toISOString(),
    };
    set({ user: u });
    return u;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    useData.getState().reset();
  },
}));

// ============================================================================
// DATA STORE — properties + inspections via Supabase
// ============================================================================

interface DataState {
  properties: Property[];
  inspections: Inspection[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  addProperty: (p: Omit<Property, "id" | "createdAt" | "code">) => Promise<Property>;
  updateProperty: (id: string, patch: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addInspection: (
    i: Omit<Inspection, "id" | "createdAt" | "status">,
  ) => Promise<Inspection>;
  updateInspection: (id: string, patch: Partial<Inspection>) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  reset: () => void;
}

// ---- mappers (DB snake_case <-> app camelCase) ----

interface DbProperty {
  id: string;
  code: string;
  type: PropertyType;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
  photo_url: string | null;
  created_at: string;
}

function mapProperty(p: DbProperty): Property {
  return {
    id: p.id,
    code: p.code,
    type: p.type,
    street: p.street,
    number: p.number,
    complement: p.complement ?? undefined,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    zip: p.zip,
    ownerName: p.owner_name,
    ownerEmail: p.owner_email ?? undefined,
    ownerPhone: p.owner_phone ?? undefined,
    photoUrl: p.photo_url ?? undefined,
    createdAt: p.created_at,
  };
}

function propertyToDb(p: Partial<Property>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.code !== undefined) out.code = p.code;
  if (p.type !== undefined) out.type = p.type;
  if (p.street !== undefined) out.street = p.street;
  if (p.number !== undefined) out.number = p.number;
  if (p.complement !== undefined) out.complement = p.complement ?? null;
  if (p.neighborhood !== undefined) out.neighborhood = p.neighborhood;
  if (p.city !== undefined) out.city = p.city;
  if (p.state !== undefined) out.state = p.state;
  if (p.zip !== undefined) out.zip = p.zip;
  if (p.ownerName !== undefined) out.owner_name = p.ownerName;
  if (p.ownerEmail !== undefined) out.owner_email = p.ownerEmail ?? null;
  if (p.ownerPhone !== undefined) out.owner_phone = p.ownerPhone ?? null;
  if (p.photoUrl !== undefined) out.photo_url = p.photoUrl ?? null;
  return out;
}

interface DbInspection {
  id: string;
  property_id: string;
  type: InspectionType;
  status: InspectionStatus;
  inspector_name: string;
  tenant_name: string | null;
  general_notes: string | null;
  rooms: Room[] | null;
  signatures: Signature[] | null;
  geo: Inspection["geo"] | null;
  ip: string | null;
  hash: string | null;
  created_at: string;
  finished_at: string | null;
}

function mapInspection(i: DbInspection): Inspection {
  return {
    id: i.id,
    propertyId: i.property_id,
    type: i.type,
    status: i.status,
    inspectorName: i.inspector_name,
    tenantName: i.tenant_name ?? undefined,
    generalNotes: i.general_notes ?? undefined,
    rooms: i.rooms ?? [],
    signatures: i.signatures ?? [],
    geo: i.geo ?? undefined,
    ip: i.ip ?? undefined,
    hash: i.hash ?? undefined,
    createdAt: i.created_at,
    finishedAt: i.finished_at ?? undefined,
  };
}

function inspectionToDb(i: Partial<Inspection>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (i.propertyId !== undefined) out.property_id = i.propertyId;
  if (i.type !== undefined) out.type = i.type;
  if (i.status !== undefined) out.status = i.status;
  if (i.inspectorName !== undefined) out.inspector_name = i.inspectorName;
  if (i.tenantName !== undefined) out.tenant_name = i.tenantName ?? null;
  if (i.generalNotes !== undefined) out.general_notes = i.generalNotes ?? null;
  if (i.rooms !== undefined) out.rooms = i.rooms;
  if (i.signatures !== undefined) out.signatures = i.signatures;
  if (i.geo !== undefined) out.geo = i.geo ?? null;
  if (i.ip !== undefined) out.ip = i.ip ?? null;
  if (i.hash !== undefined) out.hash = i.hash ?? null;
  if (i.finishedAt !== undefined) out.finished_at = i.finishedAt ?? null;
  return out;
}

export const useData = create<DataState>((set, get) => ({
  properties: [],
  inspections: [],
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    const [{ data: props }, { data: insps }] = await Promise.all([
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("inspections").select("*").order("created_at", { ascending: false }),
    ]);
    set({
      properties: (props ?? []).map((p) => mapProperty(p as DbProperty)),
      inspections: (insps ?? []).map((i) => mapInspection(i as DbInspection)),
      loaded: true,
      loading: false,
    });
  },
  addProperty: async (p) => {
    const code = `IMV-${String(get().properties.length + 1).padStart(4, "0")}`;
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) throw new Error("Não autenticado");
    const payload = { ...propertyToDb(p), code, user_id: userId };
    const { data, error } = await supabase
      .from("properties")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const property = mapProperty(data as DbProperty);
    set({ properties: [property, ...get().properties] });
    return property;
  },
  updateProperty: async (id, patch) => {
    const { error } = await supabase
      .from("properties")
      .update(propertyToDb(patch))
      .eq("id", id);
    if (error) throw new Error(error.message);
    set({
      properties: get().properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  },
  deleteProperty: async (id) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set({
      properties: get().properties.filter((p) => p.id !== id),
      inspections: get().inspections.filter((i) => i.propertyId !== id),
    });
  },
  addInspection: async (i) => {
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) throw new Error("Não autenticado");
    const payload = {
      ...inspectionToDb(i),
      status: "em_andamento" as InspectionStatus,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from("inspections")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const inspection = mapInspection(data as DbInspection);
    set({ inspections: [inspection, ...get().inspections] });
    return inspection;
  },
  updateInspection: async (id, patch) => {
    const { error } = await supabase
      .from("inspections")
      .update(inspectionToDb(patch))
      .eq("id", id);
    if (error) throw new Error(error.message);
    set({
      inspections: get().inspections.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  },
  deleteInspection: async (id) => {
    const { error } = await supabase.from("inspections").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set({ inspections: get().inspections.filter((i) => i.id !== id) });
  },
  reset: () => set({ properties: [], inspections: [], loaded: false }),
}));
