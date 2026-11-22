/**
 * Deterministic formatters. We avoid Intl/toLocale* so that server-rendered and
 * client-rendered text are byte-identical (no hydration drift between Node & browser ICU).
 */

const NBSP = " ";

/** 1100 -> "1 100" (non-breaking thin grouping) */
export function formatNumber(value: number): string {
  const sign = value < 0 ? "-" : "";
  const digits = Math.round(Math.abs(value)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** 1100 -> "1 100 DA" */
export function formatPrice(value: number): string {
  return `${formatNumber(value)}${NBSP}DA`;
}

/** "550489211" -> "550 48 92 11" */
export function formatPhone(national: string): string {
  const d = national.replace(/\D/g, "").slice(-9);
  if (d.length !== 9) return national;
  return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** Normalises user input like "+213 550 48 92 11" / "0550489211" to 9 national digits */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("213")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

export function isValidAlgerianMobile(input: string): boolean {
  return /^[567]\d{8}$/.test(normalizePhone(input));
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const ALGIERS_OFFSET = 60 * 60_000; // UTC+1, no DST

function algiers(ts: number) {
  return new Date(ts + ALGIERS_OFFSET);
}

/** "14 octobre" */
export function formatDay(ts: number): string {
  const d = algiers(ts);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "14 octobre 2026" */
export function formatDate(ts: number): string {
  return `${formatDay(ts)} ${algiers(ts).getUTCFullYear()}`;
}

/** "20:20" in Algiers time */
export function formatTime(ts: number): string {
  const d = algiers(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function pluralize(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}
