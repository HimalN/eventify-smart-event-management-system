import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  CloudRain,
  Server,
  Sparkles,
  UserPlus,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api, queryKeys } from "@/services/api";
import { NotificationItem } from "@/types";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Eventify" },
      {
        name: "description",
        content: "Event reminders, weather alerts and prediction updates in one feed.",
      },
      { property: "og:title", content: "Notifications — Eventify" },
      {
        property: "og:description",
        content: "Event reminders, weather alerts and prediction updates in one feed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

const icons: Record<string, LucideIcon> = {
  reminder: CalendarClock,
  registration: UserPlus,
  weather: CloudRain,
  prediction: Sparkles,
  system: Server,
};

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
  });

  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (notifications.length > 0 && items.length === 0) {
      setItems(notifications);
    }
  }, [notifications]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const unread = items.filter((n) => !n.read);

  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggle = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));

  const list = (data: typeof items) =>
    data.length === 0 ? (
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="New alerts and reminders will show up here."
      />
    ) : (
      <SectionCard title="Feed" description={`${data.length} notifications`} bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {data.map((n) => {
            const Icon = icons[n.type] ?? Bell;
            return (
              <li
                key={n.id}
                className={cn("flex items-start gap-3 px-5 py-4", !n.read && "bg-primary/5")}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => toggle(n.id)}
                >
                  {n.read ? "Mark unread" : "Mark read"}
                </Button>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    );

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description={`${unread.length} unread of ${items.length} total.`}
        crumbs={[{ label: "Notifications" }]}
        actions={
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={markAll}
            disabled={unread.length === 0}
          >
            <CheckCheck className="size-4" aria-hidden="true" /> Mark all read
          </Button>
        }
      />
      <Tabs defaultValue="all">
        <TabsList className="rounded-xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="prediction">Predictions</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {list(items)}
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          {list(unread)}
        </TabsContent>
        <TabsContent value="weather" className="mt-4">
          {list(items.filter((n) => n.type === "weather"))}
        </TabsContent>
        <TabsContent value="prediction" className="mt-4">
          {list(items.filter((n) => n.type === "prediction"))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
