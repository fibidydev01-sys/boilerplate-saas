/**
 * Shared UI primitives (non-shadcn, app-agnostic).
 *
 * Rule: component di sini TIDAK boleh tergantung module apapun.
 * Boleh depend ke: @/core/lib, @/core/i18n, @/config, @/components/ui (shadcn).
 */

export { LoadingSpinner, FullPageLoader } from "./loading-spinner";
export { ConfirmDialog } from "./confirm-dialog";
export { OfflineDetector } from "./offline-detector";
export { ServiceWorkerRegister } from "./sw-register";