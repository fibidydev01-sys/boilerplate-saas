"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
} from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/core/lib/validators";
import { ROUTES } from "@/core/constants";
import { t } from "@/core/i18n";

/**
 * ForgotPasswordForm — send reset password link via Supabase PKCE flow.
 *
 * Flow:
 *   1. User submit email → resetPasswordForEmail
 *   2. Supabase send email dengan link ke /api/auth/callback?code=X&next=/reset-password
 *   3. Callback route exchange code → establish recovery session → redirect /reset-password
 *   4. User set password baru
 *
 * IMPORTANT: redirectTo HARUS ke /api/auth/callback (bukan langsung ke
 * /reset-password). Dengan @supabase/ssr PKCE flow, email link kirim `code`
 * param yang harus di-exchange dulu via exchangeCodeForSession. Kalau
 * langsung ke /reset-password, session recovery gak ke-establish dan form-nya
 * stuck dengan pesan "Reset link is invalid or expired".
 *
 * Response: selalu success message (even kalau email gak terdaftar)
 * untuk cegah email enumeration attack.
 *
 * Brand identity ditampilkan di image panel kiri (auth layout 50/50).
 * Form card keep page-specific title untuk context halaman.
 */
export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // PKCE flow — lewat callback route biar exchangeCodeForSession bisa jalan.
      // next = /reset-password jadi callback tau ini recovery flow (skip
      // login log, langsung redirect ke form reset).
      const callbackUrl = new URL(
        "/api/auth/callback",
        window.location.origin
      );
      callbackUrl.searchParams.set("next", ROUTES.RESET_PASSWORD);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        { redirectTo: callbackUrl.toString() }
      );

      // Intentionally ignore error — show same success to prevent enumeration.
      // But log for debugging.
      if (resetError && process.env.NODE_ENV === "development") {
        console.warn("[forgot-password] non-fatal error:", resetError.message);
      }

      // Note: event "password_reset_requested" TIDAK di-log ke activity_logs
      // karena user anonymous (no session). Supabase audit log sudah handle.

      setSent(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(t("auth.genericError"));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-2 pb-4">
        <CardTitle className="text-2xl font-bold">
          {t("auth.forgotPasswordTitle")}
        </CardTitle>
        <CardDescription className="text-base">
          {t("auth.forgotPasswordSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {sent ? (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertDescription>{t("auth.forgotPasswordSent")}</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.emailLabel")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder={t("auth.emailPlaceholder")}
                          autoComplete="email"
                          disabled={isLoading}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.forgotPasswordSending")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("auth.forgotPasswordButton")}
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}

        <div className="text-center pt-2">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            {t("auth.backToLogin")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}