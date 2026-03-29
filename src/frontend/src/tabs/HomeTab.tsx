import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Square, Timer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { TimerPanel } from "../components/TimerPanel";
import type { Note } from "../components/TimerPanel";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";
import { useActor } from "../hooks/useActor";
import { useListTasksByDate, useUpdateTask } from "../hooks/useQueries";

interface NotesActor {
  getAllNotes(): Promise<Note[]>;
  updateNote(
    noteId: bigint,
    title: string,
    body: string,
    folderId: bigint,
    tags: string[],
  ): Promise<Note>;
}

// ─── Module-level weather cache ───────────────────────────────────────────────
interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}
let cachedWeather: WeatherData | null = null;

// ─── WMO codes ────────────────────────────────────────────────────────────────
const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Foggy", emoji: "🌫" },
  48: { label: "Foggy", emoji: "🌫" },
  51: { label: "Drizzle", emoji: "🌦" },
  53: { label: "Drizzle", emoji: "🌦" },
  55: { label: "Drizzle", emoji: "🌦" },
  61: { label: "Rain", emoji: "🌧" },
  63: { label: "Rain", emoji: "🌧" },
  65: { label: "Heavy rain", emoji: "🌧" },
  71: { label: "Snow", emoji: "❄️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  80: { label: "Rain showers", emoji: "🌧" },
  81: { label: "Rain showers", emoji: "🌧" },
  82: { label: "Heavy showers", emoji: "🌧" },
  95: { label: "Thunderstorm", emoji: "⛈" },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] ?? { label: "Unknown", emoji: "🌡" };
}

// ─── DonutChart (memoized) ────────────────────────────────────────────────────
const DonutChart = memo(function DonutChart({
  completed,
  total,
}: { completed: number; total: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : completed / total;
  const dash = pct * circ;
  return (
    <svg
      width="88"
      height="88"
      viewBox="0 0 88 88"
      role="img"
      aria-label={`${completed} of ${total} tasks completed`}
    >
      <title>{`${completed}/${total} tasks`}</title>
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="oklch(var(--border))"
        strokeWidth="8"
      />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="oklch(var(--accent))"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x="44"
        y="49"
        textAnchor="middle"
        fill="oklch(var(--foreground))"
        fontSize="13"
        fontWeight="700"
      >
        {completed}/{total}
      </text>
    </svg>
  );
});

// ─── WeatherWidget (memoized + module-level cache) ────────────────────────────
const WeatherWidget = memo(function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(cachedWeather);
  const [loading, setLoading] = useState(cachedWeather === null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If already cached from a previous render, skip fetch entirely
    if (cachedWeather !== null) return;

    if (!navigator.geolocation) {
      setError(true);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`,
          );
          const data = await res.json();
          cachedWeather = data.current_weather;
          setWeather(data.current_weather);
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError(true);
        setLoading(false);
      },
    );
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm text-muted-foreground">
          📍 Location unavailable. Please allow location access to see weather.
        </p>
      </div>
    );
  }

  const { label, emoji } = getWeatherInfo(weather.weathercode);

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {Math.round(weather.temperature)}°C
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Wind</p>
          <p className="text-sm font-semibold text-foreground">
            {weather.windspeed} km/h
          </p>
        </div>
      </div>
    </div>
  );
});

// ─── useLiveClock (fixed: no localStorage read inside interval) ───────────────
function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  const [timeFormat, setTimeFormat] = useState(
    () => localStorage.getItem("sha_time_format") || "12",
  );

  useEffect(() => {
    // Tick every second — no localStorage read here
    const tick = setInterval(() => setNow(new Date()), 1000);

    // Listen for format changes made in Profile settings (same or other tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sha_time_format") {
        setTimeFormat(e.newValue || "12");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(tick);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const pad = (n: number) => String(n).padStart(2, "0");
    if (timeFormat === "24") {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${pad(m)}:${pad(s)} ${period}`;
  }, [now, timeFormat]);
}

// ─── LiveClock (isolated memoized component so clock ticks don't re-render HomeTab) ──
const LiveClock = memo(function LiveClock() {
  const clockStr = useLiveClock();
  const todayFormatted = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // date string only needs to compute once per mount
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.08 }}
      className="mt-3"
    >
      <p className="text-6xl font-mono font-bold text-foreground tabular-nums leading-none tracking-tight">
        {clockStr}
      </p>
      <p className="text-sm font-medium text-muted-foreground mt-1">
        {todayFormatted}
      </p>
    </motion.div>
  );
});

