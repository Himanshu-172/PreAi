import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFavorites, getProgress, getQuestions, type ApiProgress, type ApiQuestion } from '../services/api';

type StatCardData = {
  label: string;
  value: string;
  detail: string;
  accentClassName: string;
};

type WeeklyProgressPoint = {
  day: string;
  solved: number;
};

type ActivityItem = {
  label: string;
  value: string;
  timestamp: string;
};

type RecommendedTask = {
  title: string;
  description: string;
};

type QuickAction = {
  label: string;
  path: string;
  className: string;
};

const dashboardStaticData = {
  recommendedTasks: [
    {
      title: 'Solve 2 Graph problems',
      description: 'Focus on BFS, DFS, and shortest path patterns.'
    },
    {
      title: 'Practice SQL Joins',
      description: 'Review inner, left, and aggregate join questions.'
    },
    {
      title: 'Take Mock Interview',
      description: 'Run one timed technical interview session.'
    }
  ] satisfies RecommendedTask[],
  quickActions: [
    { label: 'Start DSA Practice', path: '/dsa-practice', className: 'bg-slate-950 text-white hover:bg-slate-800' },
    { label: 'SQL Practice', path: '/sql-practice', className: 'bg-white text-slate-800 hover:bg-slate-100' },
    { label: 'Resume Analyzer', path: '/resume-analyzer', className: 'bg-white text-slate-800 hover:bg-slate-100' },
    { label: 'Mock Interview', path: '/mock-interview', className: 'bg-white text-slate-800 hover:bg-slate-100' }
  ] satisfies QuickAction[]
};

type DashboardApiData = {
  questions: ApiQuestion[];
  progress: ApiProgress[];
  favorites: ApiProgress[];
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  }

  if (hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}

