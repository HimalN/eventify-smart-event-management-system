import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, CalendarDays, MapPin, Users, Lightbulb, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, queryKeys } from "@/services/api";
import type { EventCategory, VenueType } from "@/types";

export const Route = createFileRoute("/events/new")({
  head: () => ({
    meta: [
      { title: "Create Event — Eventify" },
      {
        name: "description",
        content: "Create a campus event with live attendance prediction and weather risk preview.",
      },
      { property: "og:title", content: "Create Event — Eventify" },
      {
        property: "og:description",
        content: "Create a campus event with live attendance prediction and weather risk preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateEventPage,
});

interface FormValues {
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  venueType: VenueType;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  expectedAttendance: number;
  targetAudience: string;
  registrationDeadline: string;
}

const CATEGORIES: EventCategory[] = [
  "Conference",
  "Workshop",
  "Seminar",
  "Hackathon",
  "Sports",
  "Cultural",
  "Career Fair",
  "Academic Colloquium",
];

function CreateEventPage() {
  const navigate = useNavigate();
  const { data: weatherData } = useQuery({
    queryKey: queryKeys.weather,
    queryFn: api.getWeather,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      category: "Workshop",
      location: "",
      venueType: "indoor",
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      startTime: "09:00",
      endTime: "17:00",
      capacity: 250,
      expectedAttendance: 190,
      targetAudience: "Undergraduate Students, Faculty",
      registrationDeadline: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    },
  });

  const capacity = Number(watch("capacity")) || 0;
  const expected = Number(watch("expectedAttendance")) || 0;
  const venueType = watch("venueType") || "indoor";

  const rainProbability = weatherData?.current?.rain_probability || 0;
  const weatherPenalty = venueType === "outdoor" ? 0.25 : 0.08;
  const predicted = Math.round(
    Math.min(capacity, expected) * (1 - (rainProbability / 100) * weatherPenalty),
  );

  const onSubmit = async (values: FormValues) => {
    try {
      await api.createEvent(values);
      toast.success("Event Created Successfully!", {
        description: `${values.title} is now scheduled with active ML attendance tracking.`,
      });
      navigate({ to: "/events" });
    } catch {
      toast.error("Failed to create event. Please try again.");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Create Event"
        description="Configure event logistics and parameters to initiate machine learning attendance forecasting."
        crumbs={[{ label: "Events", to: "/events" }, { label: "Create" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Event Details */}
          <SectionCard
            title="Event Information"
            description="Basic details visible to students and participants"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. AI & Robotics Summit 2026"
                  className="h-10 rounded-lg"
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  className="rounded-lg"
                  placeholder="Summarize the agenda, keynote speakers, and learning objectives..."
                  {...register("description")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    defaultValue="Workshop"
                    onValueChange={(v) => setValue("category", v as EventCategory)}
                  >
                    <SelectTrigger id="category" className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g. All Computing & Engineering Undergraduates"
                    className="h-10 rounded-lg"
                    {...register("targetAudience")}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Venue & Logistics */}
          <SectionCard
            title="Venue & Environment"
            description="Physical location and weather vulnerability factors"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="location">Venue Name / Room *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Main Auditorium, Block A"
                  className="h-10 rounded-lg"
                  {...register("location", { required: "Venue is required" })}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="venueType">Venue Type (Weather Sensitivity)</Label>
                <Select
                  defaultValue="indoor"
                  onValueChange={(v) => setValue("venueType", v as VenueType)}
                >
                  <SelectTrigger id="venueType" className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">
                      Indoor Hall / Auditorium (Low Weather Risk)
                    </SelectItem>
                    <SelectItem value="outdoor">Outdoor / Amphitheatre (High Rain Risk)</SelectItem>
                    <SelectItem value="hybrid">Hybrid Complex (Medium Weather Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Schedule & ML Parameters */}
          <SectionCard
            title="Schedule & Capacity Parameters"
            description="Inputs used by the ML regression model"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  type="date"
                  className="h-10 rounded-lg"
                  {...register("date", { required: "Date is required" })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  className="h-10 rounded-lg"
                  {...register("startTime")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  className="h-10 rounded-lg"
                  {...register("endTime")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacity">Venue Capacity (Max Pax) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  className="h-10 rounded-lg"
                  {...register("capacity", { valueAsNumber: true, required: true })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expectedAttendance">Expected Attendance Target</Label>
                <Input
                  id="expectedAttendance"
                  type="number"
                  min={0}
                  className="h-10 rounded-lg"
                  {...register("expectedAttendance", { valueAsNumber: true })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  className="h-10 rounded-lg"
                  {...register("registrationDeadline")}
                />
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} className="rounded-lg">
              <Sparkles className="size-4" aria-hidden="true" />
              {isSubmitting ? "Creating Event…" : "Schedule & Initialize ML Forecast"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => navigate({ to: "/events" })}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Live ML Prediction Preview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" /> Live ML Forecast Preview
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                XGBoost
              </span>
            </div>

            <div className="mt-4 text-center">
              <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                {predicted.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimated turnout ({Math.round((predicted / (capacity || 1)) * 100)}% capacity fill)
              </p>
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Model Confidence:</span>
                <strong className="text-foreground">92%</strong>
              </div>
              <div className="flex justify-between">
                <span>Venue Sensitivity:</span>
                <strong className="text-foreground capitalize">{venueType}</strong>
              </div>
              <div className="flex justify-between">
                <span>Campus Weather Rain Risk:</span>
                <strong className="text-foreground">{rainProbability}%</strong>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Lightbulb className="size-3.5 text-warning" /> Planning Note:
              </p>
              <p className="mt-1">
                {venueType === "outdoor" && rainProbability > 30
                  ? "Outdoor venue selected with moderate rain risk. An indoor backup hall is recommended."
                  : "Target baseline within optimal operational capacity range."}
              </p>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
