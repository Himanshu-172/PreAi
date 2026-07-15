import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnalytics, type ApiAnalytics, type ApiAnalyticsActivity, type PracticeModule, type QuestionDifficulty } from '../services/api';

type StatCardData = {
  label: string;
  value: string;
  detail: string;
  accentClassName: string;
};

const modules: PracticeModule[] = ['DSA', 'SQL', 'Aptitude'];
const difficulties: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

const moduleColors: Record<PracticeModule, string> = {
  DSA: '#0891b2',
  SQL: '#10b981',
  Aptitude: '#f59e0b'
};

const difficultyBarStyles: Record<QuestionDifficulty, string> = {
  Easy: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  Hard: 'bg-rose-500'
};

const emptyAnalytics: ApiAnalytics = {
  practice: {
    dsaSolved: 0,
    sqlSolved: 0,
    aptitudeSolved: 0,
    overallSolved: 0,
    remaining: 0,
    accuracy: 0,
    totalQuestions: 0,
    totalsByModule: {
      DSA: 0,
      SQL: 0,
      Aptitude: 0
    },
    solvedByModule: {
      DSA: 0,
      SQL: 0,
      Aptitude: 0
    },
    difficultyBreakdown: {
      DSA: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      },
      SQL: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      },
      Aptitude: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      }
    }
  },
  resume: {
    totalAnalyses: 0,
    averageAtsScore: 0,
    bestAtsScore: 0,
    latestResumeAnalysis: null
  },
  mockInterview: {
    totalInterviews: 0,
    completedInterviews: 0,
    averageOverallScore: 0,
    averageCommunication: 0,
    averageTechnical: 0,
    averageConfidence: 0
  },
  aiChat: {
    totalConversations: 0,
    totalMessages: 0,
    latestConversation: null
  },
  overall: {
    totalActivity: 0,
    overallProgress: 0,
    favoriteCount: 0,
    recentActivityTimeline: []
  }
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

function formatDate(value: string | null) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replace(/_/g, ' ');
}

function scoreLabel(value: number) {
  return `${Math.round(value)}/100`;
}

