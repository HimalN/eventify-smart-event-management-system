import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cpu,
  Droplets,
  Lightbulb,
  MapPin,
  Share2,
  ShieldAlert,
  Sparkles,
  Ticket,
  Users,
  Utensils,
  Wind,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { weatherIcon } from "@/components/shared/weather-widget";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/events/$eventId")({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  
  const { data: event, isLoading } = useQuery({
    queryKey: queryKeys.event(eventId),
    queryFn: () => api.getEvent(eventId),
  });

  const { data: allRegistrations = [] } = useQuery({
    queryKey: queryKeys.registrations,
    queryFn: api.getRegistrations,
  });
  
  const attendees = allRegistrations.filter((r) => r.eventId === eventId);
  const [isRegistered, setIsRegistered] = useState(false);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <PageHeader
          title="Event not found"
          crumbs={[{ label: "Events", to: "/events" }, { label: "Not found" }]}
        />
        <Button asChild className="w-fit rounded-lg">
          <Link to="/events">Back to events</Link>
        </Button>
      </AppShell>
    );
  }

  const fillRate = Math.round((event.currentRegistrations / event.capacity) * 100) || 0;
  const predictedAttendance = event.predictedAttendance ?? event.expectedAttendance ?? event.currentRegistrations;
  const confidence = event.confidence ?? 0;
  const delta = predictedAttendance - event.currentRegistrations;
  const WeatherConditionIcon = weatherIcon[event.weather?.condition || "Sunny"] || weatherIcon["Sunny"];

  const handleRegister = async () => {
    try {
      if (user?.name && user?.email) {
        await api.registerForEvent(event.id, user.name, user.email);
        setIsRegistered(true);
        toast.success("Registration Confirmed!", {
          description: `You are registered for ${event.title}.`,
        });
      } else {
        toast.error("Please login to register.");
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={event.title}
        description={`${event.category} · Organized by ${event.organizer} · Target Audience: ${event.targetAudience}`}
        crumbs={[{ label: "Events", to: "/events" }, { label: event.title }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => toast.success("Event link copied to clipboard")}
            >
              <Share2 className="size-4" aria-hidden="true" /> Share
            </Button>
            {isRegistered ? (
              <Button variant="secondary" disabled className="rounded-lg gap-2 text-success">
                <CheckCircle2 className="size-4" /> Registered
              </Button>
            ) : (
              <Button className="rounded-lg gap-2" onClick={handleRegister}>
                <Ticket className="size-4" aria-hidden="true" /> Register Now (Free)
              </Button>
            )}
          </div>
        }
      />

      {/* Banner Header */}
      <div
        className="relative h-40 overflow-hidden rounded-2xl sm:h-48"
        style={{
          backgroundImage: `linear-gradient(135deg, oklch(0.62 0.16 ${event.bannerHue || 200}), oklch(0.5 0.18 ${((event.bannerHue || 200) + 45) % 360}))`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 p-5 text-primary-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={event.status} className="bg-white/20 text-white ring-white/30" />
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="size-4" aria-hidden="true" /> {event.date}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Clock className="size-4" aria-hidden="true" /> {event.startTime} – {event.endTime}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="size-4" aria-hidden="true" /> {event.location} ({event.venueType})
            </span>
          </div>
          <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            Model: {event.modelUsed}
          </span>
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Confirmed Registrations"
          value={String(event.currentRegistrations)}
          icon={Users}
          hint={`of ${event.capacity} maximum capacity`}
        />
        <StatCard
          index={1}
          label="ML Predicted Attendance"
          value={predictedAttendance.toLocaleString()}
          icon={Sparkles}
          tone="primary"
          hint={confidence > 0 ? `${confidence}% confidence score` : "Prediction pending"}
        />
        <StatCard
          index={2}
          label="Expected Turnout Delta"
          value={isNaN(delta) ? "—" : delta >= 0 ? `+${delta}` : String(delta)}
          icon={Users}
          tone={!isNaN(delta) && delta < 0 ? "danger" : "success"}
          hint={isNaN(delta) ? "Run a prediction first" : delta >= 0 ? "Walk-in surplus expected" : "Below registrations"}
        />
        <StatCard
          index={3}
          label="Weather Risk Assessment"
          value={event.weather?.condition || "Sunny"}
          icon={WeatherConditionIcon!}
          tone={
            event.weather?.advisory === "attention_required"
              ? "danger"
              : event.weather?.advisory === "moderate"
                ? "warning"
                : "success"
          }
          hint={`${event.weather?.rainProbability || 0}% rain probability`}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Tabs defaultValue="insights">
            <TabsList className="rounded-xl">
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb className="size-4" /> Planning Decisions
              </TabsTrigger>
              <TabsTrigger value="overview">Event Overview</TabsTrigger>
              <TabsTrigger value="attendees">
                Registered Participants ({attendees.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">ML & Weather Details</TabsTrigger>
            </TabsList>

            {/* TAB: Planning Decisions */}
            <TabsContent value="insights" className="mt-4 space-y-4">
              <SectionCard
                title="Intelligent Decision Support & Resource Recommendations"
                description="Actionable recommendations generated by combining event features, weather forecasts, and ML attendance estimates"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {(event.planningInsights || []).map((ins) => (
                    <div
                      key={ins.id}
                      className={`rounded-xl border p-4.5 ${
                        ins.priority === "high"
                          ? "border-danger/30 bg-danger/5"
                          : ins.priority === "medium"
                            ? "border-warning/30 bg-warning/5"
                            : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ins.category === "capacity" && <Users className="size-4 text-primary" />}
                        {ins.category === "catering" && (
                          <Utensils className="size-4 text-warning" />
                        )}
                        {ins.category === "weather_contingency" && (
                          <ShieldAlert className="size-4 text-destructive" />
                        )}
                        {ins.category === "staffing" && (
                          <CheckCircle2 className="size-4 text-success" />
                        )}
                        <h4 className="text-sm font-semibold text-foreground">{ins.title}</h4>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {ins.message}
                      </p>
                      <div className="mt-3 rounded-lg bg-background/80 p-2.5 text-xs text-foreground shadow-sm">
                        <span className="font-semibold text-primary">Recommended Action: </span>
                        {ins.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            {/* TAB: Overview */}
            <TabsContent value="overview" className="mt-4">
              <SectionCard
                title="About this Event"
                description="Logistics, target audience and venue information"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Faculty Organizer", event.organizer],
                    ["Event Category", event.category],
                    ["Venue Location", `${event.location} (${event.venueType})`],
                    ["Target Audience", event.targetAudience],
                    ["Registration Deadline", event.registrationDeadline],
                    ["Scheduled Capacity", `${event.capacity} attendees`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border/70 p-3">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">
                      Capacity Filled ({event.currentRegistrations} / {event.capacity})
                    </span>
                    <span className="tabular-nums font-semibold">{fillRate}%</span>
                  </div>
                  <Progress value={fillRate} className="mt-2 h-2.5" />
                </div>
              </SectionCard>
            </TabsContent>

            {/* TAB: Registered Participants */}
            <TabsContent value="attendees" className="mt-4">
              <SectionCard
                title="Registered Participants"
                description={`Official registrations (${attendees.length} total)`}
                bodyClassName="p-0"
              >
                {attendees.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No registrations recorded yet. Be the first to register!
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {attendees.map((r) => (
                      <li
                        key={r.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {r.participant}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.email} · Ticket Code:{" "}
                            <strong className="text-foreground">{r.ticketCode}</strong> · Registered{" "}
                            {r.registeredAt}
                          </p>
                        </div>
                        <StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </TabsContent>

            {/* TAB: Analytics */}
            <TabsContent value="analytics" className="mt-4">
              <SectionCard
                title="Predictive Model & Weather Performance Metrics"
                description="Data inputs driving the current attendance prediction"
              >
                <dl className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Predicted Attendance", `${predictedAttendance.toLocaleString()} pax`],
                    [
                      "Actual Attendance",
                      event.actualAttendance === null
                        ? "Pending Event Completion"
                        : `${event.actualAttendance} pax`,
                    ],
                    ["Model Confidence", confidence > 0 ? `${confidence}%` : "Pending"],
                    ["ML Algorithm", event.modelUsed],
                    [
                      "Forecasted Temperature",
                      `${event.weather?.temperature || 28}°C (Feels like ${event.weather?.feelsLike ?? (event.weather?.temperature || 28) + 3}°C)`,
                    ],
                    [
                      "Rain Probability",
                      `${event.weather?.rainProbability || 0}% (${event.weather?.condition || "Sunny"})`,
                    ],
                    ["Wind Speed", `${event.weather?.windSpeed || 10} km/h`],
                    ["Humidity", `${event.weather?.humidity || 70}%`],
                    ["Weather Turnout Impact", `${event.weather?.impactScore || 90}/100`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-border p-4">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-1 text-base font-semibold text-foreground tabular-nums">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Prediction Summary Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" /> ML Attendance Prediction
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {event.modelUsed}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                {predictedAttendance.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Baseline expectation: {event.expectedAttendance ?? "—"} · Confidence: {confidence > 0 ? `${confidence}%` : "Pending"}
              </p>
            </div>
            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Turnout Delta: </strong>
                {delta >= 0
                  ? `+${delta} more than confirmed registrations`
                  : `${delta} less than confirmed registrations`}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-lg">
              <Link to="/prediction">
                <Cpu className="size-3.5" /> Simulate What-If Scenarios
              </Link>
            </Button>
          </div>

          {/* Weather Integration Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Event Weather Forecast
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  event.weather?.advisory === "attention_required"
                    ? "bg-destructive/15 text-destructive"
                    : event.weather?.advisory === "moderate"
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success"
                }`}
              >
                {(event.weather?.advisory || "favorable").replace("_", " ").toUpperCase()}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {event.weather?.temperature || 28}°C
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {event.weather?.condition || "Sunny"}
                </p>
              </div>
              {WeatherConditionIcon && <WeatherConditionIcon className="size-12 text-primary" aria-hidden="true" />}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Rain</p>
                <p className="font-semibold text-foreground">{event.weather?.rainProbability || 0}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Humidity</p>
                <p className="font-semibold text-foreground">{event.weather?.humidity || 70}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Wind</p>
                <p className="font-semibold text-foreground">{event.weather?.windSpeed || 10} km/h</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {event.weather?.advisoryMessage || "Standard operations."}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
