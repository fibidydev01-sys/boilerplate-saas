"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  PackageOpen,
  Plug,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ROUTES } from "@/core/constants";
import { useTranslation } from "@/core/i18n";
import { ProductCard } from "./product-card";
import type { Product, LSErrorCode } from "../types";

type FetchState =
  | { kind: "loading" }
  | { kind: "not-connected" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "loaded"; products: Product[] };

/**
 * Products grid — self-contained.
 *
 * Handles 5 states: loading, not-connected, error, empty, loaded.
 * Uses fetch pattern langsung (tanpa SWR/react-query) untuk hindari
 * extra deps — sudah cukup untuk single-fetch use case.
 */
export function ProductsGrid() {
  const { t } = useTranslation();
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  /**
   * Map error code dari API → i18n message.
   *
   * Defined inside component (closure over hooked `t`) so messages follow
   * active locale. Re-created per render — fine for non-perf-critical
   * mapping called only on error paths.
   */
  const mapErrorCode = useCallback(
    (code: LSErrorCode): string => {
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
    },
    [t]
  );

  const fetchProducts = useCallback(async () => {
    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/commerce/products");
      const body = await res.json().catch(() => ({}));

      if (res.status === 409 || body.error === "not_connected") {
        setState({ kind: "not-connected" });
        return;
      }

      if (!res.ok) {
        const code = (body.error as LSErrorCode) ?? "api_error";
        setState({ kind: "error", message: mapErrorCode(code) });
        return;
      }

      const products = (body.products as Product[]) ?? [];
      if (products.length === 0) {
        setState({ kind: "empty" });
        return;
      }

      setState({ kind: "loaded", products });
    } catch (err) {
      console.error("Fetch products error:", err);
      setState({ kind: "error", message: t("commerce.errorNetwork") });
    }
  }, [mapErrorCode, t]);

  /**
   * Initial fetch on mount.
   *
   * Defer via `Promise.resolve().then(...)` so the `setState({ kind: "loading" })`
   * at the top of `fetchProducts` runs from a microtask, not synchronously
   * inside the effect body. Avoids the React 19 lint rule
   * `react-hooks/set-state-in-effect`. Same pattern as offline-detector.tsx.
   */
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchProducts();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProducts]);

  // --- Loading ---
  if (state.kind === "loading") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">
            {t("commerce.productsLoading")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // --- Not connected ---
  if (state.kind === "not-connected") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Plug className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1 max-w-sm">
            <p className="font-semibold">
              {t("commerce.productsNotConnectedTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("commerce.productsNotConnectedSubtitle")}
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTES.SETTINGS_INTEGRATIONS}>
              <Plug className="mr-2 h-4 w-4" />
              {t("commerce.productsConnectCta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Error ---
  if (state.kind === "error") {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProducts}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  // --- Empty ---
  if (state.kind === "empty") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <PackageOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1 max-w-sm">
            <p className="font-semibold">
              {t("commerce.productsEmptyTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("commerce.productsEmptySubtitle")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("commerce.productsRefresh")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Loaded ---
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {state.products.length}{" "}
          <Package className="inline h-3 w-3 -mt-0.5" />
        </p>
        <Button variant="ghost" size="sm" onClick={fetchProducts}>
          <RefreshCw className="mr-2 h-3 w-3" />
          {t("commerce.productsRefresh")}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {state.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}