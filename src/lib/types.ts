export type UserRole = "admin" | "vistoriador" | "cliente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type PropertyType = "casa" | "apartamento" | "comercial";

export interface Property {
  id: string;
  code: string;
  type: PropertyType;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  photoUrl?: string;
  createdAt: string;
}

export type InspectionType = "entrada" | "saida";
export type InspectionStatus = "rascunho" | "em_andamento" | "concluida";
export type ItemStatus = "ok" | "danificado" | "observacao";

export interface ChecklistItem {
  id: string;
  name: string;
  status: ItemStatus | null;
  note?: string;
  photos: string[]; // dataURLs
}

export interface Room {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Geo {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Signature {
  name: string;
  role: "vistoriador" | "cliente";
  document?: string;
  dataUrl: string;
  signedAt: string;
  ip?: string;
  geo?: Geo;
}

export interface Inspection {
  id: string;
  propertyId: string;
  type: InspectionType;
  status: InspectionStatus;
  inspectorName: string;
  tenantName?: string;
  generalNotes?: string;
  rooms: Room[];
  signatures: Signature[];
  createdAt: string;
  finishedAt?: string;
  geo?: Geo;
  ip?: string;
  hash?: string;
}

export const DEFAULT_ROOMS: { name: string; items: string[] }[] = [
  {
    name: "Sala",
    items: ["Paredes", "Piso", "Teto", "Portas", "Janelas", "Elétrica", "Hidráulica"],
  },
  {
    name: "Cozinha",
    items: ["Paredes", "Piso", "Teto", "Portas", "Janelas", "Elétrica", "Hidráulica", "Bancada", "Pia"],
  },
  {
    name: "Banheiro",
    items: ["Paredes", "Piso", "Teto", "Portas", "Janelas", "Elétrica", "Hidráulica", "Box", "Vaso", "Pia"],
  },
  {
    name: "Quarto",
    items: ["Paredes", "Piso", "Teto", "Portas", "Janelas", "Elétrica"],
  },
  {
    name: "Área externa",
    items: ["Paredes", "Piso", "Portões", "Elétrica", "Hidráulica"],
  },
];
