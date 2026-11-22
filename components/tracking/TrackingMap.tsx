"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ATELIER, projectToMap, type TrackingSnapshot } from "@/lib/tracking";
import { Icon } from "@/components/ui/Icon";

function Marker({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
      {children}
    </div>
  );
}

/**
 * Static-tile map with an SVG route overlay.
 * The tile (512×512 of Algiers) is scaled to cover the container and centred on the route;
 * markers are positioned from lat/lng via `projectToMap`, so swapping in live GPS only means
 * feeding new `TrackingSnapshot`s (or replacing this component with a Mapbox/Leaflet map).
 */
export function TrackingMap({
  snap,
  destinationLabel,
  courierLabel,
  className,
  children,
}: {
  snap: TrackingSnapshot;
  destinationLabel: string;
  courierLabel: string;
  className?: string;
  children?: ReactNode;
}) {
  const [zoom, setZoom] = useState(1.15);
  const pts = snap.route.map(projectToMap);
  const courier = projectToMap(snap.courier);
  const atelier = projectToMap(ATELIER);
  const dest = pts[pts.length - 1];
  const cx = (atelier.x + dest.x) / 2;
  const cy = (atelier.y + dest.y) / 2;
  const toPct = (v: number) => v * 100;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${toPct(p.x)} ${toPct(p.y)}`).join(" ");

  // Split the route at the courier: travelled (solid) / remaining (dashed)
  const travelled = `M${toPct(atelier.x)} ${toPct(atelier.y)} ${pts
    .slice(1)
    .filter((p) => (p.x - atelier.x) ** 2 + (p.y - atelier.y) ** 2 < (courier.x - atelier.x) ** 2 + (courier.y - atelier.y) ** 2)
    .map((p) => `L${toPct(p.x)} ${toPct(p.y)}`)
    .join(" ")} L${toPct(courier.x)} ${toPct(courier.y)}`;

  return (
    <div className={cn("relative overflow-hidden bg-surface-container-high", className)} style={{ containerType: "size" }} data-testid="tracking-map">
      <div
        className="absolute aspect-square transition-[width] duration-500"
        style={{
          width: `calc(max(100cqw, 100cqh) * ${zoom})`,
          left: `calc(50cqw - max(100cqw, 100cqh) * ${zoom} * ${cx})`,
          top: `calc(50cqh - max(100cqw, 100cqh) * ${zoom} * ${cy})`,
        }}
      >
        <Image src="/images/map-alger.png" alt="Carte d'Alger" fill sizes="900px" className="object-cover opacity-90 saturate-[0.85]" loading="eager" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          <path d={path} fill="none" stroke="#ecc15a" strokeWidth={0.9} strokeDasharray="1.6 1.2" strokeLinecap="round" strokeLinejoin="round" />
          <motion.path d={travelled} fill="none" stroke="#135d54" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
        </svg>

        <Marker x={atelier.x} y={atelier.y}>
          <div className="flex flex-col items-center gap-1">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-on-primary shadow-md ring-2 ring-white">
              <Icon name="restaurant" size={18} />
            </span>
            <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary shadow">{ATELIER.label}</span>
          </div>
        </Marker>
        <Marker x={dest.x} y={dest.y}>
          <div className="flex flex-col items-center gap-1">
            <span className="grid size-9 place-items-center rounded-full border-2 border-secondary bg-white text-secondary shadow-md">
              <Icon name="home_pin" size={18} />
            </span>
            <span className="max-w-40 truncate whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-on-surface shadow">{destinationLabel}</span>
          </div>
        </Marker>
        {snap.status === "en_route" && (
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            initial={false}
            animate={{ left: `${courier.x * 100}%`, top: `${courier.y * 100}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 14 }}
            data-testid="courier-marker"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="relative grid size-12 place-items-center rounded-full bg-secondary-container text-on-secondary-fixed shadow-lg ring-4 ring-white">
                <span className="absolute inset-0 animate-ping rounded-full bg-secondary-container/50" />
                <Icon name="electric_moped" size={22} className="relative" />
              </span>
              <span className="whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-on-surface shadow">● {courierLabel}</span>
            </div>
          </motion.div>
        )}
      </div>
      {children}
      <button
        type="button"
        aria-label={zoom > 1.4 ? "Vue d'ensemble" : "Zoomer sur le trajet"}
        onClick={() => setZoom((z) => (z > 1.4 ? 1.15 : 1.7))}
        className="absolute bottom-4 right-4 z-10 grid size-11 place-items-center rounded-full bg-surface-container-lowest text-primary shadow-md hover:bg-surface-container-low"
      >
        <Icon name="my_location" size={22} />
      </button>
    </div>
  );
}
