import { ResetPasswordForm } from "@/core/auth";
import { t } from "@/core/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: t("auth.resetPasswordTitle"),
  description: t("auth.resetPasswordSubtitle"),
};

/**
 * Reset password page.
 *
 * NOTE: TIDAK ada auth guard di sini. User akses halaman ini via magic
 * link dari email — session recovery-nya di-establish Supabase sebagai
 * bagian dari flow reset. Kalau session udah proper user session (bukan
 * recovery), ResetPasswordForm sendiri akan tetep show form biar user
 * bisa tetep ganti password. Validasi session di-handle di client.
 */
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
