import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CloudRain, Droplets, Wind, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { WeatherWidget, weatherIcon } from "@/components/shared/weather-widget";
import { WeatherImpactChart, WeatherTimelineChart } from "@/components/charts/charts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, queryKeys } from "@/services/api";

const weatherImpact = [
  { condition: "Clear/Sunny", avgTurnout: 85, severity: "low" },
  { condition: "Cloudy", avgTurnout: 78, severity: "low" },
  { condition: "Light Rain", avgTurnout: 62, severity: "medium" },
  { condition: "Heavy Rain", avgTurnout: 41, severity: "high" },
  { condition: "Extreme/Storm", avgTurnout: 15, severity: "critical" },
];

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather Forecast — Eventify" },
      {
        name: "description",
        content:
          "7-day campus forecast, hourly timeline and weather impact analysis for every event.",
      },
      { property: "og:title", content: "Weather Forecast — Eventify" },
      {
        property: "og:description",
        content:
          "7-day campus forecast, hourly timeline and weather impact analysis for every event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: queryKeys.weather,
    queryFn: api.getWeather,
  });

  if (eventsLoading || weatherLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const currentWeather = weatherData?.current || {
    location: "Campus",
    condition: "Sunny",
    temperature: 25,
    feels_like: 26,
    humidity: 50,
    rain_probability: 0,
    wind_speed: 10,
    impact_score: 1,
    advisory: "Clear",
    advisory_message: "Good weather",
    updated: new Date().toISOString(),
  };

  const forecast7Day = weatherData?.forecast || [];
  const weatherTimeline = weatherData?.timeline || [];

  // Need to adapt API response keys for some components
  const cwAdapted = {
    location: currentWeather.location,
    condition: currentWeather.condition as "Sunny" | "Cloudy" | "Rainy",
    temperature: currentWeather.temperature,
    feelsLike: currentWeather.feels_like,
    humidity: currentWeather.humidity,
    rainProbability: currentWeather.rain_probability,
    windSpeed: currentWeather.wind_speed,
    impactScore: currentWeather.impact_score,
    advisory: currentWeather.advisory as "Clear" | "Monitor" | "Warning",
    advisoryMessage: currentWeather.advisory_message,
    updated: currentWeather.updated,
  };

  const timelineAdapted = weatherTimeline.map((t: any) => ({
    hour: t.hour,
    temperature: t.temperature,
    rain: t.rain || t.rainProbability || 0,
  }));

  const forecastAdapted = forecast7Day.map((d: any) => ({
    date: d.date,
    condition: d.condition as "Sunny" | "Cloudy" | "Rainy",
    temperature: d.temperature,
    feelsLike: d.feels_like,
    humidity: d.humidity,
    rainProbability: d.rain_probability,
    windSpeed: d.wind_speed,
    impactScore: d.impact_score,
    advisory: d.advisory as "Clear" | "Monitor" | "Warning",
    advisoryMessage: d.advisory_message,
  }));

  const atRisk = events.filter((e) => (e.weather?.rainProbability || 0) > 60);

  return (
    <AppShell>
      <PageHeader
        title="Weather"
        description="Forecasts and their measured impact on event turnout."
        crumbs={[{ label: "Weather" }]}
      />

      {atRisk.length > 0 && (
        <Alert className="rounded-xl border-warning/30 bg-warning/10">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          <AlertTitle>{atRisk.length} events at weather risk</AlertTitle>
          <AlertDescription>
            {atRisk
              .map((e) => e.title)
              .slice(0, 3)
              .join(", ")}
            {atRisk.length > 3 ? ` and ${atRisk.length - 3} more` : ""} have over 60% rain
            probability. Consider indoor backups.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <WeatherWidget {...cwAdapted} updated={cwAdapted.updated} />
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
          <StatCard
            index={0}
            label="Rain probability"
            value={`${cwAdapted.rainProbability}%`}
            icon={CloudRain}
            tone="info"
          />
          <StatCard
            index={1}
            label="Humidity"
            value={`${cwAdapted.humidity}%`}
            icon={Droplets}
            tone="primary"
          />
          <StatCard
            index={2}
            label="Wind speed"
            value={`${cwAdapted.windSpeed} km/h`}
            icon={Wind}
            tone="success"
          />
          <StatCard
            index={3}
            label="Events at risk"
            value={String(atRisk.length)}
            icon={AlertTriangle}
            tone="warning"
          />
        </div>
      </div>

      <SectionCard title="7-day forecast" description="Campus location">
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {forecastAdapted.map((d: any) => {
            const Icon = weatherIcon[d.condition as "Sunny" | "Cloudy" | "Rainy"] || weatherIcon["Sunny"];
            return (
              <div key={d.date} className="rounded-xl border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">{d.date.slice(5)}</p>
                <Icon className="mx-auto mt-2 size-7 text-primary" aria-hidden="true" />
                <p className="mt-2 text-lg font-semibold tabular-nums">{d.temperature}°</p>
                <p className="truncate text-[11px] text-muted-foreground">{d.condition}</p>
                <p className="mt-1 text-[11px] text-info tabular-nums">{d.rainProbability}% rain</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Hourly timeline" description="Temperature and rain probability">
          <WeatherTimelineChart data={timelineAdapted} />
        </SectionCard>
        <SectionCard title="Weather impact analysis" description="Average turnout by condition">
          <WeatherImpactChart data={weatherImpact} />
        </SectionCard>
      </div>

      <SectionCard
        title="Event weather outlook"
        description="Forecast per scheduled event"
        bodyClassName="p-0"
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
                  Condition
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Temp
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Rain
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Impact score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{e.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.weather?.condition || "Sunny"}</td>
                  <td className="px-5 py-3 tabular-nums">{e.weather?.temperature || 25}°C</td>
                  <td className="px-5 py-3 tabular-nums">{e.weather?.rainProbability || 0}%</td>
                  <td className="px-5 py-3 tabular-nums">{e.weather?.impactScore || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
