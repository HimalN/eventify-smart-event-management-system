import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, CheckCircle2, Ticket, Loader2 } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WeatherWidget } from "@/components/shared/weather-widget";
import { Button } from "@/components/ui/button";
import { api, queryKeys } from "@/services/api";
import { useAuth } from "@/contexts/auth-context";

export function ParticipantDashboard() {
  const { user } = useAuth();
  
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: queryKeys.registrations,
    queryFn: api.getRegistrations,
  });

  const { data: weatherData } = useQuery({
    queryKey: queryKeys.weather,
    queryFn: api.getWeather,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
  });

  if (eventsLoading || registrationsLoading) {
    return (
      <div className="flex justify-center p-12 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  const userRegistrations = registrations.filter((r) => r.email === user?.email);
  const mine = userRegistrations.slice(0, 6);
  const attended = userRegistrations.filter((r) => r.attendance === "attended").length;
  const recommended = events.filter((e) => e.status === "upcoming").slice(0, 4);

  const currentWeather = weatherData?.current || {
    condition: "Sunny",
    rain_probability: 0,
    updated: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Registered Events"
          value={String(userRegistrations.length)}
          icon={Ticket}
        />
        <StatCard
          index={1}
          label="Upcoming"
          value={String(recommended.length)}
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard
          index={2}
          label="Attended"
          value={String(attended)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          index={3}
          label="Available Events"
          value={String(events.length)}
          icon={CalendarDays}
          tone="primary"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="My Registrations"
          description="Your tickets and status"
          className="xl:col-span-2"
          bodyClassName="p-0"
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link to="/my-events">View all</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {mine.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.eventTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Ticket {r.ticketCode} · registered {r.registeredAt}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-6">
          <WeatherWidget {...currentWeather} updated={currentWeather.updated} />
          <SectionCard title="Notifications" description="Latest updates" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recommended Events" description="Picked for your interests">
        <div className="grid gap-4 sm:grid-cols-2">
          {recommended.map((e) => (
            <Link
              key={e.id}
              to="/events/$eventId"
              params={{ eventId: e.id }}
              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">{e.title}</p>
                <StatusBadge status={e.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.date} · {e.location}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {e.currentRegistrations}/{e.capacity} registered · {e.weather?.condition || "Sunny"}
              </p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
