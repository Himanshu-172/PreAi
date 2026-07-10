import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { sqlCompanies, sqlQuestions, sqlTopics, type SqlDifficulty, type SqlQuestion } from '../data/sqlQuestions';
import { useSqlPracticeState, type SqlQuestionState } from '../hooks/useSqlPracticeState';

const QUESTIONS_PER_PAGE = 20;
const difficulties: SqlDifficulty[] = ['Easy', 'Medium', 'Hard'];

const difficultyStyles: Record<SqlDifficulty, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Hard: 'bg-rose-50 text-rose-700 ring-rose-200'
};

const progressStyles: Record<SqlDifficulty, string> = {
  Easy: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  Hard: 'bg-rose-500'
};

function getDifficultyStats(difficulty: SqlDifficulty, questionState: Record<number, SqlQuestionState>) {
  const questions = sqlQuestions.filter((question) => question.difficulty === difficulty);
  const solved = questions.filter((question) => questionState[question.id]?.solved).length;
  const percentage = questions.length > 0 ? Math.round((solved / questions.length) * 100) : 0;

  return { total: questions.length, solved, percentage };
}

function StatCard({ label, value, detail, accentClassName }: { label: string; value: string; detail: string; accentClassName: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${accentClassName}`} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select
        id={id}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="All">All {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgressRow({ difficulty, solved, total, percentage }: { difficulty: SqlDifficulty; solved: number; total: number; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-semibold text-slate-950">{difficulty} Progress</p>
        <p className="font-medium text-slate-600">
          {solved}/{total} solved
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${progressStyles[difficulty]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  state,
  onSolvedChange,
  onFavoriteChange,
  onToggleNotes,
  onNotesChange
}: {
  question: SqlQuestion;
  state: SqlQuestionState;
  onSolvedChange: (id: number, solved: boolean) => void;
  onFavoriteChange: (id: number) => void;
  onToggleNotes: (id: number) => void;
  onNotesChange: (id: number, notes: string) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="text-base font-semibold text-slate-950 underline-offset-4 hover:underline" to={`/sql-practice/${question.id}`}>
              {question.title}
            </Link>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${difficultyStyles[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{question.topic}</span>
            <span>{question.estimatedTime} min</span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span>{question.companies.join(', ')}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
              type="checkbox"
              checked={state.solved}
              onChange={(event) => onSolvedChange(question.id, event.target.checked)}
            />
            Solved
          </label>
          <button
            className={[
              'h-10 rounded-md border px-3 text-sm font-medium transition',
              state.favorite
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            ].join(' ')}
            type="button"
            onClick={() => onFavoriteChange(question.id)}
            aria-pressed={state.favorite}
          >
            {state.favorite ? 'Favorited' : 'Favorite'}
          </button>
          <button
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={() => onToggleNotes(question.id)}
            aria-expanded={state.notesOpen}
          >
            Notes
          </button>
          <Link
            className="flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            to={`/sql-practice/${question.id}`}
            onClick={() => onSolvedChange(question.id, true)}
          >
            Solve
          </Link>
        </div>
      </div>

      {state.notesOpen ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Notes</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Add query ideas, edge cases, or follow-up notes."
              value={state.notes}
              onChange={(event) => onNotesChange(question.id, event.target.value)}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

export function SqlPractice() {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const { questionState, setSolved, toggleFavorite, toggleNotes, setNotes } = useSqlPracticeState();

  const solvedCount = sqlQuestions.filter((question) => questionState[question.id]?.solved).length;
  const remainingCount = sqlQuestions.length - solvedCount;
  const accuracy = Math.round((solvedCount / sqlQuestions.length) * 100);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return sqlQuestions.filter((question) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        question.title.toLowerCase().includes(normalizedSearch) ||
        question.topic.toLowerCase().includes(normalizedSearch) ||
        question.companies.some((company) => company.toLowerCase().includes(normalizedSearch));
      const matchesDifficulty = difficultyFilter === 'All' || question.difficulty === difficultyFilter;
      const matchesTopic = topicFilter === 'All' || question.topic === topicFilter;
      const matchesCompany = companyFilter === 'All' || question.companies.some((company) => company === companyFilter);

      return matchesSearch && matchesDifficulty && matchesTopic && matchesCompany;
    });
  }, [companyFilter, difficultyFilter, searchQuery, topicFilter]);

  const totalPages = Math.max(Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE), 1);
  const visibleQuestions = filteredQuestions.slice((currentPage - 1) * QUESTIONS_PER_PAGE, currentPage * QUESTIONS_PER_PAGE);
  const firstVisibleQuestion = filteredQuestions.length > 0 ? (currentPage - 1) * QUESTIONS_PER_PAGE + 1 : 0;
  const lastVisibleQuestion = Math.min(currentPage * QUESTIONS_PER_PAGE, filteredQuestions.length);

  function updateFilters(update: () => void) {
    update();
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">PrepAI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">SQL Practice</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Practice high-signal SQL interview questions with saved local progress.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Question Bank</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{sqlQuestions.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total SQL Questions" value={String(sqlQuestions.length)} detail="Curated SQL interview set" accentClassName="bg-cyan-500" />
        <StatCard label="Solved" value={String(solvedCount)} detail="Persisted on this device" accentClassName="bg-emerald-500" />
        <StatCard label="Remaining" value={String(remainingCount)} detail="Questions left to practice" accentClassName="bg-amber-500" />
        <StatCard label="Accuracy" value={`${accuracy}%`} detail="Solved share of this set" accentClassName="bg-rose-500" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-3">
          {difficulties.map((difficulty) => (
            <ProgressRow key={difficulty} difficulty={difficulty} {...getDifficultyStats(difficulty, questionState)} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">Search</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              type="search"
              placeholder="Search by title, topic, or company"
              value={searchQuery}
              onChange={(event) => updateFilters(() => setSearchQuery(event.target.value))}
            />
          </label>
          <FilterSelect
            id="sql-difficulty-filter"
            label="Difficulty"
            value={difficultyFilter}
            options={difficulties}
            onChange={(value) => updateFilters(() => setDifficultyFilter(value))}
          />
          <FilterSelect id="sql-topic-filter" label="Topic" value={topicFilter} options={sqlTopics} onChange={(value) => updateFilters(() => setTopicFilter(value))} />
          <FilterSelect
            id="sql-company-filter"
            label="Company"
            value={companyFilter}
            options={sqlCompanies}
            onChange={(value) => updateFilters(() => setCompanyFilter(value))}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Question List</h2>
            <p className="text-sm text-slate-500">
              Showing {firstVisibleQuestion}-{lastVisibleQuestion} of {filteredQuestions.length} questions
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">{QUESTIONS_PER_PAGE} questions per page</p>
        </div>

        {visibleQuestions.length > 0 ? (
          <div className="space-y-3">
            {visibleQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                state={questionState[question.id]}
                onSolvedChange={setSolved}
                onFavoriteChange={toggleFavorite}
                onToggleNotes={toggleNotes}
                onNotesChange={setNotes}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-950">No questions match the current filters.</p>
            <p className="mt-1 text-sm text-slate-500">Adjust the search, topic, company, or difficulty filters.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          >
            Previous
          </button>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                className={[
                  'h-9 w-9 rounded-md text-sm font-semibold transition',
                  currentPage === page ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                ].join(' ')}
                type="button"
                onClick={() => setCurrentPage(page)}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
