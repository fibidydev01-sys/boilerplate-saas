/**
 * Supabase clients.
 *
 * - client.ts  → browser (Client Component)
 * - server.ts  → RSC / Route Handler / Server Action
 * - proxy.ts   → Next.js middleware (SSR session refresh)
 *
 * Import pakai file path langsung supaya tree-shake benar, misal:
 *   import { createClient } from "@/core/lib/supabase/client";
 */
