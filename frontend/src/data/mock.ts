import type {
  ActivityItem,
  EventCategory,
  EventItem,
  HistoricalEvent,
  ModelEvaluation,
  NotificationItem,
  PlanningInsight,
  Registration,
  User,
  VenueType,
  WeatherForecast,
} from "@/types";

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

const CONDITIONS: WeatherForecast["condition"][] = [
  "Sunny",
  "Partly Cloudy",
  "Cloudy",
  "Rain",
  "Storm",
];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const pick = <T>(arr: T[], seed: number) => arr[Math.floor(rand(seed) * arr.length)]!;
const between = (seed: number, min: number, max: number) =>
  Math.round(min + rand(seed) * (max - min));

const BASE = new Date("2026-08-07T00:00:00Z").getTime();
const dayOffset = (d: number) => new Date(BASE + d * 86400000).toISOString().slice(0, 10);

const TITLES = [
  "AI & Robotics Summit",
  "Cloud Native Workshop",
  "Annual Tech Symposium",
  "48h Campus Hackathon",
  "Inter-Faculty Sports Meet",
  "Cultural Night 2026",
  "Graduate Career Fair",
  "Data Science Bootcamp",
  "Cybersecurity Seminar",
  "Startup Pitch Day",
  "Green Energy Forum",
  "UX Design Masterclass",
  "Machine Learning Colloquium",
  "Alumni Networking Evening",
  "Research Poster Exhibition",
  "Mobile Dev Sprint",
  "Quantum Computing Talk",
  "Blockchain Deep Dive",
];

const VENUE_DATA: { name: string; type: VenueType }[] = [
  { name: "Main Auditorium", type: "indoor" },
  { name: "Innovation Hub, Block C", type: "indoor" },
  { name: "Engineering Lab 4", type: "indoor" },
  { name: "Open Air Amphitheatre", type: "outdoor" },
  { name: "Central Sports Complex", type: "hybrid" },
  { name: "Library Conference Room", type: "indoor" },
  { name: "Faculty of Science Hall", type: "indoor" },
];

const ORGANIZERS = [
  "Dr. Nimal Perera",
  "Prof. Aisha Rahman",
  "Kasun Fernando",
  "Dr. Leena Silva",
  "Rahul Mehta",
];

const PEOPLE = [
  "Amara Jayasinghe",
  "Dilan Wickrama",
  "Sara Ahmed",
  "Tharindu Bandara",
  "Meera Nair",
  "Chris O'Donnell",
  "Yuki Tanaka",
  "Fatima Zahra",
  "Nuwan Silva",
  "Elena Petrova",
  "Marcus Bailey",
  "Priya Raman",
];

function makeWeather(seed: number, date: string): WeatherForecast {
  const condition = pick(CONDITIONS, seed + 11);
  const rain =
    condition === "Storm"
      ? between(seed + 1, 70, 95)
      : condition === "Rain"
        ? between(seed + 2, 50, 80)
        : condition === "Sunny"
          ? between(seed + 3, 2, 15)
          : between(seed + 4, 15, 45);

  const advisory =
    rain > 65 || condition === "Storm"
      ? "attention_required"
      : rain > 35
        ? "moderate"
        : "favorable";

  const advisoryMessage =
    advisory === "attention_required"
      ? `${rain}% rain probability forecast. Heavy precipitation likely; activate indoor contingency protocol.`
      : advisory === "moderate"
        ? `Moderate weather risk (${rain}% rain, ${condition.toLowerCase()}). Monitor updates 24h prior.`
        : "Favorable clear weather conditions. Optimal for scheduled event operations.";

  return {
    date,
    condition,
    temperature: between(seed + 5, 22, 34),
    feelsLike: between(seed + 5, 25, 37),
    humidity: between(seed + 6, 45, 92),
    rainProbability: rain,
    windSpeed: between(seed + 7, 4, 28),
    impactScore: Math.max(5, 100 - rain - between(seed + 8, 0, 12)),
    advisory,
    advisoryMessage,
  };
}

