/**
 * @/core/lib — utility barrel.
 *
 * Supabase clients diimport langsung (tidak diekspor di sini) agar tree-shake
 * tepat — kadang server-only, kadang browser-only.
 */

export { cn, getInitials } from "./utils";
export { loginSchema, type LoginFormData } from "./validators";
