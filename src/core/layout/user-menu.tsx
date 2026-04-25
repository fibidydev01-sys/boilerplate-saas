"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/core/auth/store";
import { getInitials } from "@/core/lib/utils";
import { ROUTES } from "@/core/constants";
import { appConfig } from "@/config";
import { useTranslation, type TranslationKey } from "@/core/i18n";

export function UserMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const storeLogout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await storeLogout();
    router.push(appConfig.auth.postLogoutRedirect);
  };

  if (!user) return null;

  // Translate role label; fallback ke raw role (dengan underscore dihapus) kalau belum ada di i18n
  const roleLabel = (() => {
    const key = `roles.${user.role}` as TranslationKey;
    const translated = t(key);
    // Kalau t() return key sendiri artinya belum ada translation — fallback humanize
    return translated === key ? user.role.replace(/_/g, " ") : translated;
  })();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block max-w-[120px] truncate text-sm font-medium">
            {user.full_name}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {roleLabel}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROFILE} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {t("userMenu.myProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive cursor-pointer focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
