import { useMemo, useState } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

type DsaQuestion = {
  id: number;
  title: string;
  difficulty: Difficulty;
  topic: string;
  companies: string[];
  estimatedTime: number;
  solved: boolean;
};

type QuestionState = {
  solved: boolean;
  favorite: boolean;
  notes: string;
  notesOpen: boolean;
};

const QUESTIONS_PER_PAGE = 20;

const dsaQuestions: DsaQuestion[] = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 15, solved: true },
  { id: 2, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', topic: 'Arrays', companies: ['Amazon', 'Meta', 'Bloomberg'], estimatedTime: 20, solved: true },
  { id: 3, title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stack', companies: ['Google', 'Microsoft', 'Adobe'], estimatedTime: 15, solved: true },
  { id: 4, title: 'Merge Two Sorted Lists', difficulty: 'Easy', topic: 'Linked List', companies: ['Amazon', 'Apple', 'Microsoft'], estimatedTime: 20, solved: false },
  { id: 5, title: 'Maximum Subarray', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Amazon', 'LinkedIn', 'Meta'], estimatedTime: 25, solved: true },
  { id: 6, title: 'Climbing Stairs', difficulty: 'Easy', topic: 'Dynamic Programming', companies: ['Adobe', 'Google', 'Uber'], estimatedTime: 15, solved: true },
  { id: 7, title: 'Product of Array Except Self', difficulty: 'Medium', topic: 'Arrays', companies: ['Meta', 'Amazon', 'Apple'], estimatedTime: 30, solved: false },
  { id: 8, title: 'Container With Most Water', difficulty: 'Medium', topic: 'Two Pointers', companies: ['Google', 'Amazon', 'Bloomberg'], estimatedTime: 30, solved: false },
  { id: 9, title: '3Sum', difficulty: 'Medium', topic: 'Two Pointers', companies: ['Meta', 'Microsoft', 'Adobe'], estimatedTime: 35, solved: false },
  { id: 10, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', companies: ['Amazon', 'Google', 'LinkedIn'], estimatedTime: 30, solved: true },
  { id: 11, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', companies: ['Microsoft', 'Amazon', 'Uber'], estimatedTime: 25, solved: false },
  { id: 12, title: 'Kth Largest Element in an Array', difficulty: 'Medium', topic: 'Heap', companies: ['Amazon', 'Meta', 'Apple'], estimatedTime: 30, solved: false },
  { id: 13, title: 'Top K Frequent Elements', difficulty: 'Medium', topic: 'Heap', companies: ['Google', 'Amazon', 'Yelp'], estimatedTime: 30, solved: true },
  { id: 14, title: 'Group Anagrams', difficulty: 'Medium', topic: 'Hash Table', companies: ['Amazon', 'Meta', 'Uber'], estimatedTime: 25, solved: true },
  { id: 15, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'Sliding Window', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 30, solved: true },
  { id: 16, title: 'Minimum Window Substring', difficulty: 'Hard', topic: 'Sliding Window', companies: ['Google', 'Meta', 'Uber'], estimatedTime: 45, solved: false },
  { id: 17, title: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 35, solved: false },
  { id: 18, title: 'Clone Graph', difficulty: 'Medium', topic: 'Graphs', companies: ['Meta', 'Google', 'Apple'], estimatedTime: 35, solved: false },
  { id: 19, title: 'Course Schedule', difficulty: 'Medium', topic: 'Graphs', companies: ['Amazon', 'DoorDash', 'Uber'], estimatedTime: 35, solved: true },
  { id: 20, title: 'Word Ladder', difficulty: 'Hard', topic: 'Graphs', companies: ['Amazon', 'Google', 'LinkedIn'], estimatedTime: 50, solved: false },
  { id: 21, title: 'Binary Tree Inorder Traversal', difficulty: 'Easy', topic: 'Trees', companies: ['Microsoft', 'Amazon', 'Bloomberg'], estimatedTime: 20, solved: true },
  { id: 22, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', topic: 'Trees', companies: ['Amazon', 'Meta', 'Google'], estimatedTime: 30, solved: true },
  { id: 23, title: 'Validate Binary Search Tree', difficulty: 'Medium', topic: 'Trees', companies: ['Amazon', 'Microsoft', 'Apple'], estimatedTime: 30, solved: false },
  { id: 24, title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'Medium', topic: 'Trees', companies: ['Meta', 'Amazon', 'LinkedIn'], estimatedTime: 35, solved: false },
  { id: 25, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topic: 'Trees', companies: ['Google', 'Amazon', 'Meta'], estimatedTime: 55, solved: false },
  { id: 26, title: 'Implement Trie', difficulty: 'Medium', topic: 'Trie', companies: ['Google', 'Amazon', 'Microsoft'], estimatedTime: 35, solved: false },
  { id: 27, title: 'Word Search II', difficulty: 'Hard', topic: 'Trie', companies: ['Amazon', 'Airbnb', 'Google'], estimatedTime: 55, solved: false },
  { id: 28, title: 'Coin Change', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Amazon', 'Google', 'Uber'], estimatedTime: 35, solved: true },
  { id: 29, title: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Google', 'Meta', 'Microsoft'], estimatedTime: 40, solved: false },
  { id: 30, title: 'Edit Distance', difficulty: 'Hard', topic: 'Dynamic Programming', companies: ['Google', 'Microsoft', 'Amazon'], estimatedTime: 55, solved: false },
  { id: 31, title: 'House Robber', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Amazon', 'LinkedIn', 'Adobe'], estimatedTime: 25, solved: true },
  { id: 32, title: 'Decode Ways', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Meta', 'Amazon', 'TikTok'], estimatedTime: 30, solved: false },
  { id: 33, title: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'Strings', companies: ['Amazon', 'Microsoft', 'Bloomberg'], estimatedTime: 35, solved: false },
  { id: 34, title: 'Valid Palindrome', difficulty: 'Easy', topic: 'Strings', companies: ['Meta', 'Microsoft', 'Apple'], estimatedTime: 15, solved: true },
  { id: 35, title: 'String to Integer Atoi', difficulty: 'Medium', topic: 'Strings', companies: ['Amazon', 'Google', 'Adobe'], estimatedTime: 30, solved: false },
  { id: 36, title: 'Palindromic Substrings', difficulty: 'Medium', topic: 'Strings', companies: ['Meta', 'Amazon', 'Apple'], estimatedTime: 30, solved: false },
  { id: 37, title: 'Subsets', difficulty: 'Medium', topic: 'Backtracking', companies: ['Amazon', 'Meta', 'Google'], estimatedTime: 25, solved: true },
  { id: 38, title: 'Combination Sum', difficulty: 'Medium', topic: 'Backtracking', companies: ['Amazon', 'Microsoft', 'Uber'], estimatedTime: 35, solved: false },
  { id: 39, title: 'Permutations', difficulty: 'Medium', topic: 'Backtracking', companies: ['LinkedIn', 'Amazon', 'Adobe'], estimatedTime: 30, solved: false },
  { id: 40, title: 'N-Queens', difficulty: 'Hard', topic: 'Backtracking', companies: ['Google', 'Amazon', 'Bloomberg'], estimatedTime: 55, solved: false },
  { id: 41, title: 'Merge Intervals', difficulty: 'Medium', topic: 'Intervals', companies: ['Google', 'Meta', 'Amazon'], estimatedTime: 25, solved: true },
  { id: 42, title: 'Insert Interval', difficulty: 'Medium', topic: 'Intervals', companies: ['Google', 'LinkedIn', 'Microsoft'], estimatedTime: 30, solved: false },
  { id: 43, title: 'Meeting Rooms II', difficulty: 'Medium', topic: 'Intervals', companies: ['Amazon', 'Meta', 'Bloomberg'], estimatedTime: 35, solved: false },
  { id: 44, title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Two Pointers', companies: ['Amazon', 'Google', 'Meta'], estimatedTime: 45, solved: false },
  { id: 45, title: 'LRU Cache', difficulty: 'Medium', topic: 'Design', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 40, solved: true },
  { id: 46, title: 'Design Add and Search Words Data Structure', difficulty: 'Medium', topic: 'Design', companies: ['Meta', 'Amazon', 'Uber'], estimatedTime: 40, solved: false },
  { id: 47, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Binary Search', companies: ['Google', 'Amazon', 'Apple'], estimatedTime: 55, solved: false },
  { id: 48, title: 'Sliding Window Maximum', difficulty: 'Hard', topic: 'Queue', companies: ['Amazon', 'Google', 'DoorDash'], estimatedTime: 50, solved: false },
  { id: 49, title: 'Alien Dictionary', difficulty: 'Hard', topic: 'Graphs', companies: ['Airbnb', 'Google', 'Meta'], estimatedTime: 50, solved: false },
  { id: 50, title: 'Find Median from Data Stream', difficulty: 'Hard', topic: 'Heap', companies: ['Amazon', 'Google', 'Bloomberg'], estimatedTime: 45, solved: false }
];

const difficultyStyles: Record<Difficulty, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Hard: 'bg-rose-50 text-rose-700 ring-rose-200'
};

const progressStyles: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  Hard: 'bg-rose-500'
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function createInitialQuestionState() {
  return dsaQuestions.reduce<Record<number, QuestionState>>((state, question) => {
    state[question.id] = {
      solved: question.solved,
      favorite: false,
      notes: '',
      notesOpen: false
    };
    return state;
  }, {});
}

function getDifficultyStats(difficulty: Difficulty, questionState: Record<number, QuestionState>) {
  const questions = dsaQuestions.filter((question) => question.difficulty === difficulty);
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

function ProgressRow({ difficulty, solved, total, percentage }: { difficulty: Difficulty; solved: number; total: number; percentage: number }) {
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
  question: DsaQuestion;
  state: QuestionState;
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
            <h3 className="text-base font-semibold text-slate-950">{question.title}</h3>
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
          <button
            className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="button"
            onClick={() => onSolvedChange(question.id, true)}
          >
            Solve
          </button>
        </div>
      </div>

      {state.notesOpen ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Notes</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Add approach notes, edge cases, or follow-up ideas."
              value={state.notes}
              onChange={(event) => onNotesChange(question.id, event.target.value)}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

export function DsaPractice() {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [questionState, setQuestionState] = useState<Record<number, QuestionState>>(createInitialQuestionState);

  const topics = useMemo(() => getUniqueValues(dsaQuestions.map((question) => question.topic)), []);
  const companies = useMemo(() => getUniqueValues(dsaQuestions.flatMap((question) => question.companies)), []);

  const solvedCount = dsaQuestions.filter((question) => questionState[question.id]?.solved).length;
  const remainingCount = dsaQuestions.length - solvedCount;
  const accuracy = Math.round((solvedCount / dsaQuestions.length) * 100);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return dsaQuestions.filter((question) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        question.title.toLowerCase().includes(normalizedSearch) ||
        question.topic.toLowerCase().includes(normalizedSearch) ||
        question.companies.some((company) => company.toLowerCase().includes(normalizedSearch));
      const matchesDifficulty = difficultyFilter === 'All' || question.difficulty === difficultyFilter;
      const matchesTopic = topicFilter === 'All' || question.topic === topicFilter;
      const matchesCompany = companyFilter === 'All' || question.companies.includes(companyFilter);

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

  function handleSolvedChange(id: number, solved: boolean) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        solved
      }
    }));
  }

  function handleFavoriteChange(id: number) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        favorite: !current[id].favorite
      }
    }));
  }

  function handleToggleNotes(id: number) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        notesOpen: !current[id].notesOpen
      }
    }));
  }

  function handleNotesChange(id: number, notes: string) {
    setQuestionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        notes
      }
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">PrepAI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">DSA Practice</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Practice high-signal coding interview questions with local progress tracking.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Question Bank</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{dsaQuestions.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Questions" value={String(dsaQuestions.length)} detail="Curated interview set" accentClassName="bg-cyan-500" />
        <StatCard label="Solved" value={String(solvedCount)} detail="Updated from toggles" accentClassName="bg-emerald-500" />
        <StatCard label="Remaining" value={String(remainingCount)} detail="Questions left to practice" accentClassName="bg-amber-500" />
        <StatCard label="Accuracy" value={`${accuracy}%`} detail="Solved share of this set" accentClassName="bg-rose-500" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-3">
          <ProgressRow difficulty="Easy" {...getDifficultyStats('Easy', questionState)} />
          <ProgressRow difficulty="Medium" {...getDifficultyStats('Medium', questionState)} />
          <ProgressRow difficulty="Hard" {...getDifficultyStats('Hard', questionState)} />
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
            id="difficulty-filter"
            label="Difficulty"
            value={difficultyFilter}
            options={['Easy', 'Medium', 'Hard']}
            onChange={(value) => updateFilters(() => setDifficultyFilter(value))}
          />
          <FilterSelect id="topic-filter" label="Topic" value={topicFilter} options={topics} onChange={(value) => updateFilters(() => setTopicFilter(value))} />
          <FilterSelect
            id="company-filter"
            label="Company"
            value={companyFilter}
            options={companies}
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
                onSolvedChange={handleSolvedChange}
                onFavoriteChange={handleFavoriteChange}
                onToggleNotes={handleToggleNotes}
                onNotesChange={handleNotesChange}
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
