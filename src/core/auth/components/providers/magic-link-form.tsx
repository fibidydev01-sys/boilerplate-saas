"use client";

import { useState } from "react";
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
  Mail,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import { magicLinkSchema, type MagicLinkFormData } from "@/core/lib/validators";
import { appConfig } from "@/config";
import { useTranslation } from "@/core/i18n";

interface MagicLinkFormProps {
  returnTo?: string | null;
  /**
   * Mode form — default: "login".
   *
   * - "login"   : derive shouldCreateUser dari appConfig.auth.magicLinkMode
   * - "register": force shouldCreateUser = true (user baru)
   *
   * Dipake di register page untuk memastikan user bisa signup via magic link
   * meskipun config global-nya "login-only".
   */
  mode?: "login" | "register";
}

export function MagicLinkForm({ returnTo, mode = "login" }: MagicLinkFormProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  // Derive shouldCreateUser dari config + mode override
  const shouldCreateUser =
    mode === "register" ||
    appConfig.auth.magicLinkMode === "login-or-signup";

  const onSubmit = async (data: MagicLinkFormData) => {
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

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          shouldCreateUser,
        },
      });

      if (otpError) {
        setError(otpError.message);
        setIsLoading(false);
        return;
      }

      // Note: "magic link sent" event TIDAK di-log via activity_logs karena
      // session belum ada (anonymous). Supabase audit log sudah track ini.
      // "user.login" akan di-log di callback route setelah user klik link.

      setSent(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Magic link error:", err);
      setError(t("auth.genericError"));
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-900">
        <CheckCircle2 className="h-4 w-4 text-green-700" />
        <AlertDescription>{t("auth.magicLinkSent")}</AlertDescription>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.sendingMagicLink")}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t("auth.sendMagicLink")}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}