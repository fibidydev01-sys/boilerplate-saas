"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, MoreVertical } from "lucide-react";
import { useTranslation } from "@/core/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/core/components";
import type { Subscription, SubscriptionAction } from "../types";
import {
  formatDate,
  subscriptionStatusVariant,
} from "../lib/format";

type State =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; error: string }
  | { kind: "not_connected" }
  | { kind: "loaded"; subscriptions: Subscription[]; count: number };

const STATUS_OPTIONS = [
  { value: "all", labelKey: "commerce.subscriptions.status.all" },
  { value: "active", labelKey: "commerce.subscriptions.status.active" },
  { value: "on_trial", labelKey: "commerce.subscriptions.status.on_trial" },
  { value: "paused", labelKey: "commerce.subscriptions.status.paused" },
  { value: "past_due", labelKey: "commerce.subscriptions.status.past_due" },
  { value: "cancelled", labelKey: "commerce.subscriptions.status.cancelled" },
  { value: "expired", labelKey: "commerce.subscriptions.status.expired" },
];

export function SubscriptionsTable() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [status, setStatus] = useState("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    sub: Subscription;
    action: SubscriptionAction;
  } | null>(null);
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") params.set("status", status);
      if (emailFilter.trim()) params.set("email", emailFilter.trim());

      const res = await fetch(`/api/commerce/subscriptions?${params.toString()}`);
      if (res.status === 409) {
        setState({ kind: "not_connected" });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          error: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }

      const { subscriptions, count } = (await res.json()) as {
        subscriptions: Subscription[];
        count: number;
      };

      if (subscriptions.length === 0) setState({ kind: "empty" });
      else setState({ kind: "loaded", subscriptions, count });
    } catch (err) {
      setState({
        kind: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [status, emailFilter]);

  /**
   * Defer initial/filter-triggered load to a microtask so the
   * `setState({ kind: "loading" })` at the top of `load` runs from a
   * promise callback, not synchronously inside the effect body.
   * Avoids React 19 lint rule `react-hooks/set-state-in-effect`.
   */
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/commerce/subscriptions?pages=3", {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setSyncing(false);
    }
  }

  async function executeAction() {
    if (!confirmAction) return;
    setActioning(true);
    try {
      const res = await fetch(
        `/api/commerce/subscriptions/${confirmAction.sub.providerSubscriptionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: confirmAction.action }),
        }
      );
      if (res.ok) {
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? `Action failed HTTP ${res.status}`);
      }
    } finally {
      setActioning(false);
      setConfirmAction(null);
    }
  }

  const actionLabels: Record<SubscriptionAction, { title: string; desc: string }> = {
    pause: {
      title: t("commerce.subscriptions.confirmPause.title"),
      desc: t("commerce.subscriptions.confirmPause.description"),
    },
    resume: {
      title: t("commerce.subscriptions.confirmResume.title"),
      desc: t("commerce.subscriptions.confirmResume.description"),
    },
    cancel: {
      title: t("commerce.subscriptions.confirmCancel.title"),
      desc: t("commerce.subscriptions.confirmCancel.description"),
    },
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("commerce.subscriptions.filterEmail")}
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing
            ? t("commerce.subscriptions.syncing")
            : t("commerce.subscriptions.sync")}
        </Button>
      </div>

      {/* Body */}
      {state.kind === "loading" && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      )}

      {state.kind === "not_connected" && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t("commerce.common.notConnected")}
        </div>
      )}

      {state.kind === "error" && (
        <div className="py-16 text-center text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state.kind === "empty" && (
        <div className="py-16 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("commerce.subscriptions.empty")}
          </p>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {t("commerce.subscriptions.syncFirst")}
          </Button>
        </div>
      )}

      {state.kind === "loaded" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("commerce.subscriptions.columns.customer")}</TableHead>
                <TableHead>{t("commerce.subscriptions.columns.product")}</TableHead>
                <TableHead>{t("commerce.subscriptions.columns.status")}</TableHead>
                <TableHead>{t("commerce.subscriptions.columns.renewsAt")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.subscriptions.map((s) => {
                const canPause = s.status === "active";
                const canResume = s.status === "paused";
                const canCancel =
                  s.status !== "cancelled" && s.status !== "expired";

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="text-sm">{s.customerName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.customerEmail ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{s.productName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.variantName ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriptionStatusVariant(s.status)}>
                        {s.statusLabel ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.status === "cancelled" && s.endsAt
                        ? t("commerce.subscriptions.endsAt", {
                          date: formatDate(s.endsAt),
                        })
                        : formatDate(s.renewsAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canPause && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({ sub: s, action: "pause" })
                              }
                            >
                              {t("commerce.subscriptions.actions.pause")}
                            </DropdownMenuItem>
                          )}
                          {canResume && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({ sub: s, action: "resume" })
                              }
                            >
                              {t("commerce.subscriptions.actions.resume")}
                            </DropdownMenuItem>
                          )}
                          {canCancel && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({ sub: s, action: "cancel" })
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                {t("commerce.subscriptions.actions.cancel")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {!canPause && !canResume && !canCancel && (
                            <DropdownMenuItem disabled>
                              {t("commerce.subscriptions.actions.none")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            {t("commerce.subscriptions.showing", {
              count: state.subscriptions.length,
              total: state.count,
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction ? actionLabels[confirmAction.action].title : ""}
        description={
          confirmAction ? actionLabels[confirmAction.action].desc : ""
        }
        confirmText={t("common.confirm")}
        variant={confirmAction?.action === "cancel" ? "destructive" : "default"}
        onConfirm={executeAction}
        loading={actioning}
      />
    </div>
  );
}