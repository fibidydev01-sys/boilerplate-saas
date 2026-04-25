/**
 * Smoothly scrolls to an element by id, accounting for the sticky header offset.
 * Used by the header nav when linking to in-page sections like #features or #pricing.
 */
export function scrollToSection(elementId: string, offsetPx = 80) {
  const target = document.getElementById(elementId);
  if (!target) return;

  const targetPosition =
    target.getBoundingClientRect().top + window.scrollY - offsetPx;

  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });
}

/**
 * Formats cents as a display price. Drops trailing `.00` for clean round prices.
 *   formatPrice(13900) => "$139"
 *   formatPrice(12999) => "$129.99"
 */
export function formatPrice(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
  return formatter.format(amount);
}

export { interpolateBrand } from "./interpolate-brand";
