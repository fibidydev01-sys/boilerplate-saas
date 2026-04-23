"use client";

/**
 * CheckoutButton — klik → generate checkout URL via API → redirect / open.
 *
 * Usage:
 *   <CheckoutButton variantId="12345" email="user@example.com" />
 *   <CheckoutButton variantId="12345" openInNewTab />
 *   <CheckoutButton variantId="12345" customData={{ user_id: "abc" }}
 *                   redirectUrl="https://myapp.com/thanks" />
 */

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n";
import { Button } from "@/components/ui/button";
import type { CreateCheckoutInput } from "../types";

interface CheckoutButtonProps extends Omit<CreateCheckoutInput, "variantId"> {
  variantId: string;
  openInNewTab?: boolean;
  children?: React.ReactNode;
  variant?:
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CheckoutButton({
  variantId,
  openInNewTab = false,
  children,
  variant = "default",
  size = "default",
  className,
  ...checkoutInput
}: CheckoutButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, ...checkoutInput }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }

      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      if (!checkoutUrl) {
        setError("no_url_returned");
        return;
      }

      if (openInNewTab) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        {children ?? t("commerce.checkout.buy")}
      </Button>
      {error && (
        <p className="text-xs text-destructive">
          {t("commerce.checkout.error", { error })}
        </p>
      )}
    </div>
  );
}