function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${stat.accentClassName}`} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm text-slate-500">{stat.detail}</p>
    </article>
  );
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function getQuestionTitle(questionMap: Map<string, ApiQuestion>, item: ApiProgress) {
  return questionMap.get(`${item.module}:${item.questionId}`)?.title ?? `${item.module} question ${item.questionId}`;
}

function buildWeeklyProgress(progress: ApiProgress[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  return dates.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    return {
      day: days[date.getDay()],
      solved: progress.filter((item) => {
        if (!item.solvedAt) {
          return false;
        }

        const solvedAt = new Date(item.solvedAt);
        return solvedAt >= date && solvedAt < nextDate;
      }).length
    };
  });
}

function buildDashboardStats(data: DashboardApiData) {
  const totalSolved = data.progress.filter((item) => item.solved).length;
  const remaining = Math.max(data.questions.length - totalSolved, 0);
  const accuracy = data.questions.length > 0 ? Math.round((totalSolved / data.questions.length) * 100) : 0;

  return [
    {
      label: 'Total Solved',
      value: String(totalSolved),
      detail: 'Across DSA, SQL, and Aptitude',
      accentClassName: 'bg-cyan-500'
    },
    {
      label: 'Remaining',
      value: String(remaining),
      detail: 'Questions left in the backend bank',
      accentClassName: 'bg-amber-500'
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      detail: 'Solved share of all loaded questions',
      accentClassName: 'bg-emerald-500'
    },
    {
      label: 'Favorite Count',
      value: String(data.favorites.length),
      detail: 'Questions marked for review',
      accentClassName: 'bg-rose-500'
    }
  ] satisfies StatCardData[];
}

function buildRecentActivity(data: DashboardApiData) {
  const questionMap = new Map(data.questions.map((question) => [`${question.module}:${question.questionId}`, question]));

  return data.progress
    .filter((item) => item.solved || item.favorite || item.notes)
    .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
    .slice(0, 5)
    .map((item) => ({
      label: item.solved ? `${item.module} solved` : item.favorite ? `${item.module} favorite` : `${item.module} notes`,
      value: getQuestionTitle(questionMap, item),
      timestamp: formatActivityTime(item.updatedAt)
    }));
}

function WeeklyProgressChart({ data }: { data: WeeklyProgressPoint[] }) {
  const width = 640;
  const height = 240;
  const padding = 28;
  const maxSolved = Math.max(...data.map((point) => point.solved), 1);
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((point, index) => {
    const x = padding + index * xStep;
    const y = height - padding - (point.solved / maxSolved) * (height - padding * 2);
    return { ...point, x, y };
  });
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Weekly Progress</h2>
          <p className="text-sm text-slate-500">Questions solved across the current week</p>
        </div>
        <p className="text-sm font-medium text-slate-700">{data.reduce((total, point) => total + point.solved, 0)} solved</p>
      </div>

      <div className="mt-6 overflow-hidden">
        <svg className="h-64 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly solved questions line chart">
          {[0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1={padding}
              x2={width - padding}
              y1={height - padding - tick * (height - padding * 2)}
              y2={height - padding - tick * (height - padding * 2)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          <polyline points={polylinePoints} fill="none" stroke="#0891b2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {points.map((point) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#0891b2" strokeWidth="3" />
              <text x={point.x} y={height - 7} fill="#64748b" fontSize="12" textAnchor="middle">
                {point.day}
              </text>
              <text x={point.x} y={point.y - 12} fill="#0f172a" fontSize="12" fontWeight="600" textAnchor="middle">
                {point.solved}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

function DailyGoalCard({ solvedToday, target }: { solvedToday: number; target: number }) {
  const completion = Math.min(Math.round((solvedToday / target) * 100), 100);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Daily Goal</h2>
      <p className="mt-1 text-sm text-slate-500">Questions solved today</p>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold tracking-tight text-slate-950">{solvedToday}</p>
          <p className="mt-1 text-sm text-slate-500">of {target} questions</p>
        </div>
        <p className="text-2xl font-semibold text-cyan-700">{completion}%</p>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-cyan-600" style={{ width: `${completion}%` }} />
      </div>
    </section>
  );
}

function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <article key={item.label} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.timestamp}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendedTasks({ tasks }: { tasks: RecommendedTask[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Recommended Tasks</h2>
      <div className="mt-4 space-y-3">
        {tasks.map((task) => (
          <article key={task.title} className="rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-950">{task.title}</p>
            <p className="mt-1 text-sm text-slate-500">{task.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={`rounded-md border border-slate-200 px-4 py-3 text-center text-sm font-semibold transition ${action.className}`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.name ?? 'there';
  const [dashboardData, setDashboardData] = useState<DashboardApiData>({
    questions: [],
    progress: [],
    favorites: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [questions, progress, favorites] = await Promise.all([getQuestions(), getProgress(), getFavorites()]);

        if (isActive) {
          setDashboardData({ questions, progress, favorites });
        }
      } catch {
        if (isActive) {
          setErrorMessage('Unable to load dashboard statistics. Please try again.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      isActive = false;
    };
  }, []);

  const stats = useMemo(() => buildDashboardStats(dashboardData), [dashboardData]);
  const weeklyProgress = useMemo(() => buildWeeklyProgress(dashboardData.progress), [dashboardData.progress]);
  const recentActivity = useMemo(() => buildRecentActivity(dashboardData), [dashboardData]);
  const solvedToday = weeklyProgress[weeklyProgress.length - 1]?.solved ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase text-cyan-700">PrepAI Dashboard</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {getGreeting()}, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">Track your preparation momentum and jump back into the next useful task.</p>
          </div>
          <p className="text-sm font-medium text-slate-500">Updated from backend progress</p>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading dashboard statistics...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <WeeklyProgressChart data={weeklyProgress} />
        <DailyGoalCard solvedToday={solvedToday} target={10} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RecentActivity
          items={
            recentActivity.length > 0
              ? recentActivity
              : [
                  {
                    label: 'Recent Activity',
                    value: 'No backend activity yet',
                    timestamp: 'Start solving questions to populate this list'
                  }
                ]
          }
        />
        <div className="space-y-6">
          <RecommendedTasks tasks={dashboardStaticData.recommendedTasks} />
          <QuickActions actions={dashboardStaticData.quickActions} />
        </div>
      </section>
    </div>
  );
}
