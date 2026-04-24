/**
 * Centralized route constants.
 *
 * Changes in this version:
 *   + PRICING, SHOWCASE           (marketing pages)
 *   + LEGAL.*                     (5 legal pages)
 *   + PUBLIC_EXACT_ROUTES         (exact-match allowlist, incl. "/" home)
 *   + PUBLIC_ROUTE_PREFIXES       (prefix-match allowlist)
 *   + isPublicRoute()             (middleware helper)
 *
 * Existing constants unchanged.
 */

export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Marketing (Public)
  PRICING: "/pricing",
  SHOWCASE: "/showcase",

  // Legal (Public)
  LEGAL: {
    PRIVACY_POLICY: "/legal/privacy-policy",
    TERMS: "/legal/terms",
    LICENSE: "/legal/license",
    DISCLAIMER: "/legal/disclaimer",
    ACCEPTABLE_USE: "/legal/acceptable-use",
  },

  // Dashboard
  DASHBOARD: "/dashboard",
  OVERVIEW: "/overview",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  SETTINGS_INTEGRATIONS: "/settings/integrations",
  SETTINGS_WEBHOOKS: "/settings/webhooks",

  // Admin
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",

  // Commerce
  PRODUCTS: "/products",
  ORDERS: "/orders",
  SUBSCRIPTIONS: "/subscriptions",
  CUSTOMERS: "/customers",

  // API — Auth
  API_AUTH_CONFIRM: "/api/auth/confirm",
  API_AUTH_CALLBACK: "/api/auth/callback",
  API_AUTH_HOOKS_SEND_EMAIL: "/api/auth/hooks/send-email",

  // API — Commerce
  API_COMMERCE_CREDENTIALS: "/api/commerce/credentials",
  API_COMMERCE_PRODUCTS: "/api/commerce/products",
  API_COMMERCE_ORDERS: "/api/commerce/orders",
  API_COMMERCE_SUBSCRIPTIONS: "/api/commerce/subscriptions",
  API_COMMERCE_CUSTOMERS: "/api/commerce/customers",
  API_COMMERCE_CHECKOUT: "/api/commerce/checkout",
  API_COMMERCE_WEBHOOKS_CONFIG: "/api/commerce/webhooks/config",
} as const;

/**
 * Exact-match public routes (no auth required).
 *
 * IMPORTANT: "/" must use exact match — NOT prefix match — because
 * `pathname.startsWith("/")` would make every route public.
 */
export const PUBLIC_EXACT_ROUTES: readonly string[] = [
  ROUTES.HOME,                  // "/" landing
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.PRICING,
  ROUTES.SHOWCASE,
];

/**
 * Prefix-match public routes (no auth required).
 * Any pathname starting with one of these is public.
 */
export const PUBLIC_ROUTE_PREFIXES: readonly string[] = [
  "/legal",         // All legal pages
  "/api/auth",      // Supabase auth callbacks + hooks
];

/**
 * Check whether a pathname is publicly accessible (no auth required).
 *
 * @example
 *   isPublicRoute("/")                      // true (exact)
 *   isPublicRoute("/pricing")               // true (exact)
 *   isPublicRoute("/legal/terms")           // true (prefix)
 *   isPublicRoute("/api/auth/callback")     // true (prefix)
 *   isPublicRoute("/dashboard")             // false
 *   isPublicRoute("/api/commerce/orders")   // false
 */
export function isPublicRoute(pathname: string): boolean {
  // Exact match (important: "/" only matches "/", not "/anything")
  if (PUBLIC_EXACT_ROUTES.includes(pathname)) {
    return true;
  }
  // Prefix match
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
// Backward-compat alias
export type Route = RoutePath;