export function generatePlanningInsights(
  predicted: number,
  registered: number,
  capacity: number,
  weather: WeatherForecast,
  venueType: VenueType,
): PlanningInsight[] {
  const insights: PlanningInsight[] = [];
  const delta = predicted - registered;
  const fillRate = predicted / capacity;

  if (fillRate > 0.9) {
    insights.push({
      id: "ins-cap",
      category: "capacity",
      priority: "high",
      title: "Capacity Nearing Limit",
      message: `Predicted attendance (${predicted}) reaches ${Math.round(fillRate * 100)}% of venue capacity (${capacity}).`,
      recommendation: "Open overflow seating tier or schedule an overflow streaming room.",
    });
  } else if (delta > 30) {
    insights.push({
      id: "ins-cap-exp",
      category: "capacity",
      priority: "medium",
      title: "Expected Walk-in Surplus",
      message: `Model predicts ${predicted} attendees vs ${registered} confirmed registrations (+${delta} walk-in turnout).`,
      recommendation: "Ensure 15-20% additional seating and registration desk lanes are prepared.",
    });
  }

  const cateringHeadcount = Math.round(predicted * 1.05);
  insights.push({
    id: "ins-cat",
    category: "catering",
    priority: "medium",
    title: "Catering Headcount Recommendation",
    message: `Based on predicted ${predicted} attendees, target refreshment quantity for ${cateringHeadcount} portions.`,
    recommendation: `Confirm catering order for ~${cateringHeadcount} pax to minimize waste while avoiding shortages.`,
  });

  if (
    weather.advisory === "attention_required" ||
    (venueType === "outdoor" && weather.rainProbability > 40)
  ) {
    insights.push({
      id: "ins-wea",
      category: "weather_contingency",
      priority: "high",
      title: "Weather Contingency Required",
      message: `${weather.rainProbability}% rain forecasted on event day (${weather.condition}). Outdoor/hybrid operations at high risk.`,
      recommendation:
        venueType === "outdoor"
          ? "Switch event venue to indoor backup hall (Block C) immediately."
          : "Deploy entrance canopy shelter and alert building facilities for wet-weather flow.",
    });
  } else {
    insights.push({
      id: "ins-wea-fav",
      category: "weather_contingency",
      priority: "low",
      title: "Favorable Weather Forecast",
      message: `Expected ${weather.condition} with low rain risk (${weather.rainProbability}%).`,
      recommendation: "No adverse weather mitigation necessary. Proceed with standard logistics.",
    });
  }

  const staffNeeded = Math.max(3, Math.ceil(predicted / 50));
  insights.push({
    id: "ins-stf",
    category: "staffing",
    priority: "low",
    title: "Support Staff & Volunteer Sizing",
    message: `Optimal ratio indicates ${staffNeeded} student volunteers/ushers required for ${predicted} attendees.`,
    recommendation: `Assign ${Math.ceil(staffNeeded * 0.4)} volunteers to check-in desks and ${Math.ceil(staffNeeded * 0.6)} to hall coordination.`,
  });

  return insights;
}

// ── Synthetic Mocks Fallbacks (used if backend is offline) ────────────────────

const mockEvents: EventItem[] = TITLES.map((title, i) => {
  const offset = i - 6;
  const date = dayOffset(offset * 3);
  const capacity = between(i + 20, 100, 900);
  const registrationsCount = Math.min(capacity, between(i + 30, 40, capacity));
  const weather = makeWeather(i * 5, date);
  const venue = pick(VENUE_DATA, i + 3);
  const predicted = Math.round(
    registrationsCount * (0.65 + rand(i + 40) * 0.3) * (1 - weather.rainProbability / 350),
  );
  const status: EventItem["status"] =
    offset < -1 ? "completed" : offset < 0 ? "ongoing" : i % 9 === 8 ? "draft" : "upcoming";

  return {
    id: `evt-${String(i + 1).padStart(3, "0")}`,
    title,
    description:
      "A flagship university campus event bringing together students, faculty researchers, and industry leaders for technical talks, interactive workshops, and networking.",
    location: venue.name,
    venueType: venue.type,
    category: pick(CATEGORIES, i + 7),
    date,
    startTime: `${String(between(i + 50, 8, 15)).padStart(2, "0")}:00`,
    endTime: `${String(between(i + 60, 16, 20)).padStart(2, "0")}:30`,
    capacity,
    expectedAttendance: Math.round(capacity * 0.78),
    currentRegistrations: registrationsCount,
    predictedAttendance: predicted,
    confidence: between(i + 70, 82, 97),
    actualAttendance:
      status === "completed" ? Math.round(predicted * (0.92 + rand(i) * 0.16)) : null,
    status,
    organizer: pick(ORGANIZERS, i + 2),
    targetAudience: "Undergraduate & Postgraduate Students, Faculty, Industry Guests",
    registrationDeadline: dayOffset(offset * 3 - 2),
    bannerHue: (i * 37) % 360,
    weather,
    modelUsed: "XGBoost",
    planningInsights: generatePlanningInsights(
      predicted,
      registrationsCount,
      capacity,
      weather,
      venue.type,
    ),
  };
});

