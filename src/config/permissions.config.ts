/**
 * Permission Matrix — RBAC + wildcard.
 *
 * Source of truth untuk semua permission di sistem.
 *
 * Format key: "resource:action" atau "resource:sub:action".
 * Contoh: "admin:access", "users:read", "commerce:orders:*".
 *
 * Wildcard semantics:
 *   - "*"                 → super power (semua permission)
 *   - "users:*"           → semua action di resource "users"
 *   - "commerce:orders:*" → semua action di sub-resource "orders"
 *
 * Cara kerja `can(role, "users:read")`:
 *   1. Expand permission list dari role (dari matrix ini).
 *   2. Cek exact match ("users:read" === "users:read") → true.
 *   3. Cek global wildcard ("*" in list) → true.
 *   4. Cek segmented wildcard: "users:*" match "users:read",
 *       "commerce:*" match "commerce:orders:read", dst.
 *   5. Otherwise → false.
 *
 * Desain prinsip:
 *   - Matrix flat & readable. Bisa di-serialize, di-diff, di-audit.
 *   - Gak ada runtime compilation — permission check = string comparison.
 *   - Upgrade path ke ABAC nanti: tambah optional 3rd param (context) ke
 *     `can()` tanpa breaking existing call.
 *
 * Tambah permission baru?
 *   1. Tambah string key di role yang perlu (pakai wildcard kalau logis).
 *   2. Pakai di code: `can(role, "your:new:perm")`.
 *   3. Gak perlu migration DB — permission derived dari role.
 */

import type { UserRole } from "./app.config";

export const permissionMatrix: Record<UserRole, readonly string[]> = {
  // Super admin: bisa semua
  super_admin: ["*"],

  // Admin: akses panel + user & content management penuh
  admin: [
    "admin:access",
    "users:*",
    "content:*",
    "profile:read",
    "profile:write",
  ],

  // Editor: kelola content, read users
  editor: [
    "content:read",
    "content:write",
    "content:publish",
    "users:read",
    "profile:read",
    "profile:write",
  ],

  // Viewer: read-only
  viewer: [
    "content:read",
    "users:read",
    "profile:read",
    "profile:write",
  ],

  // User: cuma kelola profile sendiri
  user: [
    "profile:read",
    "profile:write",
  ],
} as const;

/**
 * Re-export as Permission type — nanti kalau mau enforce type-safe
 * permission keys, bisa union-type semua key di sini.
 *
 * Untuk sekarang masih `string` biar gampang extend per module.
 */
export type Permission = string;

export type PermissionMatrix = typeof permissionMatrix;
