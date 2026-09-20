export type Role = "admin" | "organizer" | "participant";

export type EventStatus = "draft" | "upcoming" | "ongoing" | "completed" | "cancelled";

export type VenueType = "indoor" | "outdoor" | "hybrid";

export type WeatherAdvisory = "favorable" | "moderate" | "attention_required";

export type EventCategory =
  | "Conference"
  | "Workshop"
  | "Seminar"
  | "Hackathon"
  | "Sports"
  | "Cultural"
  | "Career Fair"
  | "Academic Colloquium";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: "active" | "invited" | "suspended";
  joinedAt: string;
  avatarHue: number;
}

export interface WeatherForecast {
  date: string;
  condition: "Sunny" | "Cloudy" | "Rain" | "Storm" | "Partly Cloudy";
  temperature: number;
  feelsLike?: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  impactScore: number;
  advisory: WeatherAdvisory;
  advisoryMessage: string;
}

export type MLModelName =
  | "Linear Regression"
  | "Decision Tree Regression"
  | "Random Forest Regression"
  | "Gradient Boosting Regression"
  | "XGBoost";

export interface ModelEvaluation {
  id: string;
  name: MLModelName;
  mae: number;
  rmse: number;
  r2Score: number;
  trainingTimeMs: number;
  isBestModel: boolean;
  description: string;
}

export interface PlanningInsight {
  id: string;
  category: "capacity" | "catering" | "staffing" | "weather_contingency" | "logistics";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  recommendation: string;
}

export interface PredictionResult {
  eventId: string;
  eventTitle: string;
  modelName: MLModelName;
  predictedAttendance: number;
  expectedAttendance: number;
  currentRegistrations: number;
  difference: number;
  confidenceScore: number;
  generatedAt: string;
  featureWeights: { feature: string; weight: number }[];
  insights: PlanningInsight[];
}

export interface HistoricalEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  venue: string;
  venueType: VenueType;
  capacity: number;
  registrations: number;
  predictedAttendance: number;
  actualAttendance: number;
  accuracyRate: number;
  weatherCondition: WeatherForecast["condition"];
  rainProbability: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  venueType: VenueType;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  expectedAttendance: number;
  currentRegistrations: number;
  predictedAttendance: number;
  confidence: number;
  actualAttendance: number | null;
  status: EventStatus;
  organizer: string;
  targetAudience: string;
  registrationDeadline: string;
  bannerHue: number;
  weather: WeatherForecast;
  modelUsed: MLModelName;
  planningInsights: PlanningInsight[];
}

<<<<<<< HEAD
export interface PaginatedEvents {
  items: EventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface Registration {

=======
export interface Registration {
>>>>>>> 1e84df882758a8315a2b307f308c3c92965815ad
  id: string;
  eventId: string;
  eventTitle: string;
  participant: string;
  email: string;
  registeredAt: string;
  status: "confirmed" | "waitlisted" | "cancelled";
  attendance: "attended" | "absent" | "pending";
  ticketCode: string;
<<<<<<< HEAD
  checkedInAt?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  registration?: Registration;
  alreadyCheckedIn: boolean;
  timestamp: string;
}


=======
}

>>>>>>> 1e84df882758a8315a2b307f308c3c92965815ad
export interface NotificationItem {
  id: string;
  type: "reminder" | "registration" | "weather" | "prediction" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}
