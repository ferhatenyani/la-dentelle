import { CATEGORIES, LABELS, SORTS, type SortId } from "@/lib/data/catalog";
import { PRODUCTS } from "@/lib/data/products";
import type { CategoryId, LabelId, Product } from "@/lib/types";

export interface CatalogueQuery {
  q: string;
  category: CategoryId | "all";
  labels: LabelId[];
  sort: SortId;
}

export const DEFAULT_QUERY: CatalogueQuery = { q: "", category: "all", labels: [], sort: "popularite" };

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ");

export function parseQuery(params: URLSearchParams): CatalogueQuery {
  const category = params.get("categorie");
  const sort = params.get("tri");
  const labels = (params.get("labels") ?? "").split(",").filter((l): l is LabelId => LABELS.some((x) => x.id === l));
  return {
    q: params.get("q") ?? "",
    category: CATEGORIES.some((c) => c.id === category) ? (category as CategoryId) : "all",
    labels,
    sort: SORTS.some((s) => s.id === sort) ? (sort as SortId) : "popularite",
  };
}

export function serializeQuery(q: CatalogueQuery): string {
  const p = new URLSearchParams();
  if (q.q.trim()) p.set("q", q.q.trim());
  if (q.category !== "all") p.set("categorie", q.category);
  if (q.labels.length) p.set("labels", q.labels.join(","));
  if (q.sort !== "popularite") p.set("tri", q.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function isDefaultQuery(q: CatalogueQuery) {
  return !q.q.trim() && q.category === "all" && q.labels.length === 0 && q.sort === "popularite";
}

export function filterProducts(query: CatalogueQuery, products: Product[] = PRODUCTS): Product[] {
  const terms = normalize(query.q).split(/\s+/).filter(Boolean);
  const list = products.filter((p) => {
    if (query.category !== "all" && p.category !== query.category) return false;
    if (query.labels.some((l) => !p.labels.includes(l))) return false;
    if (terms.length) {
      const haystack = normalize([p.name, p.shortName, p.description, p.subtitle, p.origin, p.locality, ...p.ingredients].join(" "));
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
  const sorted = [...list];
  switch (query.sort) {
    case "prix-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "prix-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "temps":
      sorted.sort((a, b) => a.prepMinutes - b.prepMinutes);
      break;
    default:
      sorted.sort((a, b) => b.popularity - a.popularity || b.rating - a.rating);
  }
  return sorted;
}
