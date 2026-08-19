import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  PracticeFilterSelect,
  PracticePagination,
  PracticeProgressRow,
  PracticeStatCard,
  difficultyBadgeStyles,
  progressBarStyles
} from '../components/practice/PracticeComponents';
import type { ApiQuestion, QuestionDifficulty } from '../services/api';
import { useAptitudePracticeState, type AptitudeQuestionState } from '../hooks/useAptitudePracticeState';

const QUESTIONS_PER_PAGE = 20;
const difficulties: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

function formatPracticeTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function getDifficultyStats(difficulty: QuestionDifficulty, questions: ApiQuestion[], questionState: Record<number, AptitudeQuestionState>) {
  const questionsByDifficulty = questions.filter((question) => question.difficulty === difficulty);
  const solved = questionsByDifficulty.filter((question) => questionState[question.questionId]?.solved).length;
  const percentage = questionsByDifficulty.length > 0 ? Math.round((solved / questionsByDifficulty.length) * 100) : 0;

  return { total: questionsByDifficulty.length, solved, percentage };
}

function getFallbackState(): AptitudeQuestionState {
  return {
    solved: false,
    favorite: false,
    notes: '',
    notesOpen: false
  };
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function getQuestionState(questionState: Record<number, AptitudeQuestionState>, id: number) {
  return questionState[id] ?? getFallbackState();
}

function getPracticeStats(questions: ApiQuestion[], questionState: Record<number, AptitudeQuestionState>) {
  const solved = questions.filter((question) => questionState[question.questionId]?.solved).length;
  const percentage = questions.length > 0 ? Math.round((solved / questions.length) * 100) : 0;

  return {
    solved,
    remaining: questions.length - solved,
    accuracy: percentage
  };
}

function AptitudeQuestionCard({
  question,
  state,
  onSolvedChange,
  onFavoriteChange,
  onToggleNotes,
  onNotesChange
}: {
  question: ApiQuestion;
  state: AptitudeQuestionState;
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
            <Link className="text-base font-semibold text-slate-950 underline-offset-4 hover:underline" to={`/aptitude/${question.questionId}`}>
              {question.title}
            </Link>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${difficultyBadgeStyles[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{question.category}</span>
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
              onChange={(event) => onSolvedChange(question.questionId, event.target.checked)}
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
            onClick={() => onFavoriteChange(question.questionId)}
            aria-pressed={state.favorite}
          >
            {state.favorite ? 'Favorited' : 'Favorite'}
          </button>
          <button
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={() => onToggleNotes(question.questionId)}
            aria-expanded={state.notesOpen}
          >
            Notes
          </button>
          <Link
            className="flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            to={`/aptitude/${question.questionId}`}
            onClick={() => onSolvedChange(question.questionId, true)}
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
              placeholder="Add shortcuts, formulas, or mistakes to revisit."
              value={state.notes}
              onChange={(event) => onNotesChange(question.questionId, event.target.value)}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

export function Aptitude() {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const { questions, questionState, isLoading, errorMessage, setSolved, toggleFavorite, toggleNotes, setNotes } = useAptitudePracticeState();

  const categories = useMemo(() => getUniqueValues(questions.map((question) => question.category)), [questions]);
  const companies = useMemo(() => getUniqueValues(questions.flatMap((question) => question.companies)), [questions]);
  const { solved: solvedCount, remaining: remainingCount, accuracy } = getPracticeStats(questions, questionState);
  const totalEstimatedMinutes = questions.reduce((total, question) => total + question.estimatedTime, 0);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return questions.filter((question) => {
      const state = getQuestionState(questionState, question.questionId);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        question.title.toLowerCase().includes(normalizedSearch) ||
        question.category.toLowerCase().includes(normalizedSearch) ||
        question.companies.some((company) => company.toLowerCase().includes(normalizedSearch));
      const matchesDifficulty = difficultyFilter === 'All' || question.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === 'All' || question.category === categoryFilter;
      const matchesCompany = companyFilter === 'All' || question.companies.some((company) => company === companyFilter);
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Solved' && state.solved) ||
        (statusFilter === 'Unsolved' && !state.solved) ||
        (statusFilter === 'Favorites' && state.favorite);

      return matchesSearch && matchesDifficulty && matchesCategory && matchesCompany && matchesStatus;
    }).sort((first, second) => {
      if (sortOption === 'Alphabetical') {
        return first.title.localeCompare(second.title);
      }

      const firstDate = new Date(first.createdAt).getTime();
      const secondDate = new Date(second.createdAt).getTime();
      return sortOption === 'Oldest' ? firstDate - secondDate : secondDate - firstDate;
    });
  }, [categoryFilter, companyFilter, difficultyFilter, questionState, questions, searchQuery, sortOption, statusFilter]);

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
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Aptitude Practice</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Practice placement-ready aptitude questions with saved progress, notes, and quick review.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Question Bank</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{questions.length}</p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading aptitude practice data...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PracticeStatCard label="Total Questions" value={String(questions.length)} detail="Curated aptitude set" accentClassName="bg-cyan-500" />
        <PracticeStatCard label="Solved" value={String(solvedCount)} detail="Synced to your account" accentClassName="bg-emerald-500" />
        <PracticeStatCard label="Remaining" value={String(remainingCount)} detail="Questions left to practice" accentClassName="bg-amber-500" />
        <PracticeStatCard label="Accuracy" value={`${accuracy}%`} detail="Solved share of this set" accentClassName="bg-rose-500" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PracticeStatCard label="Questions Solved" value={String(solvedCount)} detail="Across all categories" accentClassName="bg-emerald-500" />
        <PracticeStatCard label="Remaining" value={String(remainingCount)} detail="Open practice backlog" accentClassName="bg-amber-500" />
        <PracticeStatCard label="Accuracy" value={`${accuracy}%`} detail="Current completion rate" accentClassName="bg-rose-500" />
        <PracticeStatCard label="Estimated Practice Time" value={formatPracticeTime(totalEstimatedMinutes)} detail="Total bank duration" accentClassName="bg-cyan-500" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-4">
          {difficulties.map((difficulty) => (
            <PracticeProgressRow
              key={difficulty}
              label={`${difficulty} Progress`}
              barClassName={progressBarStyles[difficulty]}
              {...getDifficultyStats(difficulty, questions, questionState)}
            />
          ))}
          <PracticeProgressRow
            label="Overall Progress"
            solved={solvedCount}
            total={questions.length}
            percentage={accuracy}
            barClassName={progressBarStyles.Overall}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))]">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">Search</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              type="search"
              placeholder="Search by title, category, or company"
              value={searchQuery}
              onChange={(event) => updateFilters(() => setSearchQuery(event.target.value))}
            />
          </label>
          <PracticeFilterSelect
            id="aptitude-difficulty-filter"
            label="Difficulty"
            value={difficultyFilter}
            options={difficulties}
            onChange={(value) => updateFilters(() => setDifficultyFilter(value))}
          />
          <PracticeFilterSelect
            id="aptitude-category-filter"
            label="Category"
            value={categoryFilter}
            options={categories}
            onChange={(value) => updateFilters(() => setCategoryFilter(value))}
          />
          <PracticeFilterSelect
            id="aptitude-company-filter"
            label="Company"
            value={companyFilter}
            options={companies}
            onChange={(value) => updateFilters(() => setCompanyFilter(value))}
          />
          <PracticeFilterSelect
            id="aptitude-status-filter"
            label="Status"
            value={statusFilter}
            options={['Solved', 'Unsolved', 'Favorites']}
            onChange={(value) => updateFilters(() => setStatusFilter(value))}
          />
          <PracticeFilterSelect
            id="aptitude-sort-filter"
            label="Sort"
            value={sortOption}
            options={['Newest', 'Oldest', 'Alphabetical']}
            onChange={(value) => updateFilters(() => setSortOption(value))}
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
              <AptitudeQuestionCard
                key={question.questionId}
                question={question}
                state={getQuestionState(questionState, question.questionId)}
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
            <p className="mt-1 text-sm text-slate-500">Adjust the search, category, company, difficulty, or status filters.</p>
          </div>
        )}

        <PracticePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </section>
    </div>
  );
}
