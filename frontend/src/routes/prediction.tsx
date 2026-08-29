import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Award,
  BarChart2,
  CheckCircle2,
  CloudRain,
  Cpu,
  Gauge,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Utensils,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AttendancePredictionChart,
  FeatureImportanceChart,
  ModelR2ComparisonChart,
  ModelErrorMetricsChart,
} from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MLModelName, VenueType, WeatherForecast } from "@/types";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/prediction")({
  head: () => ({
    meta: [
      { title: "Attendance Prediction & Model Evaluation — Eventify" },
      {
        name: "description",
        content:
          "Machine learning attendance forecasts, regression model benchmark (XGBoost, Gradient Boosting, Random Forest, Decision Tree, Linear Regression), and planning decision support.",
      },
    ],
  }),
  component: PredictionPage,
});

function PredictionPage() {
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const { data: modelEvaluations = [], isLoading: modelsLoading } = useQuery({
    queryKey: queryKeys.models,
    queryFn: api.getModelEvaluations,
  });

  const bestModel = useMemo(() => modelEvaluations.find((m) => m.isBestModel) || modelEvaluations[0], [modelEvaluations]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedModel, setSelectedModel] = useState<MLModelName | "">("");
  const [rainProb, setRainProb] = useState([0]);
  const [promoLevel, setPromoLevel] = useState([30]);
  const [venueCapacity, setVenueCapacity] = useState([500]);
  
  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) || events[0], [events, selectedEventId]);
  const currentModelMeta = useMemo(() => modelEvaluations.find((m) => m.name === selectedModel) || bestModel, [modelEvaluations, selectedModel, bestModel]);

  const { data: predictionData, mutate: runPrediction, isPending: isPredicting } = useMutation({
    mutationFn: api.runPrediction,
  });

  if (eventsLoading || modelsLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!events.length) {
    return (
      <AppShell>
        <div className="p-12 text-center text-muted-foreground">No events available to simulate.</div>
      </AppShell>
    );
  }

  // Set default values once data is loaded
  if (!selectedEventId) setSelectedEventId(events[0]?.id || "");
  if (!selectedModel && bestModel) setSelectedModel(bestModel.name);

  const handlePredict = () => {
    if (!selectedEvent) return;
    runPrediction({
      eventId: selectedEvent.id,
      eventType: selectedEvent.category,
      location: selectedEvent.location,
      venueCapacity: venueCapacity[0] || selectedEvent.capacity,
      ticketPriceLkr: 1000,
      promotionDays: promoLevel[0] || 30,
      registeredAttendees: selectedEvent.currentRegistrations,
      rainfallMm: rainProb[0] || 0,
      weatherCondition: rainProb[0]! > 6 ? "Rain" : "Clear",
      durationHours: 4,
      isWeekend: 0,
      isPublicHoliday: 0,
      modelName: selectedModel || bestModel?.name,
    });
  };

  const simAttendance = predictionData?.predictedAttendance ?? selectedEvent?.predictedAttendance ?? 0;
  const confidenceScore = predictionData?.confidenceScore ?? selectedEvent?.confidence ?? 0;
  const delta = predictionData?.difference ?? (simAttendance - (selectedEvent?.currentRegistrations ?? 0));
  const simInsights = predictionData?.insights ?? selectedEvent?.planningInsights ?? [];
  const featureWeights = predictionData?.featureWeights ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Attendance Prediction & Model Evaluation"
        description="Machine learning-based attendance estimation, multi-model evaluation benchmark, and weather-informed planning insights."
        crumbs={[{ label: "Attendance Prediction" }]}
        actions={
          <Button className="rounded-lg gap-2" onClick={handlePredict} disabled={isPredicting}>
            {isPredicting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Run Model Prediction
          </Button>
        }
      />

      {/* Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Top Model Accuracy"
          value={bestModel ? `${(bestModel.r2Score * 100).toFixed(1)}% R²` : "N/A"}
          delta={1.8}
          icon={Award}
          tone="primary"
          hint={`${bestModel?.name || "N/A"} (Best Evaluated)`}
        />
        <StatCard
          index={1}
          label="Benchmark MAE"
          value={bestModel ? `${bestModel.mae} pax` : "N/A"}
          icon={Gauge}
          tone="success"
          hint="Mean Absolute Error"
        />
        <StatCard
          index={2}
          label="Benchmark RMSE"
          value={bestModel ? `${bestModel.rmse} pax` : "N/A"}
          icon={Activity}
          tone="info"
          hint="Root Mean Squared Error"
        />
        <StatCard
          index={3}
          label="Models Evaluated"
          value={`${modelEvaluations.length} Algorithms`}
          icon={Cpu}
          hint="Linear, DT, RF, GBR, XGB"
        />
      </div>

      <Tabs defaultValue="simulator" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="simulator" className="gap-2">
            <Sparkles className="size-4" aria-hidden="true" /> Prediction Simulator & Decision Support
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="gap-2">
            <BarChart2 className="size-4" aria-hidden="true" /> ML Model Comparison & Benchmark
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Users className="size-4" aria-hidden="true" /> Per-Event Prediction Forecasts
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Prediction Simulator */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Input Controls */}
            <SectionCard
              title="Prediction Configuration"
              description="Adjust event parameters and select ML regression model"
              className="xl:col-span-1"
            >
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="sim-event">Target Event</Label>
                  <Select value={selectedEventId} onValueChange={(val) => {
                    setSelectedEventId(val);
                    const ev = events.find((e) => e.id === val);
                    if (ev) setVenueCapacity([ev.capacity]);
                  }}>
                    <SelectTrigger id="sim-event" className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sim-model">Regression Algorithm</Label>
                  <Select value={selectedModel} onValueChange={(val) => setSelectedModel(val as MLModelName)}>
                    <SelectTrigger id="sim-model" className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelEvaluations.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name} {m.isBestModel ? "★ (Best)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Selected model R² score: {currentModelMeta ? (currentModelMeta.r2Score * 100).toFixed(1) : "0"}%
                  </p>
                </div>

                <div className="grid gap-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <Label>Forecasted Rainfall (mm)</Label>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      {rainProb[0]} mm
                    </span>
                  </div>
                  <Slider value={rainProb} onValueChange={setRainProb} max={100} step={1} />
                </div>

                <div className="grid gap-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <Label>Promotion Duration (Days)</Label>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      {promoLevel[0]} Days
                    </span>
                  </div>
                  <Slider value={promoLevel} onValueChange={setPromoLevel} max={90} step={1} />
                </div>
                
                <div className="grid gap-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <Label>Venue Capacity</Label>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      {venueCapacity[0]}
                    </span>
                  </div>
                  <Slider value={venueCapacity} onValueChange={setVenueCapacity} max={5000} step={50} />
                </div>
              </div>
            </SectionCard>

            {/* Prediction Analytical Output */}
            <div className="space-y-6 xl:col-span-2">
              <SectionCard
                title="ML Prediction Output"
                description={`Forecast generated using ${selectedModel || "XGBoost"} for ${selectedEvent?.title}`}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <p className="text-xs font-medium text-primary">Predicted Attendance</p>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums">
                      {simAttendance.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Confidence: <span className="font-semibold text-primary">{confidenceScore}%</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground">Current Registrations</p>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums">
                      {selectedEvent?.currentRegistrations?.toLocaleString() || 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Venue Capacity: {venueCapacity[0]?.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground">Expected Difference</p>
                    <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                      {delta >= 0 ? `+${delta}` : delta}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {delta >= 0 ? "Walk-in surplus expected" : "Below confirmed sign-ups"}
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Intelligent Planning & Resource Decision Support */}
              <SectionCard
                title="Intelligent Planning & Resource Decision Support"
                description="Actionable recommendations derived from prediction vs registration delta and weather conditions"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {simInsights.map((ins) => (
                    <div key={ins.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        {ins.category === "capacity" && <Users className="size-4 text-primary" />}
                        {ins.category === "catering" && <Utensils className="size-4 text-warning" />}
                        {ins.category === "weather_contingency" && <ShieldAlert className="size-4 text-danger" />}
                        {ins.category === "staffing" && <CheckCircle2 className="size-4 text-success" />}
                        <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ins.message}</p>
                      <div className="mt-3 rounded-lg bg-muted/60 p-2 text-xs text-foreground">
                        <span className="font-semibold text-primary">Recommendation: </span>
                        {ins.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ML Model Benchmark */}
        <TabsContent value="benchmarks" className="space-y-6">
          <SectionCard
            title="Regression Model Performance Comparison"
            description="Evaluation of 5 machine learning regression algorithms to identify the optimal attendance predictor"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Coefficient of Determination (R² Score) — Higher is Better
                </h4>
                <ModelR2ComparisonChart data={modelEvaluations} />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Error Metrics (MAE & RMSE in Attendees) — Lower is Better
                </h4>
                <ModelErrorMetricsChart data={modelEvaluations} />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-medium">Algorithm</th>
                    <th scope="col" className="px-4 py-3 font-medium">R² Score</th>
                    <th scope="col" className="px-4 py-3 font-medium">MAE (Turnout)</th>
                    <th scope="col" className="px-4 py-3 font-medium">RMSE (Turnout)</th>
                    <th scope="col" className="px-4 py-3 font-medium">Training Speed</th>
                    <th scope="col" className="px-4 py-3 font-medium">Evaluation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modelEvaluations.map((m) => (
                    <tr key={m.id} className={`transition-colors ${m.isBestModel ? "bg-primary/5 font-medium" : "hover:bg-muted/40"}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{m.name}</span>
                          {m.isBestModel && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Best Model</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-foreground">{(m.r2Score * 100).toFixed(1)}% ({m.r2Score})</td>
                      <td className="px-4 py-3.5 tabular-nums text-foreground">{m.mae} pax</td>
                      <td className="px-4 py-3.5 tabular-nums text-foreground">{m.rmse} pax</td>
                      <td className="px-4 py-3.5 tabular-nums text-muted-foreground">{m.trainingTimeMs} ms</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${m.isBestModel ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                          {m.isBestModel ? "Selected for Production" : "Evaluated"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* TAB 3: Per-Event Prediction Forecasts */}
        <TabsContent value="events" className="space-y-6">
          <SectionCard
            title="Scheduled Events Attendance Forecasts"
            description="Summary of machine learning predictions and weather impacts across all planned events"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-5 py-3.5 font-medium">Event</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">Date & Venue</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">Registrations</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">ML Predicted</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">Expected Delta</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => {
                    const eventDelta = e.predictedAttendance - e.currentRegistrations;
                    return (
                      <tr key={e.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          <Link to="/events/$eventId" params={{ eventId: e.id }} className="hover:text-primary hover:underline">
                            {e.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{e.category}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          <p>{e.date}</p>
                          <p className="truncate">{e.location} ({e.venueType})</p>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-foreground">
                          {e.currentRegistrations}/{e.capacity}
                        </td>
                        <td className="px-5 py-3.5 font-semibold tabular-nums text-primary">
                          {e.predictedAttendance}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          <span className={`font-semibold ${eventDelta >= 0 ? "text-success" : "text-destructive"}`}>
                            {eventDelta >= 0 ? `+${eventDelta}` : eventDelta}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Button asChild variant="outline" size="sm" className="rounded-lg">
                            <Link to="/events/$eventId" params={{ eventId: e.id }}>
                              View Insights
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
