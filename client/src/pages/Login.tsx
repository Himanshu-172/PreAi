import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, 'Unable to log in. Check your details and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Log in to PrepAI"
      description="Continue your interview preparation workspace."
      footerText="New to PrepAI?"
      footerLinkText="Create an account"
      footerLinkTo="/register"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthPageShell>
  );
}
