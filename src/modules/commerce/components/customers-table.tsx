"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useTranslation } from "@/core/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "../types";
import { formatMoney, formatDate } from "../lib/format";

type State =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; error: string }
  | { kind: "not_connected" }
  | { kind: "loaded"; customers: Customer[]; count: number };

export function CustomersTable() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [emailFilter, setEmailFilter] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (emailFilter.trim()) params.set("email", emailFilter.trim());

      const res = await fetch(`/api/commerce/customers?${params.toString()}`);
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

      const { customers, count } = (await res.json()) as {
        customers: Customer[];
        count: number;
      };
      if (customers.length === 0) setState({ kind: "empty" });
      else setState({ kind: "loaded", customers, count });
    } catch (err) {
      setState({
        kind: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [emailFilter]);

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
      const res = await fetch("/api/commerce/customers?pages=3", {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("commerce.customers.filterEmail")}
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing
            ? t("commerce.customers.syncing")
            : t("commerce.customers.sync")}
        </Button>
      </div>

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
            {t("commerce.customers.empty")}
          </p>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {t("commerce.customers.syncFirst")}
          </Button>
        </div>
      )}

      {state.kind === "loaded" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("commerce.customers.columns.name")}</TableHead>
                <TableHead>{t("commerce.customers.columns.email")}</TableHead>
                <TableHead>{t("commerce.customers.columns.country")}</TableHead>
                <TableHead className="text-right">
                  {t("commerce.customers.columns.mrr")}
                </TableHead>
                <TableHead className="text-right">
                  {t("commerce.customers.columns.totalRevenue")}
                </TableHead>
                <TableHead>{t("commerce.customers.columns.joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.country ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(c.mrr, "USD")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(c.totalRevenueCurrency, "USD")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            {t("commerce.customers.showing", {
              count: state.customers.length,
              total: state.count,
            })}
          </div>
        </div>
      )}
    </div>
  );
}