// ─── HomeTab ──────────────────────────────────────────────────────────────────
export default function HomeTab() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { actor } = useActor();
  const today = new Date().toISOString().split("T")[0];
  const { data: tasks, isLoading } = useListTasksByDate(today);
  const updateTask = useUpdateTask();

  const [notes, setNotes] = useState<Note[]>([]);
  const [showTimer, setShowTimer] = useState(false);

  const notesActor = actor as unknown as NotesActor | null;

  // Lazy-load notes only when the timer panel is first opened
  useEffect(() => {
    if (!showTimer || !notesActor || notes.length > 0) return;
    notesActor
      .getAllNotes()
      .then(setNotes)
      .catch(() => {});
  }, [showTimer, notesActor, notes.length]);

  const handleSaveToNote = async (noteId: bigint, sessionText: string) => {
    if (!notesActor) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const newBody =
      `${(note as unknown as { body: string }).body}\n${sessionText}`.trim();
    await notesActor.updateNote(
      noteId,
      (note as unknown as { title: string }).title,
      newBody,
      (note as unknown as { folderId: bigint }).folderId,
      (note as unknown as { tags: string[] }).tags,
    );
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t.goodMorning;
    if (h < 17) return t.goodAfternoon;
    return t.goodEvening;
  }, [t]);

  const completed = useMemo(
    () => (tasks || []).filter((tk) => tk.completed).length,
    [tasks],
  );
  const total = tasks?.length ?? 0;

  const toggleTask = useCallback(
    (task: {
      id: bigint;
      title: string;
      description: string;
      completed: boolean;
    }) => {
      updateTask.mutate({
        taskId: task.id,
        title: task.title,
        description: task.description,
        completed: !task.completed,
      });
    },
    [updateTask],
  );

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* Branding hero */}
      <div className="px-5 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <span className="text-5xl font-black tracking-tight text-foreground leading-none">
            Sha
          </span>
          <p className="text-xs font-bold tracking-widest uppercase text-accent">
            by Aenset
          </p>
        </motion.div>

        {/* Live clock — isolated component, ticks never re-render the rest of HomeTab */}
        <LiveClock />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-4"
        >
          <h2 className="text-2xl font-bold text-foreground">
            {greeting}, {user?.name || "User"}!
          </h2>
        </motion.div>
      </div>

      {/* Greeting card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mx-5 mt-4"
      >
        <div className="bg-gradient-to-br from-accent/20 to-card border border-accent/20 rounded-2xl p-4 card-glow">
          <p className="font-semibold text-foreground">
            Ready to make today count?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You have{" "}
            <span className="text-accent font-semibold">{total} tasks</span>{" "}
            scheduled. Stay focused and keep the momentum going!
          </p>
        </div>
      </motion.div>

      {/* Day at a Glance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="mx-5 mt-5"
      >
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          {t.yourDayAtAGlance}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Tasks progress */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {t.tasksProgress}
            </p>
            <DonutChart completed={completed} total={total} />
          </div>
          {/* Checklist */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">
              {t.todaysChecklist}
            </p>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task, i) => (
                  <button
                    type="button"
                    key={task.id.toString()}
                    data-ocid={`home.checkbox.${i + 1}`}
                    onClick={() => toggleTask(task)}
                    className="flex items-center gap-2 w-full text-left group"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-accent flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs leading-tight ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.noTasksToday}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Weather Widget */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mx-5 mt-5"
      >
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          Weather
        </h3>
        <WeatherWidget />
      </motion.div>

      {/* Timer & Stopwatch */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="mx-5 mt-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Timer &amp; Stopwatch
          </h3>
          <Button
            data-ocid="home.toggle"
            size="sm"
            variant={showTimer ? "default" : "outline"}
            onClick={() => setShowTimer((p) => !p)}
            className="gap-1 h-7 text-xs"
          >
            <Timer className="w-3.5 h-3.5" />
            {showTimer ? "Hide" : "Open"}
          </Button>
        </div>
        <AnimatePresence>
          {showTimer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden -mx-5"
            >
              <TimerPanel
                onClose={() => setShowTimer(false)}
                notes={notes}
                onSaveToNote={handleSaveToNote}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
