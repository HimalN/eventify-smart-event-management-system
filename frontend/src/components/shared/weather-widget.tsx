import { CloudRain, Cloud, CloudLightning, Sun, CloudSun, Droplets, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const weatherIcon: Record<string, LucideIcon> = {
  Sunny: Sun,
  Clear: Sun,
  "Partly Cloudy": CloudSun,
  Cloudy: Cloud,
  Rain: CloudRain,
  Rainy: CloudRain,
  Storm: CloudLightning,
};

interface Props {
  location: string;
  condition: string;
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  updated?: string;
}

export function WeatherWidget({
  location,
  condition,
  temperature,
  humidity,
  rainProbability,
  windSpeed,
  updated,
}: Props) {
  const Icon = weatherIcon[condition] ?? Cloud;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border p-5 text-primary-foreground shadow-[var(--shadow-lift)] [background-image:var(--gradient-brand)]">
      <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl" />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm/5 opacity-90">{location}</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{temperature}°C</p>
          <p className="text-sm opacity-90">{condition}</p>
        </div>
        <Icon className="size-12 shrink-0 opacity-90" aria-hidden="true" />
      </div>
      <dl className="relative mt-5 grid grid-cols-3 gap-2 text-xs">
        {[
          { Icon: Droplets, label: "Humidity", value: `${humidity}%` },
          { Icon: CloudRain, label: "Rain", value: `${rainProbability}%` },
          { Icon: Wind, label: "Wind", value: `${windSpeed} km/h` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <dt className="flex items-center gap-1 opacity-90">
              <m.Icon className="size-3" aria-hidden="true" />
              {m.label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{m.value}</dd>
          </div>
        ))}
      </dl>
      {updated && <p className="relative mt-3 text-[11px] opacity-80">{updated}</p>}
    </div>
  );
}
