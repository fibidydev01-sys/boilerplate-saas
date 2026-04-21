"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/core/components";
import { useAuthStore } from "@/core/auth/store";
import { appConfig } from "@/config";
import { t } from "@/core/i18n";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  showText = true,
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    router.push(appConfig.auth.postLogoutRedirect);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {showIcon && (
              <LogOut className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
            )}
            {showText && t("common.logout")}
          </>
        )}
      </Button>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={t("auth.logoutConfirmTitle")}
        description={t("auth.logoutConfirmDescription")}
        confirmLabel={t("auth.logoutConfirmButton")}
        variant="destructive"
        isLoading={isLoading}
        onConfirm={handleLogout}
      />
    </>
  );
}