const mockModelEvaluations: ModelEvaluation[] = [
  {
    id: "mod-xgb",
    name: "XGBoost",
    mae: 12.4,
    rmse: 16.1,
    r2Score: 0.946,
    trainingTimeMs: 1420,
    isBestModel: true,
    description: "Extreme Gradient Boosting model with gradient-based regularization.",
  },
  {
    id: "mod-gbr",
    name: "Gradient Boosting Regression",
    mae: 14.9,
    rmse: 19.2,
    r2Score: 0.928,
    trainingTimeMs: 1180,
    isBestModel: false,
    description: "Sequential additive boosting model.",
  },
  {
    id: "mod-rfr",
    name: "Random Forest Regression",
    mae: 16.8,
    rmse: 21.5,
    r2Score: 0.912,
    trainingTimeMs: 890,
    isBestModel: false,
    description: "Ensemble of bagging decision trees.",
  },
];

const mockUsers: User[] = PEOPLE.map((name, i) => ({
  id: `usr-${String(i + 1).padStart(3, "0")}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@university.edu`,
  role: i < 2 ? "admin" : i < 6 ? "organizer" : "participant",
  department: pick(
    ["Computer Science", "Engineering", "Business", "Design", "Science", "Humanities"],
    i + 4,
  ),
  status: i % 7 === 6 ? "invited" : i % 11 === 10 ? "suspended" : "active",
  joinedAt: dayOffset(-between(i + 9, 30, 700)),
  avatarHue: (i * 53) % 360,
}));

const mockRegistrations: Registration[] = Array.from({ length: 12 }, (_, i) => {
  const event = mockEvents[i % mockEvents.length]!;
  const person = PEOPLE[i % PEOPLE.length]!;
  return {
    id: `reg-${String(i + 1).padStart(3, "0")}`,
    eventId: event.id,
    eventTitle: event.title,
    participant: person,
    email: `${person.toLowerCase().replace(/[^a-z]+/g, ".")}@university.edu`,
    registeredAt: dayOffset(-between(i + 12, 1, 40)),
    status: i % 9 === 8 ? "waitlisted" : i % 13 === 12 ? "cancelled" : "confirmed",
    attendance: event.status === "completed" ? (i % 4 === 3 ? "absent" : "attended") : "pending",
    ticketCode: `SEMS-${event.id.slice(-3)}-${String(1000 + i * 37).slice(0, 4)}`,
  };
});

const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "reminder",
    title: "Upcoming Event Reminder",
    body: "AI & Robotics Summit starts in 2 days.",
    time: "12 min ago",
    read: false,
  },
];

const mockActivities: ActivityItem[] = [
  {
    id: "a1",
    actor: "Kasun Fernando",
    action: "created event",
    target: "Startup Pitch Day",
    time: "8 min ago",
  },
];

const mockTasks = [
  {
    id: "t1",
    title: "Confirm catering count based on predicted 340 attendees",
    due: "Today",
    priority: "high" as const,
  },
];

const mockReports = [
  {
    id: "r1",
    name: "Attendance Prediction & Model Evaluation Report",
    period: "August 2026",
    records: 1284,
    generated: "07 Aug 2026",
  },
];

