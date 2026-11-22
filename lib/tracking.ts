import { COMMUNES } from "@/lib/data/catalog";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Delivery tracking model.
 *
 * Today the snapshot is simulated from the order's age (or a fixed status for seeded orders).
 * To plug live GPS, replace `getTrackingSnapshot` with data from the courier API/WebSocket
 * (status + courier lat/lng) — the UI only consumes `TrackingSnapshot` and projects
 * coordinates with `projectToMap`.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export const STATUS_STEPS: { id: OrderStatus; label: string; short: string; icon: string }[] = [
  { id: "confirmee", label: "Commande Confirmée", short: "Reçue", icon: "check" },
  { id: "preparation", label: "Préparation Cuisine", short: "En cuisine", icon: "skillet" },
  { id: "en_route", label: "En Livraison", short: "En route", icon: "local_shipping" },
  { id: "livree", label: "Livrée", short: "Livrée", icon: "done_all" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmee: "Confirmée",
  preparation: "En cuisine",
  en_route: "En livraison",
  livree: "Livrée",
};

/** Simulated timeline for live orders, in minutes after creation */
const T_PREP = 2;
const T_ROUTE = 12;
const T_DELIVERED = 35;

/** Approximate bounds of /images/map-alger.png (static tile of Algiers). */
export const MAP_BOUNDS = { north: 36.817, south: 36.667, west: 2.937, east: 3.147 };

export const ATELIER: LatLng & { label: string } = { lat: 36.731, lng: 3.016, label: "La Dentelle Hydra" };

export const COMMUNE_COORDS: Record<string, LatLng> = {
  hydra: { lat: 36.757, lng: 3.071 },
  "el-biar": { lat: 36.767, lng: 3.033 },
  "alger-centre": { lat: 36.773, lng: 3.06 },
  "ben-aknoun": { lat: 36.756, lng: 3.012 },
  "dely-ibrahim": { lat: 36.756, lng: 2.98 },
};

export function projectToMap(p: LatLng) {
  return {
    x: (p.lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west),
    y: (MAP_BOUNDS.north - p.lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south),
  };
}

/** Route as a short polyline (atelier → bend → destination). */
export function getRoute(order: Order): LatLng[] {
  const dest = COMMUNE_COORDS[order.address.commune] ?? COMMUNE_COORDS.hydra;
  const bend = { lat: ATELIER.lat + (dest.lat - ATELIER.lat) * 0.25, lng: ATELIER.lng + (dest.lng - ATELIER.lng) * 0.7 };
  return [ATELIER, bend, dest];
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function pointAlong(route: LatLng[], t: number): LatLng {
  const segs = route.slice(1).map((p, i) => haversineKm(route[i], p));
  const total = segs.reduce((a, b) => a + b, 0);
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : Math.min(1, target / segs[i]);
      return { lat: route[i].lat + (route[i + 1].lat - route[i].lat) * f, lng: route[i].lng + (route[i + 1].lng - route[i].lng) * f };
    }
    target -= segs[i];
  }
  return route[route.length - 1];
}

export interface TrackingSnapshot {
  status: OrderStatus;
  stepIndex: number;
  /** 0..1 progress of the courier along the route */
  routeProgress: number;
  courier: LatLng;
  route: LatLng[];
  remainingKm: number;
  remainingMinutes: number;
  etaTs: number;
  /** timestamp each step was reached (null if not yet) */
  stepTimes: (number | null)[];
}

export function getTrackingSnapshot(order: Order, now: number): TrackingSnapshot {
  const route = getRoute(order);
  const totalKm = route.slice(1).reduce((n, p, i) => n + haversineKm(route[i], p), 0) * 1.35; // road factor
  const min = 60_000;

  let status: OrderStatus;
  let routeProgress: number;
  let remainingMinutes: number;
  let etaTs: number;

  if (order.statusOverride) {
    status = order.statusOverride;
    routeProgress = status === "livree" ? 1 : status === "en_route" ? 0.55 : 0;
    remainingMinutes = status === "livree" ? 0 : status === "en_route" ? 18 : 35;
    etaTs = order.createdAt + 56 * min;
  } else {
    const elapsed = (now - order.createdAt) / min;
    status = elapsed >= T_DELIVERED ? "livree" : elapsed >= T_ROUTE ? "en_route" : elapsed >= T_PREP ? "preparation" : "confirmee";
    routeProgress = status === "livree" ? 1 : status === "en_route" ? (elapsed - T_ROUTE) / (T_DELIVERED - T_ROUTE) : 0;
    etaTs = order.createdAt + T_DELIVERED * min;
    remainingMinutes = Math.max(0, Math.ceil(T_DELIVERED - elapsed));
  }

  const stepIndex = STATUS_STEPS.findIndex((s) => s.id === status);
  const offsets = order.statusOverride ? [0, 6, 22, 56] : [0, T_PREP, T_ROUTE, T_DELIVERED];
  const stepTimes = offsets.map((o, i) => (i <= stepIndex ? order.createdAt + o * min : null));

  return {
    status,
    stepIndex,
    routeProgress,
    courier: pointAlong(route, routeProgress),
    route,
    remainingKm: Math.round(totalKm * (1 - routeProgress) * 10) / 10,
    remainingMinutes,
    etaTs,
    stepTimes,
  };
}

/** Short destination area for route labels: "Hydra / Sidi Yahia" → "Sidi Yahia" */
export function communeArea(id: string) {
  return communeName(id).split(" / ").pop() ?? id;
}

export function communeName(id: string) {
  return COMMUNES.find((c) => c.id === id)?.name ?? id;
}
