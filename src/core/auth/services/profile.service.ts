/**
 * Profile Service — centralize semua DB call ke `user_profiles`.
 *
 * Ekstraksi dari auth-store biar:
 *   - DB logic bisa di-test tanpa Zustand
 *   - Server component bisa fetch profile tanpa bikin store
 *   - Gampang extend (tambah cache layer, activity log, dst)
 *
 * Semua function accept `supabase` client sebagai parameter. Caller yang
 * decide pake browser client atau server client. Ini kunci biar service
 * bisa dipake di mana aja tanpa duplikasi.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  UserProfile,
  UserProfileUpdate,
  Json,
} from "@/core/types";

type Client = SupabaseClient<Database>;

export interface FetchProfileResult {
  profile: UserProfile | null;
  error: Error | null;
}

/**
 * Fetch active user profile by auth user ID.
 */
export async function fetchActiveProfile(
  supabase: Client,
  userId: string
): Promise<FetchProfileResult> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { profile: null, error: new Error(error.message) };
  }

  return { profile: (data as UserProfile | null) ?? null, error: null };
}

/**
 * Verify profile exist untuk auth user — tanpa memaksa is_active.
 * Dipake di login flow untuk bedain error type.
 */
export interface VerifyProfileResult {
  exists: boolean;
  isActive: boolean;
  role: string | null;
  error: Error | null;
}

export async function verifyProfile(
  supabase: Client,
  userId: string
): Promise<VerifyProfileResult> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      exists: false,
      isActive: false,
      role: null,
      error: new Error(error.message),
    };
  }

  if (!data) {
    return { exists: false, isActive: false, role: null, error: null };
  }

  return {
    exists: true,
    isActive: !!data.is_active,
    role: data.role ?? null,
    error: null,
  };
}

// --------------------------------------------------------------------
// Mutations
// --------------------------------------------------------------------

export interface UpdateProfileResult {
  profile: UserProfile | null;
  error: Error | null;
}

/**
 * Update profile. RLS memastikan user cuma bisa update sendiri
 * (kecuali admin).
 */
export async function updateProfile(
  supabase: Client,
  userId: string,
  patch: Partial<Omit<UserProfileUpdate, "id">>
): Promise<UpdateProfileResult> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    return { profile: null, error: new Error(error.message) };
  }
  return { profile: data as UserProfile, error: null };
}

/**
 * Merge patch ke metadata field. Pattern umum: nested module-scoped data.
 *
 * @example
 *   await mergeProfileMetadata(supabase, userId, "commerce", {
 *     shipping_addresses: [...]
 *   });
 *   // Hasil:
 *   // metadata = {
 *   //   ...existing,
 *   //   commerce: { ...existing.commerce, shipping_addresses: [...] }
 *   // }
 */
export async function mergeProfileMetadata(
  supabase: Client,
  userId: string,
  namespace: string,
  patch: Record<string, unknown>
): Promise<UpdateProfileResult> {
  // Fetch current metadata
  const { data: current, error: fetchErr } = await supabase
    .from("user_profiles")
    .select("metadata")
    .eq("id", userId)
    .single();

  if (fetchErr) {
    return { profile: null, error: new Error(fetchErr.message) };
  }

  const currentMeta = (current?.metadata ?? {}) as Record<string, unknown>;
  const currentNs = (currentMeta[namespace] ?? {}) as Record<string, unknown>;

  const nextMetadata = {
    ...currentMeta,
    [namespace]: {
      ...currentNs,
      ...patch,
    },
  } as Json;

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ metadata: nextMetadata })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    return { profile: null, error: new Error(error.message) };
  }
  return { profile: data as UserProfile, error: null };
}
