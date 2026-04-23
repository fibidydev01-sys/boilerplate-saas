/**
 * Shared LS error code → i18n message mapping.
 *
 * Dipake di component yang call commerce API (connect form, products grid,
 * dst) biar gak copas logic mapping di tiap file.
 */

import { t } from "@/core/i18n";
import type { LSErrorCode } from "../types";

export function mapLSErrorToMessage(code: LSErrorCode | string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return t("commerce.errorInvalidCredentials");
    case "rate_limited":
      return t("commerce.errorRateLimited");
    case "forbidden":
      return t("commerce.errorForbidden");
    case "network_error":
      return t("commerce.errorNetwork");
    case "save_failed":
      return t("commerce.errorSaveFailed");
    case "decrypt_failed":
      return t("commerce.errorDecryptFailed");
    case "not_connected":
      return t("commerce.errorNotConnected");
    default:
      return t("commerce.errorApiGeneric");
  }
}