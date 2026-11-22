"use client";

import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/data/catalog";
import { getProduct } from "@/lib/data/products";
import { DEMO_OTP } from "@/lib/data/seed";
import { isValidEmail, normalizePhone } from "@/lib/format";
import type { Address, ChangePreference, Order, UserProfile } from "@/lib/types";
import { getState, setState } from "./store";

export const MAX_QUANTITY = 20;

const clampQty = (q: number) => Math.max(1, Math.min(MAX_QUANTITY, Math.round(q)));

// ------------------------------------------------------------------ Cart
export function addToCart(slug: string, quantity = 1) {
  if (!getProduct(slug)) return;
  setState((s) => {
    const existing = s.cart.find((i) => i.slug === slug);
    const cart = existing
      ? s.cart.map((i) => (i.slug === slug ? { ...i, quantity: clampQty(i.quantity + quantity) } : i))
      : [...s.cart, { slug, quantity: clampQty(quantity) }];
    return { ...s, cart };
  });
}

export function setCartQuantity(slug: string, quantity: number) {
  if (quantity <= 0) return removeFromCart(slug);
  setState((s) => ({
    ...s,
    cart: s.cart.map((i) => (i.slug === slug ? { ...i, quantity: clampQty(quantity) } : i)),
  }));
}

export function removeFromCart(slug: string) {
  setState((s) => ({ ...s, cart: s.cart.filter((i) => i.slug !== slug) }));
}

export function clearCart() {
  setState((s) => ({ ...s, cart: [] }));
}

export function computeTotals(subtotal: number) {
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

// ------------------------------------------------------------------ Favourites
export function toggleFavorite(slug: string) {
  setState((s) => ({
    ...s,
    favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug],
  }));
}

// ------------------------------------------------------------------ Auth (mock)
export type AuthResult = { ok: true; user: UserProfile } | { ok: false; error: string; field?: string };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function startSession(user: UserProfile) {
  setState((s) => ({ ...s, sessionUserId: user.id }));
}

export async function requestOtp(phone: string): Promise<AuthResult> {
  await delay(450);
  const national = normalizePhone(phone);
  const user = getState().users.find((u) => u.phone === national);
  if (!user) {
    return { ok: false, field: "phone", error: "Aucun compte n'est associé à ce numéro. Créez un compte en quelques secondes." };
  }
  return { ok: true, user };
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResult> {
  await delay(450);
  const national = normalizePhone(phone);
  const user = getState().users.find((u) => u.phone === national);
  if (!user) return { ok: false, error: "Session expirée, veuillez recommencer." };
  if (code.trim() !== DEMO_OTP) return { ok: false, field: "otp", error: "Code incorrect. Vérifiez le SMS reçu." };
  startSession(user);
  return { ok: true, user };
}

export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  await delay(450);
  const user = getState().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return { ok: false, field: "password", error: "Email ou mot de passe incorrect." };
  }
  startSession(user);
  return { ok: true, user };
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  await delay(500);
  const phone = normalizePhone(input.phone);
  const email = input.email.trim().toLowerCase();
  const { users } = getState();
  if (users.some((u) => u.phone === phone)) {
    return { ok: false, field: "phone", error: "Ce numéro est déjà associé à un compte." };
  }
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, field: "email", error: "Cet email est déjà utilisé." };
  }
  if (!isValidEmail(email)) return { ok: false, field: "email", error: "Adresse email invalide." };
  const user: UserProfile = {
    id: `u-${Date.now().toString(36)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone,
    email,
    password: input.password,
    memberSince: Date.now(),
    points: 50,
    addresses: [],
    defaultAddressId: null,
    changePreference: "exact",
    preferences: [],
  };
  setState((s) => ({ ...s, users: [...s.users, user], sessionUserId: user.id }));
  return { ok: true, user };
}

export function logout() {
  setState((s) => ({ ...s, sessionUserId: null }));
}

// ------------------------------------------------------------------ Profile
function updateUser(id: string, fn: (u: UserProfile) => UserProfile) {
  setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? fn(u) : u)) }));
}

export function updateProfile(
  id: string,
  patch: Partial<Pick<UserProfile, "firstName" | "lastName" | "phone" | "email" | "changePreference" | "preferences">>,
) {
  updateUser(id, (u) => ({ ...u, ...patch, phone: patch.phone ? normalizePhone(patch.phone) : u.phone }));
}

export function saveAddress(userId: string, address: Omit<Address, "id"> & { id?: string }, makeDefault = false) {
  const id = address.id ?? `a-${Date.now().toString(36)}`;
  updateUser(userId, (u) => {
    const exists = u.addresses.some((a) => a.id === id);
    const addresses = exists
      ? u.addresses.map((a) => (a.id === id ? { ...address, id } : a))
      : [...u.addresses, { ...address, id }];
    return { ...u, addresses, defaultAddressId: makeDefault || !u.defaultAddressId ? id : u.defaultAddressId };
  });
  return id;
}

export function deleteAddress(userId: string, addressId: string) {
  updateUser(userId, (u) => {
    const addresses = u.addresses.filter((a) => a.id !== addressId);
    return {
      ...u,
      addresses,
      defaultAddressId: u.defaultAddressId === addressId ? (addresses[0]?.id ?? null) : u.defaultAddressId,
    };
  });
}

export function setDefaultAddress(userId: string, addressId: string) {
  updateUser(userId, (u) => ({ ...u, defaultAddressId: addressId }));
}

// ------------------------------------------------------------------ Orders
export interface PlaceOrderInput {
  contact: { fullName: string; phone: string };
  address: Order["address"];
  changePreference: ChangePreference;
}

function randomDigits(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await delay(700);
  const s = getState();
  const lines = s.cart.flatMap((i) => {
    const p = getProduct(i.slug);
    return p ? [{ slug: p.slug, name: p.name, price: p.price, quantity: i.quantity, image: p.images[0] }] : [];
  });
  if (lines.length === 0) throw new Error("Votre panier est vide.");
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totals = computeTotals(subtotal);
  const order: Order = {
    id: `LD-${randomDigits(5)}`,
    userId: s.sessionUserId ?? "guest",
    createdAt: Date.now(),
    lines,
    ...totals,
    paymentMethod: "especes",
    changePreference: input.changePreference,
    contact: { fullName: input.contact.fullName.trim(), phone: normalizePhone(input.contact.phone) },
    address: input.address,
    courierId: "c-mehdi",
    handoverCode: randomDigits(3),
  };
  setState((st) => ({
    ...st,
    orders: [order, ...st.orders],
    cart: [],
    users: st.users.map((u) =>
      u.id === st.sessionUserId ? { ...u, points: u.points + Math.floor(totals.total / 100) } : u,
    ),
  }));
  return order;
}
