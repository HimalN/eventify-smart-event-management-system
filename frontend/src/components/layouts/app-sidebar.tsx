import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarPlus,
  CloudSun,
  FileBarChart,
  LayoutDashboard,
  Settings,
  Sparkles,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@/types";

type NavItem = { title: string; url: string; icon: typeof Users; roles: Role[] };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "organizer", "participant"],
      },
      { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["admin", "organizer"] },
    ],
  },
  {
    label: "Events",
    items: [
      {
        title: "All Events",
        url: "/events",
        icon: CalendarDays,
        roles: ["admin", "organizer", "participant"],
      },
      {
        title: "My Events",
        url: "/my-events",
        icon: Ticket,
        roles: ["admin", "organizer", "participant"],
      },
      {
        title: "Create Event",
        url: "/events/new",
        icon: CalendarPlus,
        roles: ["admin", "organizer"],
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        title: "Attendance Prediction",
        url: "/prediction",
        icon: Sparkles,
        roles: ["admin", "organizer"],
      },
      {
        title: "Weather",
        url: "/weather",
        icon: CloudSun,
        roles: ["admin", "organizer", "participant"],
      },
      { title: "Reports", url: "/reports", icon: FileBarChart, roles: ["admin", "organizer"] },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Notifications",
        url: "/notifications",
        icon: Bell,
        roles: ["admin", "organizer", "participant"],
      },
      { title: "Users", url: "/users", icon: Users, roles: ["admin"] },
      {
        title: "Profile",
        url: "/profile",
        icon: UserCog,
        roles: ["admin", "organizer", "participant"],
      },
<<<<<<< HEAD
=======
      { title: "Settings", url: "/settings", icon: Settings, roles: ["admin", "organizer"] },
>>>>>>> 1e84df882758a8315a2b307f308c3c92965815ad
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1.5 py-1.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground [background-image:var(--gradient-brand)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">Eventify</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Smart Event Management System
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          const items = group.items.filter((i) => i.roles.includes(user.role));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
