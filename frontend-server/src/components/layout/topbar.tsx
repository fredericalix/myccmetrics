"use client";

import { useUser } from "@/lib/hooks/use-user";
import { getLogoutUrl } from "@/lib/api";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: user } = useUser();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = async () => {
    await fetch(getLogoutUrl(), {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-6 2xl:px-10">
      <div className="flex items-center gap-4">
        <button
          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="max-xl:hidden">
          <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Clever Cloud Metrics</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none ring-ring focus-visible:ring-2">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && (
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user.name || "User"}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </div>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
