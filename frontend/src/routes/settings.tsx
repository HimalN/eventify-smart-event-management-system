import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Moon, Save, Sun } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/theme-context";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Eventify" },
      {
        name: "description",
        content:
          "Configure appearance, notifications, prediction model and weather integration settings.",
      },
      { property: "og:title", content: "Settings — Eventify" },
      {
        property: "og:description",
        content:
          "Configure appearance, notifications, prediction model and weather integration settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const toggles = [
  {
    id: "email-alerts",
    label: "Email alerts",
    hint: "Reminders and registration confirmations by email.",
  },
  {
    id: "weather-alerts",
    label: "Weather alerts",
    hint: "Notify me when rain risk exceeds 60% for an event.",
  },
  {
    id: "prediction-updates",
    label: "Prediction updates",
    hint: "Notify me when a forecast changes by more than 10%.",
  },
  {
    id: "weekly-digest",
    label: "Weekly digest",
    hint: "A Monday summary of upcoming events and performance.",
  },
];

function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Preferences for appearance, alerts and integrations."
        crumbs={[{ label: "Settings" }]}
        actions={
          <Button className="rounded-lg" onClick={() => toast.success("Settings saved")}>
            <Save className="size-4" aria-hidden="true" /> Save
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Appearance" description="Theme and display density">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => theme !== "light" && toggle()}
            >
              <Sun className="size-4" aria-hidden="true" /> Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => theme !== "dark" && toggle()}
            >
              <Moon className="size-4" aria-hidden="true" /> Dark
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your theme preference is saved on this device.
          </p>
        </SectionCard>

        <SectionCard title="Notifications" description="Choose what you want to hear about">
          <ul className="space-y-4">
            {toggles.map((t, i) => (
              <li key={t.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Label htmlFor={t.id} className="text-sm font-medium">
                      {t.label}
                    </Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
                  </div>
                  <Switch id={t.id} defaultChecked={i < 3} />
                </div>
                {i < toggles.length - 1 && <Separator className="mt-4" />}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Prediction model" description="Attendance forecasting configuration">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="model-version">Active model</Label>
              <Input
                id="model-version"
                defaultValue="attendance-predictor v2.4"
                className="h-10 rounded-lg"
                readOnly
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confidence-threshold">Minimum confidence to publish (%)</Label>
              <Input
                id="confidence-threshold"
                type="number"
                defaultValue={80}
                min={0}
                max={100}
                className="h-10 rounded-lg"
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="auto-retrain" className="text-sm font-medium">
                  Automatic retraining
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Retrain nightly using the latest attendance data.
                </p>
              </div>
              <Switch id="auto-retrain" defaultChecked />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Weather integration" description="Forecast provider settings">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weather-location">Default location</Label>
              <Input
                id="weather-location"
                defaultValue="Colombo, Sri Lanka"
                className="h-10 rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weather-refresh">Refresh interval (minutes)</Label>
              <Input
                id="weather-refresh"
                type="number"
                defaultValue={30}
                min={5}
                className="h-10 rounded-lg"
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="risk-flag" className="text-sm font-medium">
                  Flag high-risk events
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Highlight events with over 60% rain probability.
                </p>
              </div>
              <Switch id="risk-flag" defaultChecked />
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
