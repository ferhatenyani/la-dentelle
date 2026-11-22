import type { CategoryId, LabelId } from "@/lib/types";

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "sandwiches", name: "Sandwiches & Matlouh", short: "Matlouh", icon: "lunch_dining" },
  { id: "entrees", name: "Entrées & Boureks", short: "Entrées", icon: "set_meal" },
  { id: "plats", name: "Plats de Terroir", short: "Terroir", icon: "soup_kitchen" },
  { id: "douceurs", name: "Douceurs & Pâtisseries", short: "Pâtisserie", icon: "bakery_dining" },
  { id: "boissons", name: "Cherbet & Boissons", short: "Boissons", icon: "local_cafe" },
];

export const LABELS: { id: LabelId; name: string; dot?: string; icon?: string }[] = [
  { id: "terroir", name: "Terroir Algérien", dot: "bg-secondary" },
  { id: "halal", name: "100% Halal Certifié", dot: "bg-primary" },
  { id: "vegetarien", name: "Végétarien", dot: "bg-surface-tint" },
  { id: "sans-gluten", name: "Sans Gluten", dot: "bg-secondary-fixed-dim" },
  { id: "epice-doux", name: "Épicé Doux", dot: "bg-tertiary-container" },
  { id: "signature", name: "Recette Signature", icon: "star" },
];

export type SortId = "popularite" | "prix-asc" | "prix-desc" | "temps";

export const SORTS: { id: SortId; name: string }[] = [
  { id: "popularite", name: "Populaire" },
  { id: "prix-asc", name: "Prix croissant" },
  { id: "prix-desc", name: "Prix décroissant" },
  { id: "temps", name: "Temps de préparation" },
];

export const COMMUNES = [
  { id: "hydra", name: "Hydra / Sidi Yahia", eta: "30–35 min" },
  { id: "el-biar", name: "El Biar / Telemly", eta: "35–40 min" },
  { id: "alger-centre", name: "Alger Centre / Didouche", eta: "40–45 min" },
  { id: "ben-aknoun", name: "Ben Aknoun / Val d'Hydra", eta: "35–40 min" },
  { id: "dely-ibrahim", name: "Dely Ibrahim / Chéraga", eta: "45 min" },
] as const;

/** Free delivery threshold (home ribbon: "Livraison offerte dès 3 000 DA"). */
export const FREE_DELIVERY_THRESHOLD = 3000;
export const DELIVERY_FEE = 600;

export const RESTAURANT = {
  name: "La Dentelle",
  phone: "+213 (0) 23 54 88 90",
  concierge: "+213 (0) 21 48 49 50",
  whatsapp: "+213 (0) 550 12 34 56",
  address: "14, Chemin Abdelkader Gadouche, Hydra, Alger",
};
