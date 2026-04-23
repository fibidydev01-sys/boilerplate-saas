/**
 * Shared error code → HTTP status mapping.
 *
 * Dipake di semua route handler commerce biar konsisten:
 *   import { mapLSErrorToHttpStatus } from "@/modules/commerce/lib/error-mapping";
 *   return NextResponse.json({ error: code }, { status: mapLSErrorToHttpStatus(code) });
 */

import type { LSErrorCode } from "../types";

export function mapLSErrorToHttpStatus(
  code: LSErrorCode | string | undefined | null
): number {
  switch (code) {
    case "not_connected":
      return 409;
    case "not_found":
      return 404;
    case "invalid_credentials":
      return 401;
    case "forbidden":
      return 403;
    case "rate_limited":
      return 429;
    case "network_error":
      return 502;
    case "invalid_action":
    case "already_cancelled":
      return 400;
    case "decrypt_failed":
    case "save_failed":
      return 500;
    default:
      return 500;
  }
}