function SectionCard({ title, description, children, className = '' }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
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

function ProgressBar({ value, total, barClassName }: { value: number; total: number; barClassName: string }) {
  const width = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;

  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function PracticeChart({ analytics }: { analytics: ApiAnalytics }) {
  const data = modules.map((module) => ({
    module,
    solved: analytics.practice.solvedByModule[module],
    total: analytics.practice.totalsByModule[module]
  }));
  const width = 560;
  const height = 240;
  const maxTotal = Math.max(...data.map((item) => item.total), 1);

  return (
    <svg className="h-64 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Solved questions by module">
      {[0.25, 0.5, 0.75, 1].map((tick) => (
        <line key={tick} x1="36" x2={width - 16} y1={height - 34 - tick * 170} y2={height - 34 - tick * 170} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {data.map((item, index) => {
        const groupWidth = 150;
        const x = 58 + index * groupWidth;
        const barHeight = (item.solved / maxTotal) * 170;
        const y = height - 34 - barHeight;

        return (
          <g key={item.module}>
            <rect x={x} y={height - 34 - (item.total / maxTotal) * 170} width="52" height={(item.total / maxTotal) * 170} rx="6" fill="#f1f5f9" />
            <rect x={x} y={y} width="52" height={barHeight} rx="6" fill={moduleColors[item.module]} />
            <text x={x + 26} y={height - 10} fill="#475569" fontSize="13" fontWeight="600" textAnchor="middle">
              {item.module}
            </text>
            <text x={x + 26} y={Math.max(y - 10, 18)} fill="#0f172a" fontSize="13" fontWeight="700" textAnchor="middle">
              {item.solved}/{item.total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScoreRing({ label, value, color }: { label: string; value: number; color: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <svg className="h-24 w-24 shrink-0" viewBox="0 0 100 100" role="img" aria-label={`${label} ${value}`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" fill="#0f172a" fontSize="18" fontWeight="700" textAnchor="middle">
          {Math.round(value)}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="mt-1 text-sm text-slate-500">Average score</p>
      </div>
    </article>
  );
}

function ActivityTimeline({ items }: { items: ApiAnalyticsActivity[] }) {
  if (items.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-500">No activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <article key={`${item.type}-${item.timestamp ?? index}-${item.detail}`} className="flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-600" />
            {index < items.length - 1 ? <span className="mt-2 h-full min-h-10 w-px bg-slate-200" /> : null}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-950">{item.label}</p>
              <p className="text-xs font-medium text-slate-500">{formatDate(item.timestamp)}</p>
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function buildTopStats(analytics: ApiAnalytics) {
  return [
    {
      label: 'Overall Progress',
      value: `${analytics.overall.overallProgress}%`,
      detail: `${analytics.practice.overallSolved} solved of ${analytics.practice.totalQuestions} questions`,
      accentClassName: 'bg-cyan-500'
    },
    {
      label: 'Resume ATS',
      value: scoreLabel(analytics.resume.averageAtsScore),
      detail: `Best score ${analytics.resume.bestAtsScore}/100 across ${analytics.resume.totalAnalyses} analyses`,
      accentClassName: 'bg-emerald-500'
    },
    {
      label: 'Interview Score',
      value: scoreLabel(analytics.mockInterview.averageOverallScore),
      detail: `${analytics.mockInterview.completedInterviews} completed of ${analytics.mockInterview.totalInterviews} interviews`,
      accentClassName: 'bg-amber-500'
    },
    {
      label: 'AI Chat',
      value: String(analytics.aiChat.totalMessages),
      detail: `${analytics.aiChat.totalConversations} conversations saved`,
      accentClassName: 'bg-rose-500'
    }
  ] satisfies StatCardData[];
}

export function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ApiAnalytics>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const displayName = user?.name ?? 'there';

  useEffect(() => {
    let isActive = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const analyticsData = await getAnalytics();

        if (isActive) {
          setAnalytics(analyticsData);
        }
      } catch {
        if (isActive) {
          setErrorMessage('Unable to load analytics. Please try again.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      isActive = false;
    };
  }, []);

  const topStats = useMemo(() => buildTopStats(analytics), [analytics]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-700">Analytics Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {getGreeting()}, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">A consolidated view of practice, resume, interview, and AI chat activity.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Activity</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{analytics.overall.totalActivity}</p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading analytics...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <SectionCard title="Practice Progress" description="Solved questions by module and difficulty">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <PracticeChart analytics={analytics} />
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-slate-950">{module}</p>
                    <p className="font-medium text-slate-600">
                      {analytics.practice.solvedByModule[module]}/{analytics.practice.totalsByModule[module]}
                    </p>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={analytics.practice.solvedByModule[module]} total={analytics.practice.totalsByModule[module]} barClassName="bg-cyan-600" />
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Remaining</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{analytics.practice.remaining}</p>
                <p className="mt-1 text-sm text-slate-500">Questions left in the current bank</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Difficulty Breakdown" description="Solved count by module">
          <div className="space-y-5">
            {modules.map((module) => (
              <div key={module}>
                <p className="text-sm font-semibold text-slate-950">{module}</p>
                <div className="mt-3 space-y-3">
                  {difficulties.map((difficulty) => (
                    <div key={`${module}-${difficulty}`}>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{difficulty}</span>
                        <span>{analytics.practice.difficultyBreakdown[module][difficulty]}</span>
                      </div>
                      <div className="mt-1">
                        <ProgressBar
                          value={analytics.practice.difficultyBreakdown[module][difficulty]}
                          total={Math.max(analytics.practice.solvedByModule[module], 1)}
                          barClassName={difficultyBarStyles[difficulty]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Resume" description="ATS performance">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <ScoreRing label="Average ATS" value={analytics.resume.averageAtsScore} color="#10b981" />
            <ScoreRing label="Best ATS" value={analytics.resume.bestAtsScore} color="#0891b2" />
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Latest analysis</p>
            {analytics.resume.latestResumeAnalysis ? (
              <>
                <p className="mt-2 truncate text-sm font-medium text-slate-700">{analytics.resume.latestResumeAnalysis.fileName}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{formatStatus(analytics.resume.latestResumeAnalysis.status)}</p>
                <p className="mt-1 text-sm text-slate-500">ATS {analytics.resume.latestResumeAnalysis.atsScore ?? 0}/100</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No resume analysis yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Mock Interview" description="Evaluation averages">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              stat={{
                label: 'Completed',
                value: String(analytics.mockInterview.completedInterviews),
                detail: `${analytics.mockInterview.totalInterviews} total sessions`,
                accentClassName: 'bg-emerald-500'
              }}
            />
            <StatCard
              stat={{
                label: 'Overall',
                value: scoreLabel(analytics.mockInterview.averageOverallScore),
                detail: 'Average evaluation',
                accentClassName: 'bg-cyan-500'
              }}
            />
          </div>
          <div className="mt-5 space-y-4">
            <ProgressBar value={analytics.mockInterview.averageCommunication} total={100} barClassName="bg-cyan-600" />
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <p className="font-medium text-slate-600">Communication {analytics.mockInterview.averageCommunication}</p>
              <p className="font-medium text-slate-600">Technical {analytics.mockInterview.averageTechnical}</p>
              <p className="font-medium text-slate-600">Confidence {analytics.mockInterview.averageConfidence}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="AI Chat" description="Conversation activity">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard
              stat={{
                label: 'Conversations',
                value: String(analytics.aiChat.totalConversations),
                detail: 'Saved AI chat threads',
                accentClassName: 'bg-rose-500'
              }}
            />
            <StatCard
              stat={{
                label: 'Messages',
                value: String(analytics.aiChat.totalMessages),
                detail: 'User and assistant messages',
                accentClassName: 'bg-amber-500'
              }}
            />
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Latest conversation</p>
            {analytics.aiChat.latestConversation ? (
              <>
                <p className="mt-2 truncate text-sm font-medium text-slate-700">{analytics.aiChat.latestConversation.title}</p>
                <p className="mt-1 text-sm text-slate-500">{analytics.aiChat.latestConversation.messageCount} messages</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(analytics.aiChat.latestConversation.updatedAt)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No chat conversations yet.</p>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Recent Activity" description="Latest events across the platform">
          <ActivityTimeline items={analytics.overall.recentActivityTimeline} />
        </SectionCard>

        <SectionCard title="Quick Actions" description="Continue from your analytics">
          <div className="grid gap-3">
            <Link className="rounded-md bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800" to="/dsa-practice">
              Continue Practice
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100" to="/resume-analyzer">
              Review Resume
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100" to="/mock-interview">
              Start Interview
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100" to="/ai-chatbot">
              Open AI Chat
            </Link>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
