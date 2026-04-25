"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import { useAuthStore } from "@/core/auth/store";
import { logActivity, ActivityAction } from "@/core/auth/services";
import { registerSchema, type RegisterFormData } from "@/core/lib/validators";
import { appConfig, resolvePostLoginRedirect } from "@/config";
import { useTranslation } from "@/core/i18n";

interface EmailPasswordRegisterFormProps {
  returnTo?: string | null;
}

/**
 * Email+password signup form.
 *
 * Flow:
 *   1. User submit → supabase.auth.signUp dengan full_name di metadata
 *   2. DB trigger handle_new_user auto-create user_profiles row
 *   3. Kalau requireEmailVerification = false → session ter-set langsung
 *      → log signup + auto-login redirect ke dashboard
 *   4. Kalau requireEmailVerification = true → show "check your email".
 *      Signup NOT logged di sini — session belum ada, RLS block insert.
 *      User yang verify email → callback route yang log "user.login".
 */
export function EmailPasswordRegisterForm({
  returnTo,
}: EmailPasswordRegisterFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const callbackUrl = new URL(
        "/api/auth/callback",
        window.location.origin
      );
      if (returnTo) {
        callbackUrl.searchParams.set("next", returnTo);
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
            },
            emailRedirectTo: callbackUrl.toString(),
          },
        }
      );

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("already exists")
        ) {
          setError(t("auth.emailAlreadyRegistered"));
        } else if (
          signUpError.message.toLowerCase().includes("weak password")
        ) {
          setError(t("auth.weakPassword"));
        } else {
          setError(signUpError.message);
        }
        setIsLoading(false);
        return;
      }

      // Verify-required flow: Supabase return user tanpa session.
      // Skip activity log — session belum ada, RLS akan block insert.
      // Log "user.login" akan jalan di callback route setelah user verify email.
      if (!authData.session) {
        setVerificationNeeded(true);
        setIsLoading(false);
        return;
      }

      // Auto-login flow: session exists → log signup + redirect
      void logActivity(supabase, {
        action: ActivityAction.UserSignup,
        userId: authData.user?.id,
        metadata: { provider: "email", autoLogin: true },
      });

      useAuthStore.setState({
        hasFetched: false,
        isLoading: false,
        fetchPromise: null,
      });

      const dest = resolvePostLoginRedirect(
        appConfig.auth.defaultRole,
        returnTo
      );
      router.push(dest);
      router.refresh();
    } catch (err) {
      console.error("Register error:", err);
      setError(t("auth.genericError"));
      setIsLoading(false);
    }
  };

  if (verificationNeeded) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-900">
        <CheckCircle2 className="h-4 w-4 text-green-700" />
        <AlertDescription>
          {t("auth.registerSuccessVerify")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.fullNameLabel")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("auth.fullNamePlaceholder")}
                    autoComplete="name"
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
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
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
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.registering")}
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("auth.signUpWithEmail")}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}