# La Dentelle — Frontend Implementation Plan

Persistent source of truth for the frontend build. Keep in sync with the code.

## Objective & scope
Responsive e-commerce (food ordering & delivery) frontend for **La Dentelle**, an Algerian fine-dining
restaurant in Algiers. French UI, prices in Algerian dinars (DA). Faithful reproduction of the Google Stitch
references in `stitch_ladentelle/`, corrected for responsiveness/usability, with mock data and persistent
client state, ready for backend integration.

Stack: Next.js 16.4 (App Router, `cacheComponents: true`), React 19.3, Tailwind CSS v4, `motion` (Framer Motion API
via `motion/react`), Playwright 1.65.

## Milestones
| # | Milestone | Status |
|---|-----------|--------|
| 1 | Foundation & shared components | ✅ done |
| 2 | Landing page | ✅ done |
| 3 | Catalogue | ✅ done |
| 4 | Product details | ✅ done |
| 5 | Authentication | ✅ done |
| 6 | Cart & checkout | ✅ done |
| 7 | Profile & order tracking | ✅ done |
| 8 | Integration & final QA | ✅ done |

## Design reference mapping
| Route | Desktop reference | Mobile reference | Notes |
|-------|-------------------|------------------|-------|
| `/` | `home-page-desktop` | `home-page-mobile` | Desktop hero is a 3-slide carousel (HTML), screenshot shows images unloaded |
| `/menu` | `all-products-desktop` | `all-products-mobile` | Categories, search, labels, sort |
| `/menu/[slug]` | — (none provided) | — | Built from the design system + card language |
| `/connexion` | `auth-desktop` | `auth-mobile` | Login (phone OTP / email), signup tab |
| `/panier` | `checkout-desktop` (summary column) | `checkout-mobile` (item list) | No dedicated cart reference |
| `/commande` | `checkout-desktop` | `checkout-mobile` | 3 steps: coordonnées, livraison, paiement espèces |
| `/compte` | `orders-desktop` | `profile-mobile` | `orders-desktop` is actually the account / profile page |
| `/compte/commandes` | `orders-desktop` (history block) | `profile-mobile` (history entry) | Full order history |
| `/suivi?id=` | `order-tracking-desktop` | `order-tracking-mobile` | Mobile ref title "Détail Du Plat" is a Stitch mislabel |
| `/favoris` | — | bottom-nav heart | Simple favourites grid |

Design system: `stitch_ladentelle/modern_maghreb_fine_dining/DESIGN.md` (Material-3 style tokens).

### Reference defects corrected
- Several desktop screenshots fell back to a serif font and grey `img` placeholders → Plus Jakarta Sans everywhere, real images self-hosted.
- Broken `logo.jpg` in mobile refs → real La Dentelle emblem (`public/images/logo.jpg`).
- Overlapping section headings/subtitles and wrapping CTA labels (home desktop) → proper line heights, no fixed heights.
- Price + "DA" wrapping onto two lines in cards → `whitespace-nowrap` prices.
- Three different desktop headers across refs → one unified desktop header (catalogue/checkout/tracking variant), home keeps its promo ribbon.
- Floating "Concierge Culinaire" widget overlapping footer → dropped (no function; concierge contact lives in footer/profile).
- Images with baked-in UI mockups were cropped (see `public/images/products`).

## Architecture
```
app/
  layout.tsx            root: fonts (Plus Jakarta Sans via next/font, Material Symbols local subset), providers
  globals.css           Tailwind v4 @theme tokens
  (shop)/layout.tsx     desktop header + footer, mobile top bar + bottom nav
  (shop)/page.tsx       home
  (shop)/menu/...       catalogue + product details
  (shop)/panier, commande, compte, suivi, favoris
  (auth)/connexion      full-screen auth (no site chrome)
components/
  ui/        Icon, Button, Chip, QuantitySelector, Field/Input, Badge, Skeleton, EmptyState, Toast, Sheet
  layout/    DesktopHeader, MobileTopBar, BottomNav, SiteFooter, MobileCartBar
  product/   ProductCard (variants), FavoriteButton, AddToCartButton, ProductImage
lib/
  data/      products, categories, labels, communes, seed users/orders, courier
  store/     persistent client store (useSyncExternalStore + localStorage) and actions
  format.ts  price/date formatting (deterministic, no locale drift between server & client)
  tracking.ts order status/progress/courier position model (swap for live GPS later)
scripts/fetch-icons.mjs  regenerates the Material Symbols subset (re-run after adding an icon)
e2e/        Playwright specs
```

