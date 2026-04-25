import { ResetPasswordForm } from "@/core/auth";
import { t } from "@/core/i18n";
import { getServerLocale } from "@/core/i18n/get-locale";
import type { Metadata } from "next";

/**
 * Dynamic metadata — resolves locale from cookie at request time so the
 * browser tab title follows the user's selected language.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("auth.resetPasswordTitle", undefined, locale),
    description: t("auth.resetPasswordSubtitle", undefined, locale),
  };
}

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
