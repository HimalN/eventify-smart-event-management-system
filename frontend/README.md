# Smart Event Management System with Attendance Prediction and Weather Forecast Integration

[![React 19](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start%20%2F%20Router-orange.svg)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.2-38bdf8.svg)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/UI-shadcn%2Fui-black.svg)](https://ui.shadcn.com/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f472b6.svg)](https://bun.sh/)
[![FastAPI Ready](https://img.shields.io/badge/Backend-FastAPI%20REST-009688.svg)](https://fastapi.tiangolo.com/)

An intelligent, full-stack event intelligence and logi
stics management web platform. The system bridges campus event management with **Machine Learning turnout regression models** and **real-time weather forecast integration** to provide event organizers and university administrators with proactive decision support for capacity planning, catering headcounts, staffing allocation, and weather contingencies.

---

## 📌 Project Overview & Architecture

Academic and institutional event organizers frequently face discrepancies between **registered attendees** and **actual physical turnout** due to no-show variance, walk-in turnouts, and weather disruptions.

This platform resolves operational risks through an automated end-to-end intelligence pipeline:

$$\text{Event Logistics \& Registrations} \longrightarrow \text{Live Campus Weather Telemetry} \longrightarrow \text{ML Regression Turnout Engine} \longrightarrow \text{Actionable Planning Insights}$$

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│   TanStack Start + UI   │ ◄───► │  Typed REST API Layer   │ ◄───► │  FastAPI / ML Engine    │
│  React 19 + Tailwind v4 │       │  TanStack Query v5 Cache│       │  XGBoost & Scikit-Learn │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

---

## 💻 Frontend Technologies & Stack

The frontend is constructed with modern web standards, emphasizing strict type safety, responsive performance, accessible UI design, and real-time visualization.

### Core Framework & Routing

- **[TanStack Start](https://tanstack.com/start)**: Full-stack React framework providing server-side rendering (SSR), streaming hydration, and server functions powered by Nitro.
- **[TanStack Router](https://tanstack.com/router)**: 100% typesafe, file-based routing with integrated search parameter validation and route tree generation.
- **[React 19](https://react.dev/)**: Latest React runtime utilizing modern hooks, transitions, and concurrent rendering.
- **[TypeScript 5.8](https://www.typescriptlang.org/)**: End-to-end static typing across UI components, form schemas, API models, and router navigation.

### State Management & Data Fetching

- **[TanStack React Query v5](https://tanstack.com/query)**: Asynchronous state management, query caching, background data revalidation, optimistic mutations, and declarative query keys.

### Styling, UI & Design System

- **[Tailwind CSS v4](https://tailwindcss.com/)**: Next-generation utility-first CSS engine with Vite plugin integration (`@tailwindcss/vite`).
- **[shadcn/ui Primitives](https://ui.shadcn.com/)**: Accessible, themeable UI components built on top of **Radix UI Primitives** (`@radix-ui/react-*` including Dialog, Dropdown Menu, Tabs, Slider, Progress, Popover, Select, Accordion, Tooltip, Avatar, Collapsible, Navigation Menu, etc.).
- **[Lucide React](https://lucide.dev/)**: Comprehensive icon library for consistent visual language.
- **[Motion](https://motion.dev/)**: High-performance fluid animations, spring transitions, and micro-interactions.
- **[Class Variance Authority (CVA)](https://cva.style/) & [tailwind-merge](https://github.com/dcastil/tailwind-merge)**: Dynamic component variant management and conflict-free CSS class concatenation.

### Charts & Data Visualization

- **[Recharts v2](https://recharts.org/)**: Composable SVG charting engine rendering interactive Area Charts, Bar Charts, Radar Charts, and Comparative Trend lines for turnout analytics and model benchmarking.

### Forms & Validation

- **[React Hook Form](https://react-hook-form.com/)**: High-performance, uncontrolled form management with minimal re-renders.
- **[Zod](https://zod.dev/)**: Schema definition and TypeScript validation library paired with `@hookform/resolvers/zod`.

### Specialized UI Utilities

- **[date-fns](https://date-fns.org/)**: Modern and modular date manipulation and calendar formatting.
- **[Sonner](https://sonner.emilkowal.ski/)**: Rich, responsive toast notification system.
- **[cmdk](https://cmdk.paco.me/)**: Fast, unstyled command menu palette and fuzzy search.
- **[Vaul](https://vaul.emilkowal.ski/)**: Mobile-ready drawer component.
- **[Embla Carousel](https://www.embla-carousel.com/)**: Smooth, touch-friendly carousel slider.
- **[React Day Picker](https://daypicker.dev/)**: Flexible date picker component.
- **[Input OTP](https://input-otp.rodz.dev/)**: Accessible one-time password and ticket pin inputs.

### Build Tooling & Environment

- **[Vite 8](https://vite.dev/)**: Next-generation frontend build tool with Lightning CSS and Fast Refresh.
- **[Bun](https://bun.sh/)**: Fast all-in-one JavaScript runtime, test runner, and package manager.
- **[ESLint 9](https://eslint.org/) & [Prettier](https://prettier.io/)**: Strict code linting and uniform code styling.

---

## 🧭 Frontend Application Routes

| Route Path                                | Description                        | Key Capabilities                                                                                           |
| :---------------------------------------- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `/`                                       | **Landing Page**                   | System introduction, value proposition, quick metrics, and live preview.                                   |
| `/dashboard`                              | **Unified Dashboard**              | Role-adaptive workspace (Admin, Organizer, Participant) with KPIs and schedule.                            |
| `/prediction`                             | **Prediction Simulator**           | Real-time "What-If" turnout simulator, scenario tweaking, and 5-model benchmark evaluation.                |
| `/events`                                 | **Event Catalog**                  | Searchable event explorer with category, venue, and status filters.                                        |
| `/events/$eventId`                        | **Event Detail & Decision Hub**    | Complete event logistics, live weather telemetry, 1-click registration, and automated planning insights.   |
| `/events/new`                             | **Event Creation Studio**          | Event creation form with real-time ML prediction preview and weather forecast sync.                        |
| `/analytics`                              | **Analytics & Intelligence**       | Turnout vs registration metrics, weather correlation charts, and feature weight breakdowns.                |
| `/reports`                                | **Reports & Turnout Archives**     | Ground-truth historical event records and multi-format PDF/Excel export engine.                            |
| `/weather`                                | **Weather Intelligence Hub**       | 7-day campus forecast, hourly impact timeline, and operational advisory status.                            |
| `/my-events`                              | **Participant Tickets & Schedule** | Registered event passes, QR ticket codes, and personalized event reminders.                                |
| `/users`                                  | **User & RBAC Management**         | Administrator user directory, role assignments (`admin`, `organizer`, `participant`), and status controls. |
| `/notifications`                          | **Notification Stream**            | Live weather alerts, prediction threshold notifications, and registration updates.                         |
| `/settings`                               | **Platform Settings**              | ML confidence thresholds, weather risk sensitivities, and theme preferences.                               |
| `/profile`                                | **User Profile**                   | Personal information, department affiliations, and role privileges.                                        |
| `/login`, `/register`, `/forgot-password` | **Authentication Suite**           | Secure sign-in, account onboarding, email verification, and password reset flows.                          |

---

## 🧠 Machine Learning Regression Benchmark

The system integrates and benchmarks **5 regression algorithms** to predict event turnout based on historical attendance, registration velocity, weather factors, venue type, and schedule:

| Model Algorithm                  |    $R^2$ Score    | MAE (Pax) | RMSE (Pax) | Training Time  | Evaluation Status                        |
| :------------------------------- | :---------------: | :-------: | :--------: | :------------: | :--------------------------------------- |
| **XGBoost Regression**           | **0.946** (94.6%) | **12.4**  |  **16.1**  | $42\text{ ms}$ | 🏆 **Production Model (Best Evaluated)** |
| **Gradient Boosting Regression** | **0.928** (92.8%) | **14.9**  |  **19.2**  | $68\text{ ms}$ | Evaluated Benchmark                      |
| **Random Forest Regression**     | **0.912** (91.2%) | **16.8**  |  **21.5**  | $84\text{ ms}$ | Evaluated Benchmark                      |
| **Decision Tree Regression**     | **0.815** (81.5%) | **26.4**  |  **33.1**  | $12\text{ ms}$ | Baseline Tree Model                      |
| **Linear Regression**            | **0.742** (74.2%) | **34.2**  |  **42.8**  | $4\text{ ms}$  | Baseline Linear Model                    |

### ML Feature Weight Distribution

- **Historical Attendance Trend**: $32\%$
- **Rain Probability & Weather Severity**: $26\%$
- **Registration Velocity & Rate**: $19\%$
- **Event Category & Target Audience**: $11\%$
- **Day of Week & Schedule**: $8\%$
- **Venue Type (Indoor vs. Outdoor Sensitivity)**: $4\%$

---

## 🔌 Complete REST API Reference

The frontend interacts with the backend service through a typed API client (`src/services/api.ts`). The default base URL is `http://localhost:8000/api/v1` (configurable via `VITE_API_BASE_URL`).

### 1. Events API

#### `GET /api/v1/events`

- **Method Call**: `api.getEvents()`
- **Query Key**: `queryKeys.events` (`["events"]`)
- **Description**: Retrieves all scheduled and past campus events with current registration counts, predicted attendance, confidence scores, and weather forecasts.
- **Response**: `EventItem[]`

#### `GET /api/v1/events/{id}`

- **Method Call**: `api.getEvent(id: string)`
- **Query Key**: `queryKeys.event(id)` (`["events", id]`)
- **Description**: Retrieves single event details including venue vulnerability, weather advisory, model used, and generated planning insights.
- **Response**: `EventItem | null`

#### `POST /api/v1/events`

- **Method Call**: `api.createEvent(data: Partial<EventItem>)`
- **Description**: Creates a new event, initializes baseline ML prediction, and generates automated planning insights (catering, capacity, staffing).
- **Request Body**:
  ```json
  {
    "title": "Annual AI & Robotics Hackathon",
    "description": "48-hour student innovation challenge",
    "location": "Innovation Hub & Courtyard",
    "venueType": "hybrid",
    "category": "Hackathon",
    "date": "2026-09-15",
    "startTime": "09:00",
    "endTime": "18:00",
    "capacity": 300,
    "expectedAttendance": 240,
    "organizer": "School of Computing",
    "targetAudience": "Undergraduates & Faculty",
    "registrationDeadline": "2026-09-12"
  }
  ```
- **Response**: `EventItem`

---

### 2. ML Prediction & Turnout Simulator API

#### `POST /api/v1/predict`

- **Method Call**: `api.runPrediction(payload: PredictionPayload)`
- **Description**: Runs an on-demand turnout simulation using calibrated regression models with adjustable scenario variables.
- **Request Body (`PredictionPayload`)**:
  ```json
  {
    "eventId": "evt-001",
    "category": "Conference",
    "venueType": "outdoor",
    "capacity": 350,
    "expectedAttendance": 280,
    "rainProbability": 45,
    "promotionIntensity": 75,
    "modelName": "XGBoost"
  }
  ```
- **Response (`PredictionResult`)**:
  ```json
  {
    "eventId": "evt-001",
    "eventTitle": "Campus AI Summit",
    "modelName": "XGBoost",
    "predictedAttendance": 226,
    "expectedAttendance": 280,
    "currentRegistrations": 210,
    "difference": 16,
    "confidenceScore": 95,
    "generatedAt": "14:30",
    "featureWeights": [
      { "feature": "Historical Attendance", "weight": 32 },
      { "feature": "Rain Probability", "weight": 26 }
    ],
    "insights": [
      {
        "id": "ins-1",
        "category": "weather_contingency",
        "priority": "high",
        "title": "Outdoor Rain Risk",
        "message": "Rain probability at 45% for outdoor venue.",
        "recommendation": "Prepare marquee tents or reserve adjacent indoor hall."
      }
    ]
  }
  ```

#### `GET /api/v1/models/benchmark`

- **Method Call**: `api.getModelEvaluations()`
- **Query Key**: `queryKeys.models` (`["models"]`)
- **Description**: Fetches comparative benchmark performance metrics across all evaluated regression models.
- **Response**: `ModelEvaluation[]`

---

### 3. Registrations & Ticketing API

#### `GET /api/v1/registrations`

- **Method Call**: `api.getRegistrations()`
- **Query Key**: `queryKeys.registrations` (`["registrations"]`)
- **Description**: Retrieves all participant registrations with ticket codes, confirmation status, and attendance flags.
- **Response**: `Registration[]`

#### `POST /api/v1/registrations`

- **Method Call**: `api.registerForEvent(eventId: string, participantName: string, email: string)`
- **Description**: Registers a participant for an event, increments event registration counts, and generates a formatted ticket code (`SEMS-XXX-XXXX`).
- **Request Body**:
  ```json
  {
    "eventId": "evt-002",
    "participantName": "Alex Morgan",
    "email": "alex.morgan@university.edu"
  }
  ```
- **Response**: `Registration`

#### `DELETE /api/v1/registrations/{id}`

- **Method Call**: `api.cancelRegistration(registrationId: string)`
- **Description**: Cancels an existing registration and updates event counts.
- **Response**: `boolean`

---

### 4. Weather Intelligence API

#### `GET /api/v1/weather`

- **Method Call**: `api.getWeather()`
- **Query Key**: `queryKeys.weather` (`["weather"]`)
- **Description**: Returns live campus weather conditions, 7-day forecast telemetry, and hourly risk timeline with operational advisories (`favorable`, `moderate`, `attention_required`).
- **Response**:
  ```json
  {
    "current": {
      "date": "2026-08-26",
      "condition": "Partly Cloudy",
      "temperature": 28,
      "humidity": 65,
      "rainProbability": 20,
      "windSpeed": 12,
      "impactScore": 90,
      "advisory": "favorable",
      "advisoryMessage": "Optimal conditions for indoor and outdoor activities."
    },
    "forecast": [/* 7-Day WeatherForecast array */],
    "timeline": [/* Hourly weather timeline array */]
  }
  ```

---

### 5. Historical Records & Analytics API

#### `GET /api/v1/historical-events`

- **Method Call**: `api.getHistoricalEvents()`
- **Query Key**: `queryKeys.historical` (`["historical"]`)
- **Description**: Retrieves verified ground-truth turnout data from completed events for model accuracy auditing.
- **Response**: `HistoricalEvent[]`

#### `GET /api/v1/analytics`

- **Method Call**: `api.getAnalytics()`
- **Query Key**: `queryKeys.analytics` (`["analytics"]`)
- **Description**: Fetches aggregated metrics including monthly volume, turnout vs registration trends, weather sensitivity curves, and feature importances.
- **Response**: `AnalyticsDataset`

#### `GET /api/v1/reports`

- **Method Call**: `api.getReports()`
- **Query Key**: `queryKeys.reports` (`["reports"]`)
- **Description**: Retrieves available operational and analytical reports ready for PDF/Excel download.
- **Response**: `ReportItem[]`

---

### 6. Users & Role-Based Access Control API

#### `GET /api/v1/users`

- **Method Call**: `api.getUsers()`
- **Query Key**: `queryKeys.users` (`["users"]`)
- **Description**: Retrieves platform user directory with role designations (`admin`, `organizer`, `participant`), departments, and account status.
- **Response**: `User[]`

---

### 7. Notifications, Activities & Tasks API

#### `GET /api/v1/notifications`

- **Method Call**: `api.getNotifications()`
- **Query Key**: `queryKeys.notifications` (`["notifications"]`)
- **Description**: Retrieves notification stream for weather alerts, prediction updates, and registration confirmations.
- **Response**: `NotificationItem[]`

#### `GET /api/v1/activities`

- **Method Call**: `api.getActivities()`
- **Query Key**: `queryKeys.activities` (`["activities"]`)
- **Description**: Retrieves audit trail and recent operational logs.
- **Response**: `ActivityItem[]`

#### `GET /api/v1/tasks`

- **Method Call**: `api.getTasks()`
- **Query Key**: `queryKeys.tasks` (`["tasks"]`)
- **Description**: Retrieves organizer task checklists and preparation deadlines.
- **Response**: `TaskItem[]`

---

## 👥 Role-Based Access Control (RBAC)

The platform supports 3 primary operational roles managed seamlessly through `AuthContext`:

| Role                            | Permissions & Capabilities                                                                                                                  | Primary Dashboard View                                  |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------ |
| **Administrator** (`admin`)     | Full platform governance, model health audit ($R^2$ tracking), user directory control, system logs, and global configuration.               | System KPIs, Model Metrics, Audit Activity Log          |
| **Organizer** (`organizer`)     | Event creation with ML preview, turnout simulation, logistics insights management, attendee lists, task checklists, and report exports.     | Event Calendar, Weather Risk Alerts, Preparation Tasks  |
| **Participant** (`participant`) | Event discovery catalog, 1-click registration, instant ticket codes, personal RSVP portfolio, and weather advisories for registered events. | My Tickets, Upcoming Registered Events, Recommendations |

---

## 🚀 Getting Started

### Prerequisites

- **[Bun](https://bun.sh/)** (Recommended runtime & package manager) or **Node.js $\ge 18$**.

### Installation & Development

```bash
# 1. Clone the repository
git clone <repository-url>
cd chronos-forecast-ai

# 2. Install project dependencies
bun install

# 3. Configure environment variables (optional)
# Create .env.local if targeting an external FastAPI backend
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# 4. Start local development server
bun run dev
```

The application will be accessible at `http://localhost:3000`.

### Scripts & Quality Verification

```bash
# Run ESLint validation (0 errors target)
bun run lint

# Format code with Prettier
bun run format

# Build client and server bundles for production
bun run build

# Preview production build locally
bun run preview
```

---

## 📂 Project Structure

```
chronos-forecast-ai/
├── src/
│   ├── components/
│   │   ├── charts/          # Recharts components (Attendance trends, R2 benchmarks, Error bars)
│   │   ├── dashboard/       # Role-based views (AdminDashboard, OrganizerDashboard, ParticipantDashboard)
│   │   ├── layouts/         # AppShell, AppSidebar, Header, Breadcrumbs
│   │   ├── shared/          # Metric cards, Weather widgets, Status badges, Decision insight cards
│   │   └── ui/              # shadcn/ui accessible primitives (Radix UI)
│   ├── contexts/            # AuthContext (Role switching & RBAC) & ThemeContext
│   ├── data/                # Calibrated mock datasets, ML benchmark data, historical events
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility helpers (cn class merging, formatters)
│   ├── routes/              # TanStack Start file-based routing
│   │   ├── __root.tsx       # Root layout, HTML shell, and global providers
│   │   ├── index.tsx        # Project hero & landing page
│   │   ├── dashboard.tsx    # Multi-role dashboard workspace
│   │   ├── prediction.tsx   # ML Prediction module & Scenario simulator
│   │   ├── events.index.tsx # Event catalog & faceted filters
│   │   ├── events.$eventId.tsx # Unified event details, weather & decision hub
│   │   ├── events.new.tsx   # Event creation form with real-time ML forecast
│   │   ├── analytics.tsx    # Predictive & weather impact analytics
│   │   ├── reports.tsx      # Turnout archive & PDF/Excel exports
│   │   ├── weather.tsx      # Campus weather intelligence center
│   │   ├── my-events.tsx    # Registered ticket portfolio
│   │   ├── users.tsx        # User directory & RBAC administration
│   │   ├── notifications.tsx# Notification center
│   │   ├── settings.tsx     # System & ML threshold configuration
│   │   ├── profile.tsx      # User profile & credentials
│   │   └── (auth)/          # Login, Register, Forgot Password, Reset Password
│   ├── services/
│   │   └── api.ts           # Clean API layer connecting to REST endpoints & typed mocks
│   ├── types/
│   │   └── index.ts         # TypeScript models (EventItem, MLModel, Weather, PredictionResult)
│   ├── router.tsx           # Router instance setup
│   ├── server.ts            # SSR server entry point
│   ├── start.ts             # TanStack Start initialization
│   └── styles.css           # Tailwind CSS v4 design tokens and custom styles
├── vite.config.ts           # Vite + TanStack Start plugin configuration
├── tsconfig.json            # Strict TypeScript configuration
└── package.json             # Dependencies and project scripts
```

---

## 📜 Academic Disclaimer

This project is developed as an academic software engineering capstone prototype. Machine learning metrics and weather forecasts within mock simulations represent calibrated university baseline data.
