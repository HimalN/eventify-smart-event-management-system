import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, CloudRain, Sparkles, Target, UserPlus, Loader2 } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WeatherWidget } from "@/components/shared/weather-widget";
import { PredictionWidget } from "@/components/shared/prediction-widget";
import { AttendancePredictionChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { api, queryKeys } from "@/services/api";

export function OrganizerDashboard() {
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

  const { data: analyticsData } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: api.getAnalytics,
  });

  if (eventsLoading || registrationsLoading) {
    return (
      <div className="flex justify-center p-12 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  const attendanceTrend = analyticsData?.attendanceTrend || [];
  const currentWeather = weatherData?.current || {
    condition: "Sunny",
    rain_probability: 0,
    updated: new Date().toISOString(),
  };

  const mine = events.slice(0, 8);
  const upcoming = mine.filter((e) => e.status === "upcoming");
  const alerts = mine.filter((e) => e.weather?.rainProbability > 60);
  const featured = upcoming[0] ?? mine[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          index={0}
          label="My Events"
          value={String(mine.length)}
          icon={CalendarDays}
          hint="this semester"
        />
        <StatCard
          index={1}
          label="Upcoming Events"
          value={String(upcoming.length)}
          icon={CalendarCheck}
          tone="info"
          hint="next 30 days"
        />
        <StatCard
          index={2}
          label="Today's Registrations"
          value={String(registrations.length)}
          icon={UserPlus}
          tone="success"
        />
        <StatCard
          index={3}
          label="Prediction Accuracy"
          value="94.2%"
          delta={1.4}
          icon={Target}
          tone="primary"
        />
        <StatCard
          index={4}
          label="Weather Alerts"
          value={String(alerts.length)}
          icon={CloudRain}
          tone="warning"
          hint="high rain risk"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Attendance Prediction"
          description="Rolling 8-week forecast"
          className="xl:col-span-2"
        >
          <AttendancePredictionChart data={attendanceTrend} />
        </SectionCard>
        <div className="space-y-6">
          <WeatherWidget {...(featured?.weather || currentWeather)} updated={featured?.weather?.updated || currentWeather.updated} />
          {featured && (
            <PredictionWidget
              predicted={featured.predictedAttendance}
              expected={featured.expectedAttendance}
              confidence={featured.confidence}
              caption={featured.title}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Calendar" description="Event schedule" bodyClassName="p-3">
          <Calendar mode="single" className="w-full" />
        </SectionCard>

        <SectionCard
          title="Recent Registrations"
          description="Latest sign-ups across your events"
          bodyClassName="p-0"
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link to="/my-events">View all</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {registrations.slice(0, 6).map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.participant}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.eventTitle}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Recent Attendance Check-Ins"
          description="Live on-site gate check-ins (FR10–FR13)"
          bodyClassName="p-0"
          action={
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/reports">View Reports</Link>
            </Button>
          }
        >
          {registrations.filter((r) => r.attendance === "attended").length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
              <p className="font-medium">No check-ins yet today</p>
              <p className="text-[11px] mt-0.5">Use the gate check-in terminal on event pages to scan attendees.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {registrations
                .filter((r) => r.attendance === "attended")
                .slice(0, 5)
                .map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{r.participant}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.eventTitle} · <span className="font-mono text-[11px]">{r.ticketCode}</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success shrink-0">
                      Attended
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="My Events"
        description="Performance at a glance"
        bodyClassName="p-0"
        action={
          <Button asChild size="sm" className="rounded-lg">
            <Link to="/events/new">
              <Sparkles className="size-3.5" aria-hidden="true" /> New event
            </Link>
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">
                  Event
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Fill rate
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Predicted
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Weather
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mine.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <Link
                      to="/events/$eventId"
                      params={{ eventId: e.id }}
                      className="font-medium hover:text-primary"
                    >
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {Math.round((e.currentRegistrations / e.capacity) * 100)}%
                  </td>
                  <td className="px-5 py-3 tabular-nums">{e.predictedAttendance}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.weather?.condition || "Sunny"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
