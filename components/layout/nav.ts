export const DESKTOP_NAV = [
  { href: "/menu", label: "Menu & Commandes", match: (p: string) => p === "/menu" || p.startsWith("/menu/") },
  { href: "/#plats-signatures", label: "Nos Spécialités", match: () => false },
  { href: "/suivi", label: "Suivi en Direct", match: (p: string) => p.startsWith("/suivi") },
  { href: "/compte", label: "Espace Gourmet", match: (p: string) => p.startsWith("/compte") },
];

export const MOBILE_NAV = [
  { href: "/", label: "Accueil", icon: "home", match: (p: string) => p === "/" },
  { href: "/menu", label: "Carte & Offres", icon: "restaurant_menu", match: (p: string) => p.startsWith("/menu") },
  { href: "/favoris", label: "Favoris", icon: "favorite", match: (p: string) => p.startsWith("/favoris") },
  { href: "/compte", label: "Profil", icon: "account_circle", match: (p: string) => p.startsWith("/compte") },
];

interface MobileRoute {
  title: string;
  back?: string;
  /** hide floating pill tab bar (pages with their own sticky CTA) */
  hideTabBar?: boolean;
  /** show floating "Votre commande" cart pill */
  cartPill?: boolean;
}

export function mobileRoute(pathname: string): MobileRoute {
  if (pathname === "/") return { title: "Accueil", cartPill: true };
  if (pathname === "/menu") return { title: "Carte & Offres", cartPill: true };
  if (pathname.startsWith("/menu/")) return { title: "Détail du Plat", back: "/menu", hideTabBar: true };
  if (pathname === "/panier") return { title: "Panier Gastronomique", back: "/menu", hideTabBar: true };
  if (pathname.startsWith("/commande/confirmation")) return { title: "Confirmation", hideTabBar: true };
  if (pathname.startsWith("/commande")) return { title: "Finalisation", back: "/panier", hideTabBar: true };
  if (pathname === "/compte/commandes") return { title: "Mes Commandes", back: "/compte" };
  if (pathname.startsWith("/compte")) return { title: "Profil" };
  if (pathname.startsWith("/suivi")) return { title: "Suivi en Direct", back: "/compte", hideTabBar: true };
  if (pathname.startsWith("/favoris")) return { title: "Mes Favoris", cartPill: true };
  return { title: "La Dentelle" };
}
