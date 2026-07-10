import type { ReactNode } from 'react';

export const difficultyBadgeStyles = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Hard: 'bg-rose-50 text-rose-700 ring-rose-200'
} as const;

export const progressBarStyles = {
  Easy: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  Hard: 'bg-rose-500',
  Overall: 'bg-cyan-600'
} as const;

export function PracticeStatCard({
  label,
  value,
  detail,
  accentClassName
}: {
  label: string;
  value: string;
  detail: string;
  accentClassName: string;
}) {
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

export function PracticeFilterSelect({
  id,
  label,
  value,
  options,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
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

export function PracticeProgressRow({
  label,
  solved,
  total,
  percentage,
  barClassName
}: {
  label: string;
  solved: number;
  total: number;
  percentage: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-semibold text-slate-950">{label}</p>
        <p className="font-medium text-slate-600">
          {solved}/{total} solved
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function PracticePagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <button
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
      >
        Previous
      </button>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            className={[
              'h-9 w-9 rounded-md text-sm font-semibold transition',
              currentPage === page ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            ].join(' ')}
            type="button"
            onClick={() => onPageChange(page)}
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
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
      >
        Next
      </button>
    </div>
  );
}

export function PracticeDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
