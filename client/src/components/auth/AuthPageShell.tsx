import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AuthPageShellProps = {
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
  children: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkTo,
  children
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xl font-bold tracking-tight text-slate-950">PrepAI</p>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-slate-600">
          {footerText}{' '}
          <Link className="font-semibold text-slate-950 underline-offset-4 hover:underline" to={footerLinkTo}>
            {footerLinkText}
          </Link>
        </p>
      </section>
    </main>
  );
}
