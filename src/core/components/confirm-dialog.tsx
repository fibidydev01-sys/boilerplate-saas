"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n";

/**
 * ConfirmDialog — reusable confirmation dialog.
 *
 * Supports both naming conventions for backward compatibility:
 *   - `confirmLabel` / `isLoading` (original)
 *   - `confirmText` / `loading` (alternative)
 *
 * Preferred: `confirmLabel` + `isLoading`.
 */
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Preferred */
  confirmLabel?: string;
  /** Alias for confirmLabel */
  confirmText?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /** Preferred */
  isLoading?: boolean;
  /** Alias for isLoading */
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  variant = "default",
  isLoading,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const resolvedLabel = confirmLabel ?? confirmText ?? t("common.confirm");
  const resolvedLoading = isLoading ?? loading ?? false;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resolvedLoading}>
            {cancelLabel ?? t("common.cancel")}
          </AlertDialogCancel>
          <Button variant={variant} onClick={onConfirm} disabled={resolvedLoading}>
            {resolvedLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resolvedLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}