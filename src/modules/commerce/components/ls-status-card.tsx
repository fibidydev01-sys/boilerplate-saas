"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/core/components";
import {
  CheckCircle2,
  Key,
  Store,
  Clock,
  Loader2,
  Unplug,
  FlaskConical,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n";
import type { CredentialStatus } from "../types";

interface LSStatusCardProps {
  status: CredentialStatus;
  onDisconnected: () => void;
}

/**
 * Card yang nampilin status koneksi LS yang aktif.
 *
 * Data yang di-display semua safe:
 *   - storeName (dari verification call, public info)
 *   - keyHint (masked, e.g. "********xyz9")
 *   - isTestMode
 *   - lastVerifiedAt
 *
 * Action: disconnect (pake ConfirmDialog karena destructive).
 */
export function LSStatusCard({ status, onDisconnected }: LSStatusCardProps) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/commerce/credentials", {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error(t("commerce.errorSaveFailed"));
        return;
      }

      toast.success(t("commerce.disconnectSuccess"));
      setShowConfirm(false);
      onDisconnected();
    } catch (err) {
      console.error("Disconnect error:", err);
      toast.error(t("commerce.errorNetwork"));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const lastVerifiedLabel = status.lastVerifiedAt
    ? t("commerce.statusLastVerified", {
        time: formatRelativeTime(status.lastVerifiedAt),
      })
    : "";

  return (
    <>
      <Card className="w-full border-green-200 bg-green-50/30 dark:border-green-900/40 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">
                {t("commerce.statusConnectedTitle", {
                  storeName: status.storeName ?? t("commerce.providerName"),
                })}
              </CardTitle>
              <CardDescription className="mt-1">
                {t("commerce.statusConnectedSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Info rows */}
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoRow
              icon={Store}
              label={t("commerce.providerName")}
              value={status.storeName ?? "—"}
            />
            <InfoRow
              icon={Key}
              label={t("commerce.statusKeyLabel")}
              value={
                <code className="font-mono text-xs">
                  {status.keyHint ?? "—"}
                </code>
              }
            />
            <InfoRow
              icon={status.isTestMode ? FlaskConical : Zap}
              label={t("commerce.statusModeLabel")}
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    status.isTestMode
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  }`}
                >
                  {status.isTestMode
                    ? t("commerce.statusModeTest")
                    : t("commerce.statusModeLive")}
                </span>
              }
            />
            {lastVerifiedLabel && (
              <InfoRow
                icon={Clock}
                label=""
                value={
                  <span className="text-xs text-muted-foreground">
                    {lastVerifiedLabel}
                  </span>
                }
              />
            )}
          </div>

          {/* Disconnect button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={isDisconnecting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.disconnecting")}
                </>
              ) : (
                <>
                  <Unplug className="mr-2 h-4 w-4" />
                  {t("commerce.disconnectButton")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={t("commerce.disconnectConfirmTitle")}
        description={t("commerce.disconnectConfirmDescription")}
        confirmLabel={t("commerce.disconnectButton")}
        variant="destructive"
        isLoading={isDisconnecting}
        onConfirm={handleDisconnect}
      />
    </>
  );
}

// --------------------------------------------------------------------
// Subcomponents
// --------------------------------------------------------------------

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border border-border/60">
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        )}
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

/**
 * Format ISO timestamp jadi "2 hours ago" / "just now" / "3 days ago".
 *
 * Intentionally lightweight — gak pake date-fns buat hindari deps
 * tambahan. Cukup untuk "last verified" badge.
 */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} min${m > 1 ? "s" : ""} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} hour${h > 1 ? "s" : ""} ago`;
  }
  if (diffSec < 2592000) {
    const d = Math.floor(diffSec / 86400);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  }

  // Fallback to locale date
  return new Date(iso).toLocaleDateString();
}