## Design tokens
Defined in `app/globals.css` `@theme`: full Material-3 colour set from DESIGN.md (`primary #00443d`,
`primary-container #135d54`, `secondary #775a00`, `secondary-container #fed269`, surfaces `#f3fbf8`…),
typography scale (`display`, `headline-*`, `body-*`, `label-*`), spacing aliases (`space-*`, `margin`, `gutter`),
shadows (`shadow-card`, `shadow-float`). Radii: Tailwind defaults (8px base, 2xl/3xl for cards).

## State management
Single persistent store (`lib/store`) built on `useSyncExternalStore`, persisted to `localStorage`
(`ladentelle:v1`). Server snapshot = deterministic initial state → no hydration mismatch; `useHydrated()` gates
UI that depends on persisted data. Slices: `cart`, `favorites`, `users` (mock accounts), `session`, `orders`.

## Mock data
- 19 products across 5 categories (sandwiches, entrées, plats, douceurs, boissons) with labels, ratings, prep time.
- Seed account: **Amine Benali**, phone `550 48 92 11`, email `amine.benali@example.dz`, password `dentelle2025`, OTP `123456`.
- Seed orders: `LD-84920` (en route), `LD-79102`, `LD-74311` (delivered).

## Tests
Playwright specs in `e2e/` — projects `desktop` (Chrome 1440×900) and `mobile` (Pixel 7).
Run: `npx playwright test` (builds + serves prod on :3200) or `PW_BASE_URL=http://localhost:3100 npx playwright test` against `next dev`.

