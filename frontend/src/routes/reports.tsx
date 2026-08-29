import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileBarChart, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Eventify" },
      {
        name: "description",
        content: "Generate and export attendance, registration, weather and prediction reports.",
      },
      { property: "og:title", content: "Reports — Eventify" },
      {
        property: "og:description",
        content: "Generate and export attendance, registration, weather and prediction reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

const TYPES = [
  "Attendance Report",
  "Registration Report",
  "Weather Report",
  "Event Performance",
  "Prediction Report",
];

function ReportsPage() {
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: queryKeys.reports,
    queryFn: api.getReports,
  });

  const { data: historicalEvents = [], isLoading: historicalLoading } = useQuery({
    queryKey: queryKeys.historical,
    queryFn: api.getHistoricalEvents,
  });

  if (reportsLoading || historicalLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Build, preview and export operational reports."
        crumbs={[{ label: "Reports" }]}
      />

      <SectionCard title="Generate a report" description="Choose a type and date range">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="report-type">Report type</Label>
            <Select defaultValue="Attendance Report">
              <SelectTrigger id="report-type" className="h-10 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" className="h-10 rounded-lg" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" className="h-10 rounded-lg" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="rounded-lg" onClick={() => toast.success("Report generated")}>
            <FileBarChart className="size-4" aria-hidden="true" /> Generate
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => toast.success("Exporting PDF…")}
          >
            <FileText className="size-4" aria-hidden="true" /> Export PDF
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => toast.success("Exporting Excel…")}
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" /> Export Excel
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Historical Event Turnout & Prediction Records"
        description="Archive of completed university events with ground-truth attendance and model accuracy metrics"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Event Name
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Date & Category
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Registrations
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  ML Predicted
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Actual Turnout
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Prediction Accuracy
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Weather Condition
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historicalEvents.map((h: any) => (
                <tr key={h.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3.5 font-medium text-foreground">{h.title}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    <p>{h.date}</p>
                    <p>{h.category}</p>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-foreground">{h.registered}</td>
                  <td className="px-5 py-3.5 tabular-nums text-primary font-medium">
                    {h.predicted}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-foreground font-semibold">
                    {h.actual}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        h.accuracyRate >= 95
                          ? "bg-success/15 text-success"
                          : h.accuracyRate >= 90
                            ? "bg-primary/15 text-primary"
                            : "bg-warning/15 text-warning"
                      }`}
                    >
                      {h.accuracyRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{h.weather}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Generated System Reports"
        description="Previously compiled exports"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">
                  Report
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Period
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Records
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Generated
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-right">
                  Download
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((r: any) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{r.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.period}</td>
                  <td className="px-5 py-3 tabular-nums">{r.records?.toLocaleString() || r.records}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.generated}</td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => toast.success(`Downloading ${r.name}`)}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      <span className="sr-only">Download {r.name}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
