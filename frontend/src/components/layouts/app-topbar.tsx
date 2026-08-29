import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, Moon, Search, Sun, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { api, queryKeys } from "@/services/api";
import type { Role } from "@/types";

export function AppTopbar() {
  const { theme, toggle } = useTheme();
  const { user, setRole } = useAuth();
  
  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
  });
  
  const unread = notifications.filter((n) => !n.read).length;
  const initials = user.name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("");

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-3 sm:px-5">
      <SidebarTrigger className="shrink-0" aria-label="Toggle sidebar" />
      <div className="relative hidden min-w-0 flex-1 sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search events, participants, reports…"
          aria-label="Search"
          className="h-10 max-w-md rounded-xl pl-9"
        />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="min-h-11 min-w-11 rounded-xl"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative min-h-11 min-w-11 rounded-xl"
        >
          <Link to="/notifications" aria-label={`Notifications, ${unread} unread`}>
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 transition-colors hover:bg-accent"
              aria-label="Open profile menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-sm font-medium">{user.name}</span>
                <span className="block truncate text-[11px] capitalize text-muted-foreground">
                  {user.role}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Demo role
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={user.role} onValueChange={(v) => setRole(v as Role)}>
              <DropdownMenuRadioItem value="admin">Administrator</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="organizer">Event Organizer</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="participant">Participant</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserCog className="size-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/login">
                <LogOut className="size-4" /> Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