| Spec | Covers (brief §8 scenario #) |
|------|------------------------------|
| `home.spec.ts` | landing render (1), carousel, delivery estimator, nav home→menu→product (3), tablet menu sheet |
| `layout.spec.ts` | 14 routes × 360/768/1024/1280 px: no horizontal overflow, no console/hydration errors (2) |
| `catalogue.spec.ts` | listing, accent-insensitive search, empty state, category + label filters, sort, URL restore (4) |
| `product.spec.ts` | details (5), gallery, 404, quantity selection (6), add to cart (7), favourites |
| `auth.spec.ts` | phone/OTP + email validation & login, `?next=`, signup validation + duplicate checks, guest (10) |
| `cart-checkout.spec.ts` | add from catalogue + persistence after reload (17), qty/remove (8), totals & delivery fee (9), guest validation, prefill (12), completion (13), confirmation (14), order in history (15), save new address to profile |
| `profile-tracking.spec.ts` | auth guard, profile edit persists + prefills checkout (11), address add/default, history filters + detail + reorder, logout, tracking statuses for en-route / new / delivered orders (16) |

**Final run (M8):** `63 passed, 7 skipped` on the production build (skips are intentional: desktop-only flows in the mobile project and the explicit-viewport smoke suite). ESLint: 0 problems. `tsc --noEmit`: 0 errors.

## Known issues / limitations
- No product-details or signup reference: both designed from DESIGN.md and the surrounding screens.
- Mock-only backend: auth (OTP `123456`), orders, points and addresses live in `localStorage` (`ladentelle:v1`). Passwords stored in clear in the mock — must move server-side.
- Tracking uses a static map tile + simulated progress; swap `getTrackingSnapshot` for a courier GPS feed and/or replace `TrackingMap` with a map SDK.
- Social login (Google/Apple), CIB/Edahabia payment and "Oublié ?" are UI-only (toasts), as no backend exists.
- Drinks have no photography in the references → branded icon fallback (`ProductImage`).
- `notFound()` inside a streamed Suspense boundary renders the 404 UI with HTTP 200 (streaming); unmatched URLs return a real 404.
- Next 16 keeps visited routes mounted but hidden (`<Activity>`): transient UI state is reset with `lib/use-on-hide.ts`; tests scope selectors to visible elements.

## Backend integration notes
- Replace `lib/store/actions.ts` implementations with API calls (same signatures: `requestOtp`, `verifyOtp`, `loginWithPassword`, `signup`, `updateProfile`, `saveAddress`, `placeOrder`…); keep the store as a client cache or move to Server Actions + `refresh()`.
- Product data: `lib/data/products.ts` → CMS/API; `generateStaticParams` already drives `/menu/[slug]`.
- Prices/fees: `DELIVERY_FEE`, `FREE_DELIVERY_THRESHOLD` in `lib/data/catalog.ts` (server should be the source of truth for totals).

## Progress log
### M1 — Foundation ✅
- Tokens (`app/globals.css`), fonts (Plus Jakarta Sans via `next/font/google`; Material Symbols subset 81 KB via `next/font/local`, `scripts/fetch-icons.mjs`).
- Data: `lib/types.ts`, `lib/data/{catalog,products,seed}.ts`; 33 product photos in `public/images/products` (downloaded from refs, cropped where UI mockups were baked in), plus `logo.jpg`, `avatar-amine.jpg`, `courier.jpg`, `map-alger.png`, `auth-bg.jpg`.
- State: `lib/store/{store,actions,hooks}.ts`; tracking model `lib/tracking.ts`; formatters `lib/format.ts` (deterministic, NBSP grouping: `1 100 DA`).
- UI: `components/ui/{Icon,Button,QuantitySelector,Field,Toast,Sheet,States}.tsx`.
- Product: `components/product/{ProductImage,ProductActions,ProductCard}.tsx` (FeatureCard = home desktop, CatalogCard = catalogue desktop, CompactCard = mobile 2-up).
- Layout: `app/(shop)/layout.tsx` + `template.tsx` (page transition); `components/layout/{DesktopHeader,MobileChrome,SiteFooter,nav}.tsx`. Mobile titles/back buttons/tab-bar visibility per route in `nav.ts#mobileRoute`.
- Tooling: `playwright.config.ts` (desktop 1440×900 + Pixel 7 projects, builds & serves on :3200 or uses `PW_BASE_URL`), `scripts/shot.mjs` (dev screenshot + overflow check; on Git Bash use `MSYS_NO_PATHCONV=1`).
- Decisions: `ProductImage` always fills its positioned parent (`absolute inset-0`); desktop nav "À Propos" → "Espace Gourmet" (/compte) since no about content exists (footer carries `#a-propos`).

### M2 — Landing page ✅
- `app/(shop)/page.tsx` (desktop sections from `home-page-desktop`; `MobileHome` from `home-page-mobile`, swapped by `md:` breakpoint).
- `components/home/{HeroCarousel,CategoryBar,DeliveryEstimator,DrinksBanner,MobileHome}.tsx`.
- Deviations: hero uses the HTML's full-bleed image + gradient (screenshot showed a split because images failed to load); "Explorer la Carte en Swipant" → "Explorer toute la Carte" (no swipe feature); mobile mic icon dropped (no voice search); mobile "tune" button links to the catalogue filters; "Réserver un Salon Privé" opens a reservation sheet (mock, toast confirmation).
- Tests: `e2e/home.spec.ts` (render/overflow, carousel, estimator) — 4 passed / 2 skipped (desktop-only on mobile).

### M3 — Catalogue ✅
- `app/(shop)/menu/page.tsx` (server header + `<Suspense>` around the client `Catalogue`, required by `useSearchParams` under cacheComponents).
- `components/catalogue/Catalogue.tsx`, filtering logic in `lib/catalogue.ts` (`parseQuery`/`serializeQuery`/`filterProducts`).
- URL params: `q`, `categorie`, `labels` (comma list), `tri`. Updated with `window.history.replaceState` (shallow, no server round-trip; Next syncs `useSearchParams`).
- Desktop: sticky filter panel (categories, search, sort select, label chips, count, reset). Mobile: back button + "NN Mets" badge, search + filter sheet (sort & labels), category pills, 3 quick label toggles, 2-up compact cards, "Rituel de clôture" banner → boissons.
- Deviations: catalogue categories unified with home categories (5 instead of 6 desktop tabs: tajines/grillades merged into "Plats de Terroir", pains into "Entrées"); "Offert" badge on the drinks banner → "Dès 250 DA" (no free-tea mechanic exists).
- Dev note: if the dev server shows a hydration mismatch right after an edit, the server module graph may be stale — restart `next dev` (kill orphaned node on :3100). `scripts/hydration-check.mjs` prints the diff.
- Tests: `e2e/catalogue.spec.ts` — 10/10 passed (desktop + mobile).

### M4 — Product details ✅
- `app/(shop)/menu/[slug]/page.tsx`: `generateStaticParams` (all slugs) + `params.then()` inside `<Suspense>` (Next 16 instant-navigation rule: URL data must be read under Suspense). Unknown slug → `notFound()` → `app/not-found.tsx` (streamed, so HTTP status may be 200 — UI asserted in tests).
- `components/product/{ProductGallery,ProductPurchase}.tsx`. Desktop: breadcrumb, 2-col gallery/info, inline quantity + "Ajouter · total". Mobile: edge-to-edge swipe gallery, overlapping rounded info sheet, sticky bottom purchase bar (tab bar hidden on this route).
- Design built from DESIGN.md (no reference provided): label pills = "Heritage/Dietary Tag" spec, quantity = "Segmented pill" spec.
- Next 16: `Image priority` is deprecated → `loading="eager"` (+ `fetchPriority` for hero). `devIndicators: false` in next.config (badge covered mobile CTAs during dev testing).
- Tests: `e2e/product.spec.ts` — 8/8 passed.

### M5 — Authentication ✅
- `app/(auth)/layout.tsx` (no site chrome) + `app/(auth)/connexion/page.tsx` (Suspense → `components/auth/AuthScreen.tsx`); forms in `components/auth/AuthForms.tsx`.
- Login: phone (+213, validates 9 digits starting 5/6/7, accepts `0550…`/`+213…`) → SMS OTP step (demo code `123456`, resend cooldown 30 s) ; collapsible email/password (show/hide, "Oublié ?" toast). Signup tab (`?mode=inscription`): prénom, nom, mobile, email, password (≥8 + digit), CGU checkbox; duplicate phone/email errors. Google/Apple → "bientôt disponible" toast. Guest → `/menu`.
- Redirect target: `?next=` (same-origin paths only), default `/compte`; already-signed-in visitors are redirected.
- Design: desktop split card (brand panel with `auth-bg.jpg` + teal overlay / form), mobile stacked (big emblem, white form card, stacked social buttons) per refs. Signup has no reference → same card language.
- Added `Button` variant `solid` (#00443d) and `AddToCartButton tone` to avoid conflicting bg utilities.
- Tests: `e2e/auth.spec.ts` — 8/8 passed.

### M6 — Cart & checkout ✅
- `/panier` → `components/cart/CartView.tsx`; shared `components/cart/CartParts.tsx` (`CartLineRow` card/compact, `FreeDeliveryMeter`, `TotalsBlock`).
- `/commande` → `components/checkout/CheckoutView.tsx`; `/commande/confirmation?id=` → `ConfirmationView.tsx` (Suspense for `useSearchParams`).
- Pricing: delivery 600 DA, free from 3 000 DA (home ribbon offer); packaging "Inclus"; cash only (no online payment, per refs) with change preference (exact / 2 000 / 1 000 / 5 000).
- Prefill: name, phone, default address and change preference from the session user; saved-address chips + "Nouvelle adresse"; checkbox "Enregistrer ces coordonnées dans mon profil" (auto-checked when entering a new address) updates profile + saves/updates the address. Guests see a sign-in banner (`/connexion?next=/commande`) and can still order (`userId: "guest"`).
- Order placement (`placeOrder`) clears the cart, awards loyalty points (1 pt / 100 DA), navigates to confirmation; a pending overlay hides the empty-cart flash.
- Mobile: compact editable lines (checkout-mobile), collapsed address card with "Modifier", sticky dark "Confirmer la Commande • total" button. Desktop: 3 step sections + sticky summary.
- Fixes: grid containers need `grid-cols-1` on mobile (min-content overflow); never combine `hidden` with button classes containing `inline-flex` (wrap instead); header nav labels `whitespace-nowrap`, location pill only ≥2xl.
- Tests: `e2e/cart-checkout.spec.ts` — 8/10 at M6 end; the 2 failures need `/compte/commandes` (M7).

### M7 — Profile & order tracking ✅
- `/compte` → `components/account/AccountView.tsx` (+ `AccountPanels.tsx`: `ProfileSheet`, `AddressSheet`, `AddressesPanel`, `PaymentPanel`, `PreferencesPanel`). Desktop = `orders-desktop` (profile header + points, active order, history, favourites, concierge, addresses, payment, preferences). Mobile = `profile-mobile` (profile card + points, dark active-order card, services list opening sheets, favourites, logout).
- `useRequireUser(next)` guard → `/connexion?next=…`; sign-out sets a flag so the guard doesn't bounce to login.
- `/compte/commandes` → `components/orders/OrdersView.tsx` (Toutes / En cours / Livrées). Shared `components/orders/OrderParts.tsx` (`useNow`, `StatusPill`, `ActiveOrderCard`, `ActiveOrderHero`, `OrderHistoryRow`, `reorder`).
- `/suivi?id=` → `components/tracking/{TrackingView,TrackingMap}.tsx`. Without `id`: active (else latest) order of the user. Desktop = `order-tracking-desktop` (header w/ ETA + remaining, map, 4-step timeline, courier, handover code, recap, SMS/instructions/share-GPS bar). Mobile = `order-tracking-mobile` (map with overlay, segmented progress, code, courier, recap, concierge).
- Tracking model (`lib/tracking.ts`): seeded orders have `statusOverride`; live orders progress by age (0–2 min confirmée, 2–12 préparation, 12–35 en route, then livrée). Map = static Algiers tile (`map-alger.png`) + SVG route; markers placed from lat/lng via `projectToMap` (bounds `MAP_BOUNDS`) → replace snapshot source with courier GPS feed for real tracking.
- `useNow` is an external store (server snapshot 0) — Next 16 forbids `Date.now()` during prerender of client components.
- `/favoris` → `components/favorites/FavoritesView.tsx`.
- Tests: `e2e/profile-tracking.spec.ts` 16/16; `e2e/cart-checkout.spec.ts` now 10/10.

### M8 — Integration & final QA ✅
- ESLint fixes: no ref mutation via props (catalogue search focus), no ref read during render (checkout `placed` → state), Sheet focus expression.
- `e2e/layout.spec.ts` smoke suite found & fixed: hero `aspect-ratio + min-height` forcing a 1026 px min-width at 1024 px; header too wide at 1024 px with a filled cart (cart label collapses to icon+badge between lg and xl); nested `<main>` on product 404 (`components/ui/NotFoundContent.tsx` + segment `not-found.tsx`).
- Tablet (768–1023 px) had no primary navigation → menu button + navigation sheet in `DesktopHeader`.
- `<Activity>` state preservation handled with `useOnHide` (checkout pending overlay, sheets, auth redirect flag, tablet menu).
- Dev helpers: `scripts/shot.mjs` (desktop|tablet|mobile screenshots + overflow), `scripts/hydration-check.mjs`, `scripts/find-overflow.mjs`, `scripts/seed-setup.mjs` (demo session for screenshots), `scripts/fetch-icons.mjs`.
- Production build: all routes static (○) or partial prerender (◐ product pages).

## Status
All 8 milestones complete. Next steps would be backend integration (see notes above) and real GPS tracking.
