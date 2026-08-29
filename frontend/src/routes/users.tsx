import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Search, ShieldCheck, UserPlus, Users as UsersIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — Eventify" },
      {
        name: "description",
        content: "Manage administrators, organizers and participants with role-based access.",
      },
      { property: "og:title", content: "User Management — Eventify" },
      {
        property: "og:description",
        content: "Manage administrators, organizers and participants with role-based access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users,
    queryFn: api.getUsers,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const filtered = users.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell>
      <PageHeader
        title="Users"
        description="Administrators, organizers and participants."
        crumbs={[{ label: "Users" }]}
        actions={
          <Button className="rounded-lg" onClick={() => toast.success("Invitation sent")}>
            <UserPlus className="size-4" aria-hidden="true" /> Invite user
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total users" value={String(users.length)} icon={UsersIcon} />
        <StatCard
          index={1}
          label="Admins"
          value={String(users.filter((u) => u.role === "admin").length)}
          icon={ShieldCheck}
          tone="primary"
        />
        <StatCard
          index={2}
          label="Organizers"
          value={String(users.filter((u) => u.role === "organizer").length)}
          icon={UsersIcon}
          tone="info"
        />
        <StatCard
          index={3}
          label="Active"
          value={String(users.filter((u) => u.status === "active").length)}
          icon={UsersIcon}
          tone="success"
        />
      </div>

      <SectionCard
        title="Directory"
        description={`${filtered.length} of ${users.length} users`}
        bodyClassName="p-0"
      >
        <div className="grid gap-3 border-b border-border p-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users"
              className="h-10 rounded-lg pl-9"
              aria-label="Search users"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-10 rounded-lg md:w-44" aria-label="Filter by role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="organizer">Organizer</SelectItem>
              <SelectItem value="participant">Participant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description="Adjust the search or role filter to see results."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">
                    User
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Department
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: `oklch(0.6 0.15 ${u.avatarHue})` }}
                          aria-hidden="true"
                        >
                          {u.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className="rounded-full capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.department}</td>
                    <td className="px-5 py-3 text-muted-foreground">{u.joinedAt}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-lg">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                            <span className="sr-only">Actions for {u.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success(`Viewing ${u.name}`)}>
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast.success(`Role change requested for ${u.name}`)}
                          >
                            Change role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => toast.error(`${u.name} suspended`)}
                          >
                            Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
