export type CategoryId = "sandwiches" | "entrees" | "plats" | "douceurs" | "boissons";

export type LabelId =
  | "terroir"
  | "halal"
  | "vegetarien"
  | "sans-gluten"
  | "epice-doux"
  | "signature";

export interface Product {
  slug: string;
  name: string;
  /** Short name used on compact mobile cards */
  shortName: string;
  category: CategoryId;
  price: number;
  /** Small uppercase caption shown above the title (e.g. "Pain Matlouh au levain") */
  subtitle: string;
  description: string;
  /** Long-form description for the details page */
  story: string;
  /** Badge on the image (e.g. "Signature", "Best-Seller") */
  badge?: string;
  /** Provenance pill (e.g. "Terroir Algérois") */
  origin: string;
  /** Location shown on mobile cards (e.g. "Casbah, Alger") */
  locality: string;
  /** Footer caption on catalogue cards (e.g. "Navets doux & pois chiches") */
  pairing: string;
  /** Unit caption under price (e.g. "Coffret", "1 Coupe") */
  unit?: string;
  labels: LabelId[];
  /** Display tags with icons on catalogue cards */
  tags: { icon?: string; label: string }[];
  rating: number;
  reviews: number;
  prepMinutes: number;
  popularity: number;
  images: string[];
  /** Material Symbol shown when the product has no photo (drinks) */
  icon?: string;
  ingredients: string[];
  allergens: string[];
  serves: string;
}

export interface CartItem {
  slug: string;
  quantity: number;
  note?: string;
}

export interface Address {
  id: string;
  label: string;
  commune: string;
  street: string;
  building: string;
  instructions: string;
  icon: "home" | "work" | "villa";
}

export type ChangePreference = "exact" | "2000" | "1000" | "5000";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // national format, 9 digits e.g. "550489211"
  email: string;
  password: string; // mock only — never do this with a real backend
  memberSince: number;
  points: number;
  addresses: Address[];
  defaultAddressId: string | null;
  changePreference: ChangePreference;
  preferences: string[];
}

export type OrderStatus = "confirmee" | "preparation" | "en_route" | "livree";

export interface OrderLine {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  createdAt: number;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "especes";
  changePreference: ChangePreference;
  contact: { fullName: string; phone: string };
  address: Omit<Address, "id" | "label" | "icon"> & { label?: string };
  /** Fixed status for seeded/demo orders; live orders derive status from elapsed time */
  statusOverride?: OrderStatus;
  courierId: string;
  handoverCode: string;
}
