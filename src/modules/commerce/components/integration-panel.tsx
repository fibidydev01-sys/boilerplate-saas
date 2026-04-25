"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n";
import { ConnectLSForm } from "./connect-ls-form";
import { LSStatusCard } from "./ls-status-card";
import type { CredentialStatus } from "../types";

/**
 * IntegrationPanel — wrapper yang fetch status awal & switch antara
 * ConnectLSForm (belum connect) dan LSStatusCard (udah connect).
 *
 * Fetch status dari GET /api/commerce/credentials saat mount.
 * Passing onConnected / onDisconnected sebagai callback ke child
 * supaya state sync tanpa refetch.
 */
export function IntegrationPanel() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/commerce/credentials");
      if (res.ok) {
        const body = await res.json();
        setStatus(body.status as CredentialStatus);
      } else {
        setStatus({
          connected: false,
          keyHint: null,
          storeId: null,
          storeName: null,
          isTestMode: false,
          lastVerifiedAt: null,
        });
      }
    } catch (err) {
      console.error("Fetch status error:", err);
      setStatus({
        connected: false,
        keyHint: null,
        storeId: null,
        storeName: null,
        isTestMode: false,
        lastVerifiedAt: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (isLoading || !status) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status.connected) {
    return (
      <LSStatusCard
        status={status}
        onDisconnected={() =>
          setStatus({
            connected: false,
            keyHint: null,
            storeId: null,
            storeName: null,
            isTestMode: false,
            lastVerifiedAt: null,
          })
        }
      />
    );
  }

  return <ConnectLSForm onConnected={(s) => setStatus(s)} />;
}
