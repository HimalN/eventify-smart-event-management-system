import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Target, Users, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import {
  AttendancePredictionChart,
  FeatureImportanceChart,
  MonthlyEventsChart,
  RegistrationTrendChart,
  WeatherImpactChart,
} from "@/components/charts/charts";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Eventify" },
      {
        name: "description",
        content:
          "Event performance, registration trends, prediction accuracy and weather correlation analytics.",
      },
      { property: "og:title", content: "Analytics — Eventify" },
      {
        property: "og:description",
        content:
          "Event performance, registration trends, prediction accuracy and weather correlation analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
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
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const totalRegs = events.reduce((s, e) => s + (e.currentRegistrations || 0), 0);
  const avgFill = Math.round(
    (events.reduce((s, e) => s + (e.capacity > 0 ? (e.currentRegistrations || 0) / e.capacity : 0), 0) / (events.length || 1)) * 100,
  );

  const byCategory = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + (e.currentRegistrations || 0);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = byCategory[0]?.[1] ?? 1;

  // Use the API data with fallbacks to avoid crashes if empty
  const monthlyEvents = analyticsData.monthlyEvents?.length ? analyticsData.monthlyEvents : [];
  const registrationTrends = analyticsData.registrationTrends?.length ? analyticsData.registrationTrends : [];
  const attendanceTrend = analyticsData.attendanceTrend?.length ? analyticsData.attendanceTrend : [];
  const weatherImpact = analyticsData.weatherImpact?.length ? analyticsData.weatherImpact : [];
  const featureImportance = analyticsData.featureImportance?.length ? analyticsData.featureImportance : [];

  return (
    <AppShell>
      <PageHeader
        title="Analytics"
        description="Cross-event performance and model accuracy insight."
        crumbs={[{ label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total events"
          value={String(events.length)}
          delta={12}
          icon={CalendarDays}
        />
        <StatCard
          index={1}
          label="Total registrations"
          value={totalRegs.toLocaleString()}
          delta={17}
          icon={Users}
          tone="success"
        />
        <StatCard
          index={2}
          label="Average fill rate"
          value={`${avgFill}%`}
          delta={4}
          icon={BarChart3}
          tone="info"
        />
        <StatCard
          index={3}
          label="Prediction accuracy"
          value="94.2%"
          delta={1.4}
          icon={Target}
          tone="primary"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Monthly events" description="Scheduled vs completed">
          <MonthlyEventsChart data={monthlyEvents} />
        </SectionCard>
        <SectionCard title="Registration trends" description="Sign-ups vs cancellations">
          <RegistrationTrendChart data={registrationTrends} />
        </SectionCard>
        <SectionCard title="Prediction accuracy" description="Predicted vs actual vs expected">
          <AttendancePredictionChart data={attendanceTrend} />
        </SectionCard>
        <SectionCard title="Weather correlation" description="Turnout by weather condition">
          <WeatherImpactChart data={weatherImpact} />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Registrations by category" description="Where demand concentrates">
          <ul className="space-y-4">
            {byCategory.map(([cat, value]) => (
              <li key={cat}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {value.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(value / maxCat) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard
          title="Model feature importance"
          description="Signal contribution to forecasts"
        >
          <FeatureImportanceChart data={featureImportance} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
