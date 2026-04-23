/**
 * Commerce format helpers — safe for client use.
 *
 * Money values di LS API datang sebagai integer cents (atau sub-unit
 * currency lainnya). Helper ini format ke display string.
 *
 * IMPORTANT: Untuk currency zero-decimal (JPY, KRW, VND, dll), LS juga
 * kirim dalam smallest unit — tapi smallest unit = whole unit (bukan /100).
 * Solusi: caller SELALU pass `formatted` string dari LS kalau ada. Helper
 * ini punya fallback yang handle common zero-decimal currencies.
 */

// Currencies yang TIDAK pake decimal (subdivided). Untuk ini, LS kirim
// amount dalam whole unit, gak perlu /100.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY", "KRW", "VND", "CLP", "ISK", "PYG", "UGX", "XAF", "XOF", "XPF",
  "BIF", "DJF", "GNF", "KMF", "MGA", "RWF",
]);

/**
 * Format cents → human-readable money string.
 * Selalu prioritaskan `fallback` (formatted dari LS) — LS udah handle
 * currency rules yang benar.
 */
export function formatMoney(
  cents: number | null | undefined,
  currency: string | null | undefined,
  fallback?: string | null
): string {
  if (fallback) return fallback;
  if (cents == null) return "—";

  const curr = (currency ?? "USD").toUpperCase();
  const divisor = ZERO_DECIMAL_CURRENCIES.has(curr) ? 1 : 100;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: curr,
    }).format(cents / divisor);
  } catch {
    return `${(cents / divisor).toFixed(divisor === 1 ? 0 : 2)} ${curr}`.trim();
  }
}

/**
 * Format ISO date → locale-aware, short.
 */
export function formatDate(
  iso: string | null | undefined,
  locale?: string
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(
  iso: string | null | undefined,
  locale?: string
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Relative time — "2 days ago", "in 3 months".
 */
export function formatRelative(
  iso: string | null | undefined,
  locale?: string
): string {
  if (!iso) return "—";
  try {
    const then = new Date(iso).getTime();
    const diffMs = then - Date.now();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      return rtf.format(diffHours, "hour");
    }
    if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
    if (Math.abs(diffDays) < 365) {
      return rtf.format(Math.round(diffDays / 30), "month");
    }
    return rtf.format(Math.round(diffDays / 365), "year");
  } catch {
    return iso;
  }
}

/**
 * Escape `%` and `_` wildcards untuk PostgreSQL ILIKE. Hindari user
 * input matching unexpected (e.g. "a_b" matching "axb").
 */
export function escapeIlike(input: string): string {
  return input.replace(/[\\%_]/g, "\\$&");
}

/**
 * Map status → badge variant untuk UI.
 */
export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "refunded":
    case "partial_refund":
      return "destructive";
    case "void":
      return "secondary";
    default:
      return "outline";
  }
}

export function subscriptionStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "active":
    case "on_trial":
      return "success";
    case "paused":
      return "warning";
    case "past_due":
    case "unpaid":
      return "destructive";
    case "cancelled":
    case "expired":
      return "secondary";
    default:
      return "outline";
  }
}