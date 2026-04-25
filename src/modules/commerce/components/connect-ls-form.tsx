"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Plug,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  lsApiKeySchema,
  type LSApiKeyInput,
  type LSApiKeyFormData,
} from "@/core/lib/validators";
import { useTranslation } from "@/core/i18n";
import type { CredentialStatus, LSErrorCode } from "../types";

interface ConnectLSFormProps {
  /**
   * Callback setelah connect berhasil. Parent bakal pake ini untuk
   * toggle state dari <ConnectForm /> ke <StatusCard />.
   */
  onConnected: (status: CredentialStatus) => void;
}

/**
 * Form untuk input API key Lemon Squeezy.
 *
 * Flow:
 *   1. User input key + (optional) toggle test mode
 *   2. Submit → POST /api/commerce/credentials
 *   3. Server: verify → encrypt → upsert → return status
 *   4. Success → onConnected(status) → parent switch ke StatusCard
 *
 * Form typing: pakai 3-generic useForm karena `isTestMode` punya
 * `.default(false)` di schema — input type (apa yang user ketik di
 * form state) ≠ output type (apa yang sampai ke handleSubmit). RHF v7+
 * butuh tau keduanya.
 */
export function ConnectLSForm({ onConnected }: ConnectLSFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const form = useForm<LSApiKeyInput, unknown, LSApiKeyFormData>({
    resolver: zodResolver(lsApiKeySchema),
    defaultValues: { apiKey: "", isTestMode: false },
  });

  /**
   * Map error code dari API → i18n message.
   *
   * Defined inside component (closure over hooked `t`) so the message
   * follows the active locale. Re-created on each render — fine for a
   * non-perf-critical mapping.
   */
  const mapErrorCode = (code: LSErrorCode): string => {
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
  };

  const onSubmit = async (data: LSApiKeyFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/commerce/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = (body.error as LSErrorCode) ?? "api_error";
        setError(mapErrorCode(errorCode));
        return;
      }

      const status = body.status as CredentialStatus;
      toast.success(
        t("commerce.connectSuccess", {
          storeName: status.storeName ?? t("commerce.providerName"),
        })
      );
      onConnected(status);
    } catch (err) {
      console.error("Connect LS error:", err);
      setError(t("commerce.errorNetwork"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">
              {t("commerce.connectTitle")}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("commerce.connectSubtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("commerce.apiKeyLabel")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder={t("commerce.apiKeyPlaceholder")}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={isLoading}
                        className="pl-10 pr-10 font-mono text-sm"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription className="flex items-start gap-1.5 text-xs">
                    <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>{t("commerce.apiKeyHint")}</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isTestMode"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel className="text-sm">
                      {t("commerce.testModeLabel")}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t("commerce.testModeDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("commerce.connectingButton")}
                </>
              ) : (
                <>
                  <Plug className="mr-2 h-4 w-4" />
                  {t("commerce.connectButton")}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}