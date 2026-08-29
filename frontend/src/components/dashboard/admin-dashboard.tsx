import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CloudRain,
  DollarSign,
  FileBarChart,
  Sparkles,
  UserPlus,
  Users,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  MonthlyEventsChart,
  AttendancePredictionChart,
  RegistrationTrendChart,
  WeatherImpactChart,
} from "@/components/charts/charts";
import { api, queryKeys } from "@/services/api";

const activities = [
  { id: "a1", actor: "Prof. Alan Turing", action: "created event", target: "Intro to Cryptography", time: "2 hours ago" },
  { id: "a2", actor: "Dr. Grace Hopper", action: "updated capacity for", target: "Compilers 101", time: "5 hours ago" },
  { id: "a3", actor: "System", action: "generated forecast for", target: "AI Summit 2026", time: "1 day ago" },
];

export function AdminDashboard() {
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: api.getAnalytics,
  });

  if (eventsLoading || analyticsLoading || !analyticsData) {
    return (
      <div className="flex justify-center p-12 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  const attendanceTrend = analyticsData.attendanceTrend || [];
  const monthlyEvents = analyticsData.monthlyEvents || [];
  const registrationTrends = analyticsData.registrationTrends || [];
  const weatherImpact = analyticsData.weatherImpact || [];

  const upcoming = events.filter((e) => e.status === "upcoming");
  const completed = events.filter((e) => e.status === "completed");
  const predicted = events.reduce((s, e) => s + e.predictedAttendance, 0);
  const registrations = events.reduce((s, e) => s + e.currentRegistrations, 0);
  const alerts = events.filter((e) => e.weather?.rainProbability > 60).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total Events"
          value={String(events.length)}
          delta={12}
          hint="vs last semester"
          icon={CalendarDays}
        />
        <StatCard
          index={1}
          label="Upcoming Events"
          value={String(upcoming.length)}
          delta={8}
          hint="next 30 days"
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard
          index={2}
          label="Total Registrations"
          value={registrations.toLocaleString()}
          delta={17}
          hint="confirmed students"
          icon={Users}
          tone="success"
        />
        <StatCard
          index={3}
          label="Predicted Attendance"
          value={predicted.toLocaleString()}
          delta={-3}
          hint="model XGBoost"
          icon={Sparkles}
          tone="primary"
        />
        <StatCard
          index={4}
          label="Completed Events"
          value={String(completed.length)}
          hint="all-time verified"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          index={5}
          label="Weather Risk Events"
          value={String(alerts)}
          hint="high rain risk"
          icon={CloudRain}
          tone="warning"
        />
        <StatCard
          index={6}
          label="Best Model Accuracy"
          value="94.6% R²"
          delta={1.8}
          hint="XGBoost algorithm"
          icon={Sparkles}
          tone="primary"
        />
        <StatCard
          index={7}
          label="System Status"
          value="Healthy"
          hint="ML & Weather API online"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Monthly Events"
          description="Scheduled vs completed"
          className="xl:col-span-2"
        >
          <MonthlyEventsChart data={monthlyEvents} />
        </SectionCard>
        <SectionCard title="Quick Actions" description="Common admin tasks">
          <div className="grid gap-2">
            {[
              { to: "/events/new", label: "Create new event", icon: CalendarPlus },
              { to: "/users", label: "Invite a user", icon: UserPlus },
              { to: "/reports", label: "Generate report", icon: FileBarChart },
              { to: "/prediction", label: "Run attendance prediction", icon: Sparkles },
            ].map((a) => (
              <Button
                key={a.to}
                asChild
                variant="outline"
                className="h-12 justify-start rounded-xl"
              >
                <Link to={a.to}>
                  <a.icon className="size-4 text-primary" aria-hidden="true" />
                  {a.label}
                </Link>
              </Button>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Attendance Prediction" description="Predicted vs actual vs expected">
          <AttendancePredictionChart data={attendanceTrend} />
        </SectionCard>
        <SectionCard title="Registration Trends" description="Last 7 days">
          <RegistrationTrendChart data={registrationTrends} />
        </SectionCard>
        <SectionCard title="Weather Impact Analysis" description="Average turnout by condition">
          <WeatherImpactChart data={weatherImpact} />
        </SectionCard>
        <SectionCard
          title="Recent Activities"
          description="System-wide audit trail"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <p className="min-w-0 text-sm">
                  <span className="font-medium">{a.actor}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium">{a.target}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{a.time}</span>
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Events"
        description="Latest events across all organizers"
        action={
          <Button asChild variant="ghost" size="sm" className="rounded-lg">
            <Link to="/events">View all</Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">
                  Event
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Registrations
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Predicted
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.slice(0, 6).map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <Link
                      to="/events/$eventId"
                      params={{ eventId: e.id }}
                      className="font-medium hover:text-primary"
                    >
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{e.category}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {e.currentRegistrations}/{e.capacity}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{e.predictedAttendance}</td>
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
