"use client";

import { type ReactNode } from "react";

/**
 * AuthProvider — placeholder shell.
 *
 * Saat ini boiler auth listener ada di DashboardLayout (SIGNED_IN / SIGNED_OUT).
 * Provider ini tetap dipasang di root layout biar arsitektur konsisten &
 * siap extend nanti (misal: global session event bus, telemetry, dll).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
