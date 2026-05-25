import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(p: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}) {
  return `${p.street}, ${p.number}${p.complement ? " " + p.complement : ""} — ${p.neighborhood}, ${p.city}/${p.state}`;
}
