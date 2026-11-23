"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { FavoriteButton } from "./ProductActions";
import { ProductImage } from "./ProductImage";

/** Crossfading gallery with thumbnails (desktop) and swipe + dots (mobile). */
export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const count = Math.max(1, product.images.length);
  const go = (i: number) => {
    const next = (i + count) % count;
    setDir(next > index || (index === count - 1 && next === 0) ? 1 : -1);
    setIndex(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container md:rounded-3xl md:shadow-card">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            className="absolute inset-0 touch-pan-y"
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) go(index + 1);
              else if (info.offset.x > 50) go(index - 1);
            }}
          >
            {product.images[index] ? (
              <Image
                src={product.images[index]}
                alt={`${product.name} — photo ${index + 1}`}
                fill
                loading="eager"
                sizes="(min-width:1024px) 640px, 100vw"
                className="pointer-events-none object-cover"
                draggable={false}
              />
            ) : (
              <ProductImage product={product} sizes="640px" />
            )}
          </motion.div>
        </AnimatePresence>

        {product.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-primary-container px-3 py-1 text-label-md text-on-primary shadow-sm">{product.badge}</span>
        )}
        <FavoriteButton product={product} size={40} className="absolute right-4 top-4" />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Photo précédente"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 md:grid"
            >
              <Icon name="chevron_left" />
            </button>
            <button
              type="button"
              aria-label="Photo suivante"
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 md:grid"
            >
              <Icon name="chevron_right" />
            </button>
            <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 md:hidden">
              {product.images.map((_, i) => (
                <button key={i} type="button" aria-label={`Photo ${i + 1}`} onClick={() => go(i)} className="grid h-8 min-w-8 place-items-center">
                  <span className={cn("block h-1.5 rounded-full transition-all", i === index ? "w-6 bg-secondary-container" : "w-1.5 bg-white/70")} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="hidden gap-3 md:flex" role="group" aria-label="Photos du plat">
          {product.images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Afficher la photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={cn(
                "relative aspect-[4/3] w-24 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-surface transition",
                i === index ? "ring-primary-container" : "ring-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
