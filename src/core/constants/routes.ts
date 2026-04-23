/**
 * Centralized route constants.
 *
 * ⚠️  FILE INI REPLACE `src/core/constants/routes.ts` KAMU YANG LAMA.
 *     Perubahan:
 *       + API_AUTH_CONFIRM            (baru, untuk email OTP verification)
 *       + API_AUTH_CALLBACK           (baru, alias dari "/api/auth/callback")
 *       + API_AUTH_HOOKS_SEND_EMAIL   (baru, Supabase webhook endpoint)
 *     Semua existing constant tidak berubah.
 */

export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

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

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
// Backward-compat alias
export type Route = RoutePath;