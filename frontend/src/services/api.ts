/**
 * Production-ready API abstraction layer for the Smart Event Management System.
 * Connects seamlessly to the backend REST API (FastAPI) with token authorization.
 */
import type {
  EventItem,
  HistoricalEvent,
  MLModelName,
  ModelEvaluation,
  PlanningInsight,
  PredictionResult,
  Registration,
  CheckInResponse,
  WeatherForecast,
  NotificationItem,
  ActivityItem,
  User,
  PaginatedEvents,
  EventQueryParams,
} from "@/types";



export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000/api/v1";

/** Get stored auth token from localStorage */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("sems-token");
  }
  return null;
}

/** Set auth token to localStorage */
export function setAuthToken(token: string | null): void {
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem("sems-token", token);
    } else {
      window.localStorage.removeItem("sems-token");
    }
  }
}

/** Base HTTP fetch client with authentication header injection */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (!token && !path.startsWith("/auth/")) {
    const error = new Error("No auth token available");
    (error as any).status = 401;
    throw error;
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      setAuthToken(null);
    }
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.detail || `Request failed: ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }

  // Handle empty responses
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export interface PredictionPayload {
  eventId?: string;
  eventType: string;
  location: string;
  venueCapacity: number;
  ticketPriceLkr: number;
  promotionDays: number;
  registeredAttendees?: number;
  socialMediaReach?: number;
  previousEventAttendance?: number;
  temperatureC?: number;
  humidityPct?: number;
  rainfallMm: number;
  windSpeedKmh?: number;
  weatherCondition: string;
  dayOfWeek?: number;
  isWeekend: number;
  isPublicHoliday: number;
  durationHours: number;
  modelName?: MLModelName;
}

export const api = {
  // Authentication
  login: async (email: string, password: string): Promise<any> => {
    const res = await http<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.accessToken) {
      setAuthToken(res.accessToken);
    }
    return res;
  },

  register: async (data: any): Promise<any> => {
    const res = await http<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.accessToken) {
      setAuthToken(res.accessToken);
    }
    return res;
  },

  logout: (): void => {
    setAuthToken(null);
  },

  // Events
  getEvents: (): Promise<EventItem[]> => http<EventItem[]>("/events"),

  getPaginatedEvents: (params: EventQueryParams = {}): Promise<PaginatedEvents> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
    if (params.search && params.search.trim()) searchParams.set("search", params.search.trim());
    if (params.category && params.category !== "all") searchParams.set("category", params.category);
    if (params.status && params.status !== "all") searchParams.set("status", params.status);
    if (params.sortBy) searchParams.set("sort_by", params.sortBy);
    if (params.order) searchParams.set("order", params.order);
    return http<PaginatedEvents>(`/events?${searchParams.toString()}`);
  },

  getEventCategories: (): Promise<string[]> => http<string[]>("/events/categories"),
  
  getEvent: (id: string): Promise<EventItem | null> =>
    http<EventItem>(`/events/${id}`).catch(() => null),

    
  createEvent: (data: Partial<EventItem>): Promise<EventItem> =>
    http<EventItem>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  updateEvent: (id: string, data: Partial<EventItem>): Promise<EventItem> =>
    http<EventItem>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  deleteEvent: (id: string): Promise<void> =>
    http<void>(`/events/${id}`, {
      method: "DELETE",
    }),

  // Users & RBAC
  getUsers: (): Promise<User[]> => http<User[]>("/users"),

  // Registrations
  getRegistrations: (): Promise<Registration[]> => http<Registration[]>("/registrations"),
  
  registerForEvent: (
    eventId: string,
    participantName: string,
    email: string,
  ): Promise<Registration> =>
    http<Registration>("/registrations", {
      method: "POST",
      body: JSON.stringify({ eventId, participantName, email }),
    }),
    
  cancelRegistration: (registrationId: string): Promise<boolean> =>
    http<any>(`/registrations/${registrationId}`, {
      method: "DELETE",
    }).then(() => true).catch(() => false),

  checkInParticipant: (ticketCode: string, eventId?: string): Promise<CheckInResponse> =>
    http<CheckInResponse>("/registrations/check-in", {
      method: "POST",
      body: JSON.stringify({ ticketCode, eventId }),
    }),


  // ML Predictions & Models
  getModelEvaluations: (): Promise<ModelEvaluation[]> => http<ModelEvaluation[]>("/models/benchmark"),
  
  runPrediction: (payload: PredictionPayload): Promise<PredictionResult> =>
    http<PredictionResult>("/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Historical Records
  getHistoricalEvents: (): Promise<HistoricalEvent[]> => http<HistoricalEvent[]>("/historical-events"),

  // Notifications, Activities & Reports
  getNotifications: (): Promise<NotificationItem[]> => http<NotificationItem[]>("/notifications"),
  getActivities: (): Promise<ActivityItem[]> => http<ActivityItem[]>("/activities"),
  getReports: (): Promise<any[]> => http<any[]>("/reports"),
  generateReport: (payload: { reportType: string; dateFrom?: string; dateTo?: string }): Promise<any> =>
    http<any>("/reports/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteReport: (id: string): Promise<boolean> =>
    http<any>(`/reports/${id}`, {
      method: "DELETE",
    }).then(() => true).catch(() => false),
  exportReportCsv: async (reportType: string): Promise<void> => {
    const token = getStoredToken();
    const url = `${API_BASE}/reports/export?report_type=${encodeURIComponent(reportType)}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error("Failed to export report CSV");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${reportType.toLowerCase().replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },

  // Weather
  getWeather: (): Promise<any> => http<any>("/weather"),

  // Analytics
  getAnalytics: (): Promise<any> => http<any>("/analytics"),
};

export const queryKeys = {
  events: ["events"] as const,
  paginatedEvents: (params: EventQueryParams) => ["events", "paginated", params] as const,
  eventCategories: ["events", "categories"] as const,
  event: (id: string) => ["events", id] as const,
  users: ["users"] as const,
  registrations: ["registrations"] as const,
  models: ["models"] as const,
  historical: ["historical"] as const,
  notifications: ["notifications"] as const,
  activities: ["activities"] as const,
  reports: ["reports"] as const,
  tasks: ["tasks"] as const,
  weather: ["weather"] as const,
  analytics: ["analytics"] as const,
};

