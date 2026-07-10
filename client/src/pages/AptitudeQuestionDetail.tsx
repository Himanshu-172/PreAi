import { Link, Navigate, useParams } from 'react-router-dom';
import {
  PracticeDetailSection,
  difficultyBadgeStyles
} from '../components/practice/PracticeComponents';
import { aptitudeQuestions } from '../data/aptitudeQuestions';
import { useAptitudePracticeState } from '../hooks/useAptitudePracticeState';

export function AptitudeQuestionDetail() {
  const { id } = useParams();
  const questionId = Number(id);
  const question = aptitudeQuestions.find((item) => item.id === questionId);
  const { questionState, isLoading, errorMessage, setSolved, toggleFavorite, setNotes } = useAptitudePracticeState();

  if (!question) {
    return <Navigate to="/aptitude" replace />;
  }

  const state = questionState[question.id] ?? {
    solved: false,
    favorite: false,
    notes: '',
    notesOpen: false
  };
  const correctOption = question.options.find((option) => option.label === question.correctAnswer);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline" to="/aptitude">
          Back to Aptitude Practice
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{question.title}</h1>
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
                onChange={(event) => setSolved(question.id, event.target.checked)}
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
              onClick={() => toggleFavorite(question.id)}
              aria-pressed={state.favorite}
            >
              {state.favorite ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading saved progress...</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
      ) : null}

      <PracticeDetailSection title="Question">
        <p className="text-sm leading-6 text-slate-700">{question.question}</p>
      </PracticeDetailSection>

      <PracticeDetailSection title="Options">
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <div key={option.label} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-950">
                {option.label}. <span className="font-medium text-slate-700">{option.value}</span>
              </p>
            </div>
          ))}
        </div>
      </PracticeDetailSection>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <details>
          <summary className="cursor-pointer text-lg font-semibold text-slate-950">Correct Answer</summary>
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">
              {question.correctAnswer}. {correctOption?.value}
            </p>
          </div>
        </details>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PracticeDetailSection title="Detailed Explanation">
          <p className="text-sm leading-6 text-slate-700">{question.explanation}</p>
        </PracticeDetailSection>

        <PracticeDetailSection title="Shortcut / Trick">
          <p className="text-sm leading-6 text-slate-700">{question.shortcut}</p>
        </PracticeDetailSection>
      </section>

      <PracticeDetailSection title="Notes">
        <label className="block">
          <span className="sr-only">Notes</span>
          <textarea
            className="min-h-36 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Add formulas, shortcuts, or mistakes to revisit."
            value={state.notes}
            onChange={(event) => setNotes(question.id, event.target.value)}
          />
        </label>
      </PracticeDetailSection>
    </div>
  );
}
