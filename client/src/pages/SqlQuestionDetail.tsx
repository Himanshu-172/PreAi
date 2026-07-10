import { Link, Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { sqlQuestions, type SqlDifficulty, type SqlQuestion } from '../data/sqlQuestions';
import { useSqlPracticeState } from '../hooks/useSqlPracticeState';

const difficultyStyles: Record<SqlDifficulty, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Hard: 'bg-rose-50 text-rose-700 ring-rose-200'
};

function DataTable({ table }: { table: SqlQuestion['sampleTables'][number] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-950">{table.name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-white text-xs uppercase text-slate-500">
            <tr>
              {table.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.name}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${table.name}-${rowIndex}-${cellIndex}`} className="whitespace-nowrap px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutputTable({ output }: { output: SqlQuestion['expectedOutput'] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {output.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {output.rows.map((row, rowIndex) => (
              <tr key={`output-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`output-${rowIndex}-${cellIndex}`} className="whitespace-nowrap px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SqlQuestionDetail() {
  const { id } = useParams();
  const questionId = Number(id);
  const question = sqlQuestions.find((item) => item.id === questionId);
  const { questionState, setSolved, toggleFavorite, setNotes } = useSqlPracticeState();

  if (!question) {
    return <Navigate to="/sql-practice" replace />;
  }

  const state = questionState[question.id];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Link className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline" to="/sql-practice">
          Back to SQL Practice
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{question.title}</h1>
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

      <DetailSection title="SQL Question">
        <p className="text-sm leading-6 text-slate-700">{question.prompt}</p>
      </DetailSection>

      <DetailSection title="Sample Tables">
        <div className="grid gap-4 xl:grid-cols-2">
          {question.sampleTables.map((table) => (
            <DataTable key={table.name} table={table} />
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Expected Output">
        <OutputTable output={question.expectedOutput} />
      </DetailSection>

      <section className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Explanation">
          <p className="text-sm leading-6 text-slate-700">{question.explanation}</p>
        </DetailSection>

        <DetailSection title="Hint">
          <p className="text-sm leading-6 text-slate-700">{question.hint}</p>
        </DetailSection>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <details>
          <summary className="cursor-pointer text-lg font-semibold text-slate-950">Solution</summary>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-50">
            <code>{question.solution}</code>
          </pre>
        </details>
      </section>

      <DetailSection title="Notes">
        <label className="block">
          <span className="sr-only">Notes</span>
          <textarea
            className="min-h-36 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Add query attempts, edge cases, or follow-up notes."
            value={state.notes}
            onChange={(event) => setNotes(question.id, event.target.value)}
          />
        </label>
      </DetailSection>
    </div>
  );
}
