"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const SLIDES = [
  {
    image: "/images/products/matlouh-agneau-2.jpg",
    alt: "Sandwich matlouh à l'agneau confit 7h",
    badge: { icon: "local_fire_department", label: "Nouveau à la carte", className: "bg-secondary-container text-on-secondary-fixed" },
    title: "Les Nouveaux Sandwiches Gastronomiques & Matlouh Artisanal",
    text: "Le pain matlouh moelleux cuit sur pierre, farci d'agneau confit 7h, de sauces chermoula parfumées ou de poulet fermier braisé au hmiss grillé.",
    cta: { label: "Commander un Sandwich", href: "/#sandwiches", className: "bg-secondary-container text-on-secondary-fixed hover:bg-secondary-fixed" },
    secondary: { label: "Explorer Tout le Menu", href: "/menu" },
  },
  {
    image: "/images/products/grand-plateau-1.jpg",
    alt: "Plateau de makrout el louz et pâtisseries algéroises",
    badge: { icon: "diamond", label: "Terroir d'Alger & Casbah", className: "bg-primary-fixed text-on-primary-fixed" },
    title: "Haute Pâtisserie & Douceurs Algéroises",
    text: "Coffrets dégustation Makrout El Louz velouté au citron, Dziriettes dentelées, Cornes de Gazelle et Samsa croustillante au miel d'oranger.",
    cta: { label: "Découvrir les Douceurs", href: "/#douceurs", className: "bg-primary-fixed text-on-primary-fixed hover:bg-white" },
    note: { icon: "card_giftcard", label: "Emballages cadeaux précieux" },
  },
  {
    image: "/images/products/rechta-1.jpg",
    alt: "Rechta algéroise impériale",
    badge: { icon: "electric_moped", label: "35 min chrono", className: "bg-primary-container text-on-primary" },
    title: "Livraison Express Chaude & Isotherme sur Tout Alger",
    text: "Vos plats emblématiques (Rechta impériale, Couscous Constantinois, Tajines) scellés sous cloche thermique à 65°C pour une dégustation restaurant à domicile.",
    cta: { label: "Voir les Plats Signatures", href: "/#plats-signatures", className: "bg-white text-primary hover:bg-surface-container" },
  },
] as const;

const INTERVAL = 6500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const go = useCallback((i: number) => setIndex((i + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, reduce, go]);

  const slide = SLIDES[index];

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="À la une"
      className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative min-h-[440px] w-full overflow-hidden rounded-3xl bg-primary shadow-xl lg:aspect-[21/9]">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: reduce ? 0 : 7, ease: "linear" }}
            >
              <Image src={slide.image} alt={slide.alt} fill loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="(min-width:1280px) 1216px, 100vw" className="object-cover" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-primary/10" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-10 flex items-center px-16 py-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="max-w-2xl space-y-4 text-white"
              aria-live="polite"
            >
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm", slide.badge.className)}>
                <Icon name={slide.badge.icon} size={15} /> {slide.badge.label}
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight drop-shadow-sm lg:text-5xl">{slide.title}</h1>
              <p className="max-w-xl text-base text-white/85">{slide.text}</p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={slide.cta.href}
                  className={cn("flex items-center gap-2 rounded-xl px-6 py-3 text-base font-bold shadow-md transition active:scale-95", slide.cta.className)}
                >
                  <span>{slide.cta.label}</span>
                  <Icon name="arrow_forward" size={18} />
                </Link>
                {"secondary" in slide && (
                  <Link href={slide.secondary.href} className="rounded-xl bg-white/20 px-6 py-3 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/30">
                    {slide.secondary.label}
                  </Link>
                )}
                {"note" in slide && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-fixed">
                    <Icon name={slide.note.icon} size={18} /> {slide.note.label}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Slide précédent"
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50"
        >
          <Icon name="chevron_left" size={22} />
        </button>
        <button
          type="button"
          aria-label="Slide suivant"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50"
        >
          <Icon name="chevron_right" size={22} />
        </button>
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Aller au slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="grid h-6 place-items-center px-0.5"
            >
              <span className={cn("block h-2 rounded-full transition-all duration-300", i === index ? "w-8 bg-secondary-container" : "w-2.5 bg-white/50 hover:bg-white")} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
