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
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import { useAuthStore } from "@/core/auth/store";
import {
  verifyProfile,
  logActivity,
  ActivityAction,
} from "@/core/auth/services";
import { loginSchema, type LoginFormData } from "@/core/lib/validators";
import { resolvePostLoginRedirect } from "@/config";
import { useTranslation } from "@/core/i18n";

interface EmailPasswordFormProps {
  /**
   * returnTo param dari URL — kalau ada & safe, prioritas di atas role-based.
   */
  returnTo?: string | null;
}

export function EmailPasswordForm({ returnTo }: EmailPasswordFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        setError(
          authError.message.includes("Invalid login")
            ? t("auth.invalidCredentials")
            : authError.message
        );
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError(t("auth.loginFailed"));
        setIsLoading(false);
        return;
      }

      // Verify via profile service — delegated from inline query
      const verification = await verifyProfile(supabase, authData.user.id);

      if (verification.error || !verification.exists) {
        await supabase.auth.signOut();
        setError(t("auth.accountNotRegistered"));
        setIsLoading(false);
        return;
      }

      if (!verification.isActive) {
        await supabase.auth.signOut();
        setError(t("auth.accountDeactivated"));
        setIsLoading(false);
        return;
      }

      // Log activity — fire-and-forget, don't block redirect
      void logActivity(supabase, {
        action: ActivityAction.UserLogin,
        metadata: { provider: "email" },
      });

      // Reset store → trigger fresh fetch di dashboard layout
      useAuthStore.setState({
        hasFetched: false,
        isLoading: false,
        fetchPromise: null,
      });

      // Role-aware redirect (returnTo > role > global fallback)
      const dest = resolvePostLoginRedirect(
        verification.role ?? undefined,
        returnTo
      );
      router.push(dest);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError(t("auth.genericError"));
      setIsLoading(false);
    }
  };

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
                    autoComplete="current-password"
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.loggingIn")}
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              {t("auth.signInWithEmail")}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}