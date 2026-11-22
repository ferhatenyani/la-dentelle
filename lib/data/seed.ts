import type { Order, UserProfile } from "@/lib/types";

/** Fixed reference instant for seeded data, so server & client render identical values. */
const DAY = 86_400_000;
const SEED_NOW = Date.UTC(2026, 10, 20, 19, 2); // 20 Nov 2026, 20:02 Algiers (UTC+1)

export const DEMO_OTP = "123456";

export const SEED_USER: UserProfile = {
  id: "u-amine",
  firstName: "Amine",
  lastName: "Benali",
  phone: "550489211",
  email: "amine.benali@example.dz",
  password: "dentelle2025",
  memberSince: Date.UTC(2022, 2, 14),
  points: 480,
  addresses: [
    {
      id: "a-pins",
      label: "Résidence Les Pins",
      commune: "hydra",
      street: "14, Chemin Abdelkader Gadouche",
      building: "Résidence Les Pins, 3ème étage, Apt 14",
      instructions: "Sonnette Benali, interphone à gauche",
      icon: "home",
    },
    {
      id: "a-bureau",
      label: "Bureau",
      commune: "hydra",
      street: "Rue Tripoli, Sidi Yahia",
      building: "Bâtiment Turquoise, 4ème étage",
      instructions: "Accueil au rez-de-chaussée",
      icon: "work",
    },
    {
      id: "a-villa",
      label: "Villa Familiale",
      commune: "alger-centre",
      street: "Boulevard Mohamed V",
      building: "Villa Numidia",
      instructions: "",
      icon: "villa",
    },
  ],
  defaultAddressId: "a-pins",
  changePreference: "2000",
  preferences: ["100% Halal Certifié", "Sans Gluten sur Demande", "Épices Douces (Sans Harissa forte)", "Agneau Confit Basse Température"],
};

export const SEED_ORDERS: Order[] = [
  {
    id: "LD-84920",
    userId: SEED_USER.id,
    createdAt: SEED_NOW - 38 * 60_000,
    lines: [
      { slug: "rechta-imperiale", name: "Rechta Algéroise Impériale", price: 2600, quantity: 1, image: "/images/products/rechta-1.jpg" },
      { slug: "couscous-royal-constantinois", name: "Couscous Royal Constantinois", price: 3400, quantity: 1, image: "/images/products/couscous-1.jpg" },
      { slug: "kesra-khobz-dar", name: "Duo Kesra & Khobz Dar Artisanal", price: 850, quantity: 1, image: "/images/products/kesra-khobz-1.jpg" },
    ],
    subtotal: 6850,
    deliveryFee: 0,
    total: 6850,
    paymentMethod: "especes",
    changePreference: "2000",
    contact: { fullName: "Amine Benali", phone: "550489211" },
    address: {
      label: "Résidence Les Pins",
      commune: "hydra",
      street: "14, Chemin Abdelkader Gadouche",
      building: "Résidence Les Pins, 3ème étage, Apt 14",
      instructions: "Sonnette Benali, interphone à gauche",
    },
    statusOverride: "en_route",
    courierId: "c-mehdi",
    handoverCode: "749",
  },
  {
    id: "LD-79102",
    userId: SEED_USER.id,
    createdAt: SEED_NOW - 37 * DAY,
    lines: [
      { slug: "tajine-lham-lahlou", name: "Tajine Lham Lahlou aux Fruits Dorés", price: 2900, quantity: 1, image: "/images/products/lham-lahlou-1.jpg" },
      { slug: "trio-boureks", name: "Trio de Boureks Croustillants", price: 1800, quantity: 1, image: "/images/products/trio-boureks-1.jpg" },
      { slug: "the-menthe-timimoun", name: "Thé à la Menthe de Timimoun", price: 250, quantity: 2 },
    ],
    subtotal: 5200,
    deliveryFee: 0,
    total: 5200,
    paymentMethod: "especes",
    changePreference: "exact",
    contact: { fullName: "Amine Benali", phone: "550489211" },
    address: {
      label: "Résidence Les Pins",
      commune: "hydra",
      street: "14, Chemin Abdelkader Gadouche",
      building: "Résidence Les Pins, 3ème étage, Apt 14",
      instructions: "",
    },
    statusOverride: "livree",
    courierId: "c-karim",
    handoverCode: "318",
  },
  {
    id: "LD-74311",
    userId: SEED_USER.id,
    createdAt: SEED_NOW - 53 * DAY,
    lines: [
      { slug: "makrout-el-louz-dziriettes", name: "Makrout El Louz & Dziriettes", price: 1600, quantity: 1, image: "/images/products/makrout-dziriettes-1.jpg" },
      { slug: "grand-plateau-patisseries", name: "Grand Plateau Pâtisseries Fines", price: 2200, quantity: 1, image: "/images/products/grand-plateau-1.jpg" },
      { slug: "cherbet-citron-boufarik", name: "Cherbet Citron de Boufarik 1L", price: 400, quantity: 1 },
    ],
    subtotal: 4200,
    deliveryFee: 0,
    total: 4200,
    paymentMethod: "especes",
    changePreference: "1000",
    contact: { fullName: "Amine Benali", phone: "550489211" },
    address: {
      label: "Bureau",
      commune: "hydra",
      street: "Rue Tripoli, Sidi Yahia",
      building: "Bâtiment Turquoise, 4ème étage",
      instructions: "",
    },
    statusOverride: "livree",
    courierId: "c-mehdi",
    handoverCode: "552",
  },
];

export const COURIERS: Record<string, { name: string; rating: number; vehicle: string; photo: string; phone: string }> = {
  "c-mehdi": { name: "Mehdi K.", rating: 4.98, vehicle: "Scooter Électrique #04", photo: "/images/courier.jpg", phone: "+213 (0) 550 77 31 04" },
  "c-karim": { name: "Karim M.", rating: 4.95, vehicle: "Scooter Électrique #11", photo: "/images/courier.jpg", phone: "+213 (0) 550 77 31 11" },
};
