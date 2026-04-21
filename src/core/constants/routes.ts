export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  OVERVIEW: "/overview",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
