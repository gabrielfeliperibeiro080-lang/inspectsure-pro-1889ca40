import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Inspection, Property, User, UserRole } from "./types";

interface AuthState {
  user: User | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string, role?: UserRole) => Promise<User>;
  signOut: () => void;
}

interface PasswordRecord {
  email: string;
  passwordHash: string;
  user: User;
}

// tiny non-cryptographic hash — placeholder until Supabase Auth is wired
const fakeHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return String(h);
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      signIn: async (email, password) => {
        const records: PasswordRecord[] = JSON.parse(
          localStorage.getItem("cortex_users") ?? "[]",
        );
        let rec = records.find((r) => r.email === email);
        // seed a demo admin on first run
        if (!rec && records.length === 0 && email === "admin@cortex.com") {
          const user: User = {
            id: crypto.randomUUID(),
            name: "Administrador",
            email,
            role: "admin",
            createdAt: new Date().toISOString(),
          };
          rec = { email, passwordHash: fakeHash(password), user };
          localStorage.setItem("cortex_users", JSON.stringify([rec]));
        }
        if (!rec) throw new Error("Usuário não encontrado");
        if (rec.passwordHash !== fakeHash(password)) throw new Error("Senha incorreta");
        set({ user: rec.user });
        return rec.user;
      },
      signUp: async (name, email, password, role = "admin") => {
        const records: PasswordRecord[] = JSON.parse(
          localStorage.getItem("cortex_users") ?? "[]",
        );
        if (records.some((r) => r.email === email)) {
          throw new Error("E-mail já cadastrado");
        }
        const user: User = {
          id: crypto.randomUUID(),
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        };
        records.push({ email, passwordHash: fakeHash(password), user });
        localStorage.setItem("cortex_users", JSON.stringify(records));
        set({ user });
        return user;
      },
      signOut: () => set({ user: null }),
    }),
    { name: "cortex_auth" },
  ),
);

interface DataState {
  properties: Property[];
  inspections: Inspection[];
  addProperty: (p: Omit<Property, "id" | "createdAt" | "code">) => Property;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addInspection: (i: Omit<Inspection, "id" | "createdAt" | "status">) => Inspection;
  updateInspection: (id: string, patch: Partial<Inspection>) => void;
  deleteInspection: (id: string) => void;
  reset: () => void;
}

let codeCounter = 0;

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      properties: [],
      inspections: [],
      addProperty: (p) => {
        const code = `IMV-${String(get().properties.length + 1 + codeCounter).padStart(4, "0")}`;
        const property: Property = {
          ...p,
          id: crypto.randomUUID(),
          code,
          createdAt: new Date().toISOString(),
        };
        set({ properties: [property, ...get().properties] });
        return property;
      },
      updateProperty: (id, patch) =>
        set({
          properties: get().properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
      deleteProperty: (id) =>
        set({
          properties: get().properties.filter((p) => p.id !== id),
          inspections: get().inspections.filter((i) => i.propertyId !== id),
        }),
      addInspection: (i) => {
        const inspection: Inspection = {
          ...i,
          id: crypto.randomUUID(),
          status: "em_andamento",
          createdAt: new Date().toISOString(),
        };
        set({ inspections: [inspection, ...get().inspections] });
        return inspection;
      },
      updateInspection: (id, patch) =>
        set({
          inspections: get().inspections.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }),
      deleteInspection: (id) =>
        set({ inspections: get().inspections.filter((i) => i.id !== id) }),
      reset: () => set({ properties: [], inspections: [] }),
    }),
    { name: "cortex_data" },
  ),
);
