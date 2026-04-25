"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import { logActivity, ActivityAction } from "@/core/auth/services";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/core/lib/validators";
import { appConfig } from "@/config";
import { ROUTES } from "@/core/constants";
import { t } from "@/core/i18n";

/**
 * ResetPasswordForm — halaman post-click email link.
 *
 * Supabase behavior: ketika user klik reset link, mereka dibawa ke
 * /api/auth/callback yang exchange code → establish recovery session →
 * redirect ke sini. Session recovery-nya ter-establish, kita bisa langsung
 * update password via updateUser.
 *
 * Validation: kita cek session ada dulu sebelum enable form. Kalau
 * link udah expired / callback gagal, session gak akan ter-set.
 *
 * Brand identity ditampilkan di image panel kiri (auth layout 50/50).
 * Form card keep page-specific title untuk context halaman.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Check if recovery session exists
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
    };
    checkSession();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Log password reset success — fire-and-forget
      void logActivity(supabase, {
        action: ActivityAction.UserPasswordResetCompleted,
      });

      setSuccess(true);
      setIsLoading(false);

      // Redirect setelah 1.5 detik biar user liat success message
      setTimeout(() => {
        router.push(appConfig.auth.postLoginRedirect);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(t("auth.genericError"));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-2 pb-4">
        <CardTitle className="text-2xl font-bold">
          {t("auth.resetPasswordTitle")}
        </CardTitle>
        <CardDescription className="text-base">
          {t("auth.resetPasswordSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasSession === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("auth.resetPasswordInvalidSession")}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertDescription>
              {t("auth.resetPasswordSuccess")}
            </AlertDescription>
          </Alert>
        )}

        {!success && hasSession !== false && (
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.passwordLabel")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.passwordPlaceholder")}
                          autoComplete="new-password"
                          disabled={isLoading || hasSession !== true}
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPasswordLabel")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder={t("auth.confirmPasswordPlaceholder")}
                          autoComplete="new-password"
                          disabled={isLoading || hasSession !== true}
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || hasSession !== true}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.resetPasswordUpdating")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("auth.resetPasswordButton")}
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