// ── Dynamic Live Variables ────────────────────────────────────────────────────

export let events: EventItem[] = mockEvents;
export let modelEvaluations: ModelEvaluation[] = mockModelEvaluations;
export let users: User[] = mockUsers;
export let registrations: Registration[] = mockRegistrations;
export let notifications: NotificationItem[] = mockNotifications;
export let activities: ActivityItem[] = mockActivities;
export let upcomingTasks: any[] = mockTasks;
export let reports: any[] = mockReports;
export let historicalEvents: HistoricalEvent[] = [];

export let monthlyEvents: any[] = [];
export let attendanceTrend: any[] = [];
export let registrationTrends: any[] = [];
export let weatherImpact: any[] = [];
export let featureImportance: any[] = [];
export let forecast7Day: WeatherForecast[] = [];
export let weatherTimeline: any[] = [];
export let currentWeather: any = {
  location: "University Main Campus, Colombo",
  condition: "Partly Cloudy",
  temperature: 29,
  feelsLike: 33,
  humidity: 74,
  rainProbability: 35,
  windSpeed: 12,
  impactScore: 81,
  advisory: "moderate",
  advisoryMessage: "Moderate weather risk (35% rain).",
  updated: "Mock data fallback",
};

// ── Synchronous HTTP Fetch from FastAPI Backend ───────────────────────────────

function syncFetch(path: string): any {
  if (typeof window === "undefined") return null;
  
  const token = window.localStorage.getItem("sems-token");
  if (!token) return null;

  try {
    const xhr = new XMLHttpRequest();
    // Synchronous request
    xhr.open("GET", `http://localhost:8000/api/v1${path}`, false);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(null);
    
    if (xhr.status === 200) {
      return JSON.parse(xhr.responseText);
    }
    if (xhr.status === 401) {
      window.localStorage.removeItem("sems-token");
    }
  } catch (e) {
    // Fail silently, falls back to mocks
  }
  return null;
}

// Perform active backend sync on page/module load
if (typeof window !== "undefined") {
  const liveEvents = syncFetch("/events");
  if (liveEvents && Array.isArray(liveEvents)) {
    events = liveEvents;
  }

  const liveUsers = syncFetch("/users");
  if (liveUsers && Array.isArray(liveUsers)) {
    users = liveUsers;
  }

  const liveRegistrations = syncFetch("/registrations");
  if (liveRegistrations && Array.isArray(liveRegistrations)) {
    registrations = liveRegistrations;
  }

  const liveNotifications = syncFetch("/notifications");
  if (liveNotifications && Array.isArray(liveNotifications)) {
    notifications = liveNotifications;
  }

  const liveActivities = syncFetch("/activities");
  if (liveActivities && Array.isArray(liveActivities)) {
    activities = liveActivities;
  }

  const liveTasks = syncFetch("/tasks");
  if (liveTasks && Array.isArray(liveTasks)) {
    upcomingTasks = liveTasks;
  }

  const liveReports = syncFetch("/reports");
  if (liveReports && Array.isArray(liveReports)) {
    reports = liveReports;
  }

  const liveModels = syncFetch("/models/benchmark");
  if (liveModels && Array.isArray(liveModels)) {
    modelEvaluations = liveModels;
  }

  const liveHist = syncFetch("/historical-events");
  if (liveHist && Array.isArray(liveHist)) {
    historicalEvents = liveHist;
  }

  const liveWeather = syncFetch("/weather");
  if (liveWeather && liveWeather.current) {
    currentWeather = liveWeather.current;
    forecast7Day = liveWeather.forecast || [];
    weatherTimeline = liveWeather.timeline || [];
  }

  const liveAnalytics = syncFetch("/analytics");
  if (liveAnalytics && liveAnalytics.monthlyEvents) {
    monthlyEvents = liveAnalytics.monthlyEvents;
    attendanceTrend = liveAnalytics.attendanceTrend || [];
    registrationTrends = liveAnalytics.registrationTrends || [];
    weatherImpact = liveAnalytics.weatherImpact || [];
    featureImportance = liveAnalytics.featureImportance || [];
  }
}
