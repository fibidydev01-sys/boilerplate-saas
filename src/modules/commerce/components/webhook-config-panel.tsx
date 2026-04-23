"use client";

/**
 * WebhookConfigPanel — setup & management webhook config.
 *
 * UI states:
 *   - Not connected: [Generate] button
 *   - Just provisioned (revealSecret=true): show plaintext secret ONCE
 *     dengan warning "copy now, gak bisa diliat lagi"
 *   - Connected: URL + hint + [Regenerate], [Delete] buttons
 */

import { useEffect, useState } from "react";
import {
  Webhook,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "@/core/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/core/components";
import type { WebhookConfig } from "../types";
import { formatDateTime } from "../lib/format";

export function WebhookConfigPanel() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/commerce/webhooks/config");
      if (res.ok) {
        const body = await res.json();
        setConfig(body.config);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleProvision() {
    setProvisioning(true);
    try {
      const res = await fetch("/api/commerce/webhooks/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revealSecret: true }),
      });
      if (res.ok) {
        const body = (await res.json()) as {
          config: WebhookConfig;
          secret?: string;
        };
        setConfig(body.config);
        if (body.secret) {
          setRevealedSecret(body.secret);
          setShowSecret(true);
        }
      }
    } finally {
      setProvisioning(false);
      setConfirmRegenerate(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch("/api/commerce/webhooks/config", {
        method: "DELETE",
      });
      if (res.ok) {
        setConfig(null);
        setRevealedSecret(null);
      }
    } finally {
      setConfirmDelete(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => { });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  // Not connected — show generate button
  if (!config?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {t("commerce.webhooks.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("commerce.webhooks.notConnectedDescription")}
          </p>
          <Button onClick={handleProvision} disabled={provisioning}>
            <Webhook className="h-4 w-4 mr-2" />
            {provisioning
              ? t("commerce.webhooks.generating")
              : t("commerce.webhooks.generate")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Connected
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {t("commerce.webhooks.connectedTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Secret reveal (post-provision only) */}
          {revealedSecret && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  {t("commerce.webhooks.secretRevealWarningTitle")}
                </p>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {t("commerce.webhooks.secretRevealWarning")}
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showSecret ? "text" : "password"}
                  value={revealedSecret}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(revealedSecret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <Label>{t("commerce.webhooks.urlLabel")}</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={config.webhookUrl ?? ""}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.webhookUrl ?? "")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("commerce.webhooks.urlHelp")}
            </p>
          </div>

          {/* Secret hint */}
          {!revealedSecret && (
            <div className="space-y-1.5">
              <Label>{t("commerce.webhooks.secretLabel")}</Label>
              <Input
                readOnly
                value={config.secretHint ?? ""}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                {t("commerce.webhooks.secretHintHelp")}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("commerce.webhooks.subscribedEvents")}
              </Label>
              <p className="text-sm font-medium">
                {config.subscribedEvents.length}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("commerce.webhooks.lastEvent")}
              </Label>
              <p className="text-sm">
                {config.lastEventAt
                  ? formatDateTime(config.lastEventAt)
                  : t("commerce.webhooks.noEventsYet")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRegenerate(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("commerce.webhooks.regenerate")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("commerce.webhooks.delete")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title={t("commerce.webhooks.confirmRegenerate.title")}
        description={t("commerce.webhooks.confirmRegenerate.description")}
        confirmText={t("commerce.webhooks.regenerate")}
        variant="destructive"
        onConfirm={handleProvision}
        loading={provisioning}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("commerce.webhooks.confirmDelete.title")}
        description={t("commerce.webhooks.confirmDelete.description")}
        confirmText={t("common.delete")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}