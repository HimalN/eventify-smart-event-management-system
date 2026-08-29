import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Eventify" },
      {
        name: "description",
        content: "Manage your account details, password and event activity history.",
      },
      { property: "og:title", content: "Profile — Eventify" },
      {
        property: "og:description",
        content: "Manage your account details, password and event activity history.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { register, handleSubmit } = useForm({
    values: { name: user.name, email: user.email, department: user.department, bio: "" },
  });

  const { data: allRegistrations = [], isLoading } = useQuery({
    queryKey: queryKeys.registrations,
    queryFn: api.getRegistrations,
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

  const userRegistrations = allRegistrations.filter(r => r.email === user?.email);

  return (
    <AppShell>
      <PageHeader
        title="Profile"
        description="Your account details and activity."
        crumbs={[{ label: "Profile" }]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Account" description="Who you are on Eventify">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-20 place-items-center rounded-full text-xl font-semibold text-primary-foreground [background-image:var(--gradient-brand)]">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </span>
            <p className="mt-3 text-base font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-3 rounded-full capitalize">
              {user.role}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">{user.department}</p>
          </div>
        </SectionCard>

        <form
          className="xl:col-span-2"
          onSubmit={handleSubmit(() => toast.success("Profile updated"))}
        >
          <SectionCard title="Edit details" description="Update your personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" className="h-10 rounded-lg" {...register("name")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" className="h-10 rounded-lg" {...register("email")} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" className="h-10 rounded-lg" {...register("department")} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  className="rounded-lg"
                  placeholder="A short introduction"
                  {...register("bio")}
                />
              </div>
            </div>
            <Button type="submit" className="mt-5 rounded-lg">
              <Save className="size-4" aria-hidden="true" /> Save changes
            </Button>
          </SectionCard>
        </form>
      </div>

      <SectionCard
        title="Activity history"
        description="Your recent event registrations"
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-border">
          {userRegistrations.slice(0, 8).map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.eventTitle}</p>
                <p className="text-xs text-muted-foreground">Registered {r.registeredAt}</p>
              </div>
              <StatusBadge status={r.attendance} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
