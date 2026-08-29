import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    color: "var(--color-popover-foreground)",
    fontSize: "12px",
    boxShadow: "var(--shadow-soft)",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

function Grid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />;
}

export function MonthlyEventsChart({
  data,
}: {
  data: { month: string; events: number; completed: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <Grid />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} width={32} />
        <Tooltip cursor={{ fill: "var(--color-muted)" }} {...tooltipStyle} />
        <Bar dataKey="events" name="Events" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
        <Bar
          dataKey="completed"
          name="Completed"
          fill="var(--color-chart-2)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AttendancePredictionChart({
  data,
  height = 260,
}: {
  data: { label: string; predicted: number; actual: number | null; expected: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Grid />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={38} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Predicted"
          stroke="var(--color-chart-1)"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--color-chart-3)"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expected"
          name="Expected"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RegistrationTrendChart({
  data,
  height = 260,
}: {
  data: { day: string; registrations: number; cancellations: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Grid />
        <XAxis dataKey="day" {...axis} />
        <YAxis {...axis} width={32} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="registrations"
          name="Registrations"
          stroke="var(--color-chart-1)"
          strokeWidth={2.5}
          fill="url(#regFill)"
        />
        <Area
          type="monotone"
          dataKey="cancellations"
          name="Cancellations"
          stroke="var(--color-chart-5)"
          strokeWidth={2}
          fill="transparent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeatherImpactChart({
  data,
}: {
  data: { condition: string; attendance: number }[];
}) {
  const colors = [
    "var(--color-chart-4)",
    "var(--color-chart-2)",
    "var(--color-chart-1)",
    "var(--color-chart-3)",
    "var(--color-chart-5)",
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} {...axis} />
        <YAxis type="category" dataKey="condition" width={92} {...axis} />
        <Tooltip cursor={{ fill: "var(--color-muted)" }} {...tooltipStyle} />
        <Bar dataKey="attendance" name="Avg. turnout %" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FeatureImportanceChart({ data }: { data: { feature: string; weight: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" {...axis} unit="%" />
        <YAxis type="category" dataKey="feature" width={150} {...axis} />
        <Tooltip cursor={{ fill: "var(--color-muted)" }} {...tooltipStyle} />
        <Bar dataKey="weight" name="Weight" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeatherTimelineChart({
  data,
}: {
  data: { hour: string; temperature: number; rain: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Grid />
        <XAxis dataKey="hour" {...axis} />
        <YAxis {...axis} width={32} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="temperature"
          name="Temp °C"
          stroke="var(--color-chart-4)"
          fill="url(#tempFill)"
          strokeWidth={2.5}
        />
        <Area
          type="monotone"
          dataKey="rain"
          name="Rain %"
          stroke="var(--color-chart-2)"
          fill="url(#rainFill)"
          strokeWidth={2.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ModelR2ComparisonChart({
  data,
}: {
  data: { name: string; r2Score: number; isBestModel: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 35 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 1]}
          {...axis}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <YAxis type="category" dataKey="name" width={160} {...axis} />
        <Tooltip
          formatter={(v: unknown) => [`${(Number(v) * 100).toFixed(1)}% (Score: ${v})`, "R² Score"]}
          {...tooltipStyle}
        />
        <Bar dataKey="r2Score" name="R² Score" radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isBestModel ? "var(--color-primary)" : "var(--color-chart-2)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ModelErrorMetricsChart({
  data,
}: {
  data: { name: string; mae: number; rmse: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={6}>
        <Grid />
        <XAxis dataKey="name" {...axis} tickFormatter={(val) => val.split(" ")[0]} />
        <YAxis {...axis} width={36} unit=" pax" />
        <Tooltip cursor={{ fill: "var(--color-muted)" }} {...tooltipStyle} />
        <Bar
          dataKey="mae"
          name="MAE (Mean Abs. Error)"
          fill="var(--color-chart-3)"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="rmse"
          name="RMSE (Root Mean Sq. Error)"
          fill="var(--color-chart-5)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
