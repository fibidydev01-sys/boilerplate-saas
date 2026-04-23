/**
 * Commerce Credentials Service.
 *
 * Server-only: deal dengan encrypted API keys. Akses ENCRYPTION_KEY dari env.
 *
 * Semua function terima `supabase` client sebagai parameter. Caller harus
 * pake supabase server client (dari `@/core/lib/supabase/server`) — client
 * browser gak akan bisa akses encrypted_api_key karena:
 *   1. RLS cuma return row kalau auth.uid() = owner_user_id
 *   2. Decrypt butuh ENCRYPTION_KEY yang cuma ada di server env
 *
 * Security notes:
 *   - API key plaintext JANGAN pernah di-return ke client
 *   - Cuma `key_hint` (partial) yang safe untuk display
 *   - `CredentialStatus` adalah shape yang aman di-serialize ke client
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types";
import { encrypt, decrypt, getKeyHint } from "@/core/lib/encryption";
import { lsApi, LSClientError } from "../lib/ls-client";
import type {
  CredentialStatus,
  VerifyCredentialResult,
  SaveCredentialResult,
  DeleteCredentialResult,
  LSErrorCode,
} from "../types";

type Client = SupabaseClient<Database>;

const PROVIDER = "lemonsqueezy" as const;

// ====================================================================
// Verify
// ====================================================================

/**
 * Verify API key via LS /users/me + /stores.
 * Return store info kalau berhasil.
 *
 * Strategy: call /users/me dulu untuk cek auth, baru /stores untuk info.
 * Kalau /users/me fail, /stores juga akan fail — tapi error code dari
 * /users/me lebih akurat (401 vs 403).
 */
export async function verifyCredential(
  apiKey: string
): Promise<VerifyCredentialResult> {
  try {
    await lsApi.getMe(apiKey);
  } catch (err) {
    if (err instanceof LSClientError) {
      return { valid: false, errorCode: err.code };
    }
    return { valid: false, errorCode: "network_error" };
  }

  // Auth OK, now fetch store info (best effort — non-fatal)
  try {
    const stores = await lsApi.listStores(apiKey);
    const firstStore = stores.data?.[0];
    return {
      valid: true,
      storeId: firstStore?.id,
      storeName: firstStore?.attributes?.name,
    };
  } catch {
    // API key valid tapi store fetch fail — tetap return valid
    return { valid: true };
  }
}

// ====================================================================
// Save
// ====================================================================

export interface SaveCredentialInput {
  userId: string;
  apiKey: string;
  isTestMode?: boolean;
}

/**
 * Save credential — verify dulu, baru encrypt & upsert.
 *
 * Upsert by (owner_user_id, provider) — sesuai UNIQUE constraint di DB.
 * Existing credential akan di-overwrite.
 */
export async function saveCredential(
  supabase: Client,
  input: SaveCredentialInput
): Promise<SaveCredentialResult> {
  // 1. Verify first
  const verification = await verifyCredential(input.apiKey);
  if (!verification.valid) {
    return { success: false, errorCode: verification.errorCode };
  }

  // 2. Encrypt & upsert
  let encrypted: string;
  try {
    encrypted = encrypt(input.apiKey);
  } catch (err) {
    console.error("[saveCredential] encrypt failed:", err);
    return { success: false, errorCode: "save_failed" };
  }

  const keyHint = getKeyHint(input.apiKey);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("commerce_credentials")
    .upsert(
      {
        owner_user_id: input.userId,
        provider: PROVIDER,
        encrypted_api_key: encrypted,
        key_hint: keyHint,
        store_id: verification.storeId ?? null,
        store_name: verification.storeName ?? null,
        is_test_mode: input.isTestMode ?? false,
        last_verified_at: now,
      },
      { onConflict: "owner_user_id,provider" }
    );

  if (error) {
    console.error("[saveCredential] upsert failed:", error.message);
    return { success: false, errorCode: "save_failed" };
  }

  return {
    success: true,
    status: {
      connected: true,
      keyHint,
      storeId: verification.storeId ?? null,
      storeName: verification.storeName ?? null,
      isTestMode: input.isTestMode ?? false,
      lastVerifiedAt: now,
    },
  };
}

// ====================================================================
// Read (safe for client)
// ====================================================================

/**
 * Get credential status (safe untuk return ke client).
 * Tidak return plaintext/encrypted API key.
 */
export async function getCredentialStatus(
  supabase: Client,
  userId: string
): Promise<CredentialStatus> {
  const { data, error } = await supabase
    .from("commerce_credentials")
    .select("key_hint, store_id, store_name, is_test_mode, last_verified_at")
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error || !data) {
    return {
      connected: false,
      keyHint: null,
      storeId: null,
      storeName: null,
      isTestMode: false,
      lastVerifiedAt: null,
    };
  }

  return {
    connected: true,
    keyHint: data.key_hint,
    storeId: data.store_id,
    storeName: data.store_name,
    isTestMode: data.is_test_mode,
    lastVerifiedAt: data.last_verified_at,
  };
}

// ====================================================================
// Read (server-only, dangerous)
// ====================================================================

/**
 * Get decrypted API key — SERVER-ONLY, untuk pemanggilan LS API.
 *
 * NEVER call this dari context yang bisa leak ke client response body.
 * Usage pattern: route handler → getApiKeyForUser → lsApi.* → transform →
 * return transformed data (bukan API key).
 *
 * @returns Plaintext API key, atau null kalau:
 *   - User belum connect
 *   - Decrypt fail (corrupted / key rotation)
 */
export async function getApiKeyForUser(
  supabase: Client,
  userId: string
): Promise<{ apiKey: string | null; errorCode?: LSErrorCode }> {
  const { data, error } = await supabase
    .from("commerce_credentials")
    .select("encrypted_api_key")
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error) {
    console.error("[getApiKeyForUser] query failed:", error.message);
    return { apiKey: null, errorCode: "save_failed" };
  }

  if (!data) {
    return { apiKey: null, errorCode: "not_connected" };
  }

  try {
    const apiKey = decrypt(data.encrypted_api_key);
    return { apiKey };
  } catch (err) {
    console.error("[getApiKeyForUser] decrypt failed:", err);
    return { apiKey: null, errorCode: "decrypt_failed" };
  }
}

/**
 * Update `last_used_at` timestamp — fire-and-forget, non-critical.
 */
export async function touchLastUsed(
  supabase: Client,
  userId: string
): Promise<void> {
  await supabase
    .from("commerce_credentials")
    .update({ last_used_at: new Date().toISOString() })
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER);
}

// ====================================================================
// Delete
// ====================================================================

export async function deleteCredential(
  supabase: Client,
  userId: string
): Promise<DeleteCredentialResult> {
  const { error } = await supabase
    .from("commerce_credentials")
    .delete()
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER);

  if (error) {
    console.error("[deleteCredential] failed:", error.message);
    return { success: false, errorCode: "save_failed" };
  }

  return { success: true };
}
