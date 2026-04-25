"use client";

/**
 * OrdersTable — list orders dengan filter, pagination, dan sync button.
 */

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, ExternalLink } from "lucide-react";
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
import type { Order } from "../types";
import {
  formatMoney,
  formatDate,
  orderStatusVariant,
} from "../lib/format";

type State =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; error: string }
  | { kind: "not_connected" }
  | { kind: "loaded"; orders: Order[]; count: number };

const STATUS_OPTIONS = [
  { value: "all", labelKey: "commerce.orders.status.all" },
  { value: "paid", labelKey: "commerce.orders.status.paid" },
  { value: "pending", labelKey: "commerce.orders.status.pending" },
  { value: "refunded", labelKey: "commerce.orders.status.refunded" },
  { value: "partial_refund", labelKey: "commerce.orders.status.partial_refund" },
  { value: "void", labelKey: "commerce.orders.status.void" },
];

export function OrdersTable({
  onRowClick,
}: {
  onRowClick?: (order: Order) => void;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [status, setStatus] = useState("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") params.set("status", status);
      if (emailFilter.trim()) params.set("email", emailFilter.trim());

      const res = await fetch(`/api/commerce/orders?${params.toString()}`);
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

      const { orders, count } = (await res.json()) as {
        orders: Order[];
        count: number;
      };

      if (orders.length === 0) {
        setState({ kind: "empty" });
      } else {
        setState({ kind: "loaded", orders, count });
      }
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
      const res = await fetch("/api/commerce/orders?pages=3", {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          error: body.error ?? `Sync failed HTTP ${res.status}`,
        });
      } else {
        await load();
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("commerce.orders.filterEmail")}
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? t("commerce.orders.syncing") : t("commerce.orders.sync")}
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
            {t("commerce.orders.empty")}
          </p>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {t("commerce.orders.syncFirst")}
          </Button>
        </div>
      )}

      {state.kind === "loaded" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("commerce.orders.columns.orderNumber")}</TableHead>
                <TableHead>{t("commerce.orders.columns.customer")}</TableHead>
                <TableHead>{t("commerce.orders.columns.status")}</TableHead>
                <TableHead className="text-right">
                  {t("commerce.orders.columns.total")}
                </TableHead>
                <TableHead>{t("commerce.orders.columns.date")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.orders.map((o) => (
                <TableRow
                  key={o.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(o)}
                >
                  <TableCell className="font-mono text-sm">
                    #{o.orderNumber ?? o.providerOrderId.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {o.customerName ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.customerEmail ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderStatusVariant(o.status)}>
                      {o.statusLabel ?? o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(o.total, o.currency, o.totalFormatted)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(o.orderCreatedAt)}
                  </TableCell>
                  <TableCell>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            {t("commerce.orders.showing", {
              count: state.orders.length,
              total: state.count,
            })}
          </div>
        </div>
      )}
    </div>
  );
}