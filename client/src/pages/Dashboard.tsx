import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const dashboardData = {
  stats: [
    {
      label: 'DSA Questions Solved',
      value: '128',
      detail: '+12 this week',
      accentClassName: 'bg-cyan-500'
    },
    {
      label: 'SQL Questions Solved',
      value: '46',
      detail: '+6 this week',
      accentClassName: 'bg-emerald-500'
    },
    {
      label: 'Aptitude Progress',
      value: '72%',
      detail: '18 of 25 modules',
      accentClassName: 'bg-amber-500'
    },
    {
      label: 'Mock Interviews Completed',
      value: '9',
      detail: '2 scheduled next',
      accentClassName: 'bg-rose-500'
    }
  ] satisfies StatCardData[],
  weeklyProgress: [
    { day: 'Mon', solved: 8 },
    { day: 'Tue', solved: 12 },
    { day: 'Wed', solved: 9 },
    { day: 'Thu', solved: 15 },
    { day: 'Fri', solved: 18 },
    { day: 'Sat', solved: 11 },
    { day: 'Sun', solved: 20 }
  ] satisfies WeeklyProgressPoint[],
  dailyGoal: {
    solvedToday: 7,
    target: 10
  },
  recentActivity: [
    {
      label: 'Last solved question',
      value: 'Binary Tree Level Order Traversal',
      timestamp: 'Today, 10:20 AM'
    },
    {
      label: 'Last interview',
      value: 'Frontend System Design Mock',
      timestamp: 'Yesterday, 6:45 PM'
    },
    {
      label: 'Resume uploaded',
      value: 'Software Engineer Resume.pdf',
      timestamp: 'Jul 8, 2026'
    },
    {
      label: 'Login history',
      value: 'Signed in from Chrome on macOS',
      timestamp: 'Today, 9:04 AM'
    }
  ] satisfies ActivityItem[],
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
          <p className="text-sm font-medium text-slate-500">Updated with dummy progress data</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardData.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <WeeklyProgressChart data={dashboardData.weeklyProgress} />
        <DailyGoalCard solvedToday={dashboardData.dailyGoal.solvedToday} target={dashboardData.dailyGoal.target} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RecentActivity items={dashboardData.recentActivity} />
        <div className="space-y-6">
          <RecommendedTasks tasks={dashboardData.recommendedTasks} />
          <QuickActions actions={dashboardData.quickActions} />
        </div>
      </section>
    </div>
  );
}
