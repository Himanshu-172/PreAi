import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getAuthErrorMessage } from '../services/authService';
import { api } from '../services/api';

type ApiProfileUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

function formatMemberSince(value?: string) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'P';
}

function getPasswordChecks(password: string) {
  return [
    {
      label: 'At least 8 characters',
      passed: password.length >= 8
    },
    {
      label: 'Uppercase letter',
      passed: /[A-Z]/.test(password)
    },
    {
      label: 'Lowercase letter',
      passed: /[a-z]/.test(password)
    },
    {
      label: 'Number',
      passed: /\d/.test(password)
    }
  ];
}

function getPasswordStrength(password: string) {
  const passedCount = getPasswordChecks(password).filter((check) => check.passed).length;

  if (!password) {
    return {
      label: 'Not started',
      value: 0,
      className: 'bg-slate-200'
    };
  }

  if (passedCount <= 2) {
    return {
      label: 'Weak',
      value: 33,
      className: 'bg-rose-500'
    };
  }

  if (passedCount === 3) {
    return {
      label: 'Good',
      value: 66,
      className: 'bg-amber-500'
    };
  }

  return {
    label: 'Strong',
    value: 100,
    className: 'bg-emerald-500'
  };
}

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <label className="text-sm font-semibold text-slate-700" htmlFor={htmlFor}>
      {label}
    </label>
  );
}

export function Profile() {
  const [profile, setProfile] = useState<ApiProfileUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const passwordStrength = useMemo(() => getPasswordStrength(passwordForm.newPassword), [passwordForm.newPassword]);
  const passwordChecks = useMemo(() => getPasswordChecks(passwordForm.newPassword), [passwordForm.newPassword]);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoadingProfile(true);
      setProfileError('');

      try {
        const response = await api.get<ApiEnvelope<{ user: ApiProfileUser }>>('/profile');

        if (ignore) {
          return;
        }

        setProfile(response.data.data.user);
        setDisplayName(response.data.data.user.name);
      } catch (error) {
        if (!ignore) {
          setProfileError(getAuthErrorMessage(error, 'Unable to load profile.'));
        }
      } finally {
        if (!ignore) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = displayName.trim();

    setProfileSuccess('');
    setProfileError('');

    if (!trimmedName) {
      setProfileError('Name is required.');
      return;
    }

    if (trimmedName.length > 80) {
      setProfileError('Name must be 80 characters or fewer.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await api.patch<ApiEnvelope<{ user: ApiProfileUser }>>('/profile', {
        name: trimmedName
      });

      setProfile(response.data.data.user);
      setDisplayName(response.data.data.user.name);
      setProfileSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileError(getAuthErrorMessage(error, 'Unable to update profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordSuccess('');
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (passwordChecks.some((check) => !check.passed)) {
      setPasswordError('New password must meet all strength requirements.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation must match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.patch<ApiEnvelope<{ updated: boolean }>>('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess('Password changed successfully.');
    } catch (error) {
      setPasswordError(getAuthErrorMessage(error, 'Unable to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-cyan-700">Profile & Settings</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Account settings</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Manage your display name and password for your PrepAI account.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Member since</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatMemberSince(profile?.createdAt)}</p>
          </div>
        </div>
      </section>

      {isLoadingProfile ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading profile...</p>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xl font-semibold text-white">
              {getInitials(profile?.name ?? displayName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-slate-950">{profile?.name ?? 'Profile'}</h2>
              <p className="mt-1 truncate text-sm text-slate-500">{profile?.email ?? 'Email unavailable'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Name</p>
              <p className="mt-1 break-words text-sm font-medium text-slate-950">{profile?.name ?? 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
              <p className="mt-1 break-words text-sm font-medium text-slate-950">{profile?.email ?? 'Not available'}</p>
              <p className="mt-1 text-xs text-slate-500">Email changes are not supported yet.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Member since</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{formatMemberSince(profile?.createdAt)}</p>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Edit Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Update the display name shown across your account.</p>

            <form className="mt-5 space-y-4" onSubmit={handleProfileSubmit}>
              <div>
                <FieldLabel htmlFor="profile-name" label="Display name" />
                <input
                  id="profile-name"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  type="text"
                  value={displayName}
                  maxLength={80}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={isLoadingProfile || isSavingProfile}
                />
              </div>

              {profileError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{profileError}</p> : null}
              {profileSuccess ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{profileSuccess}</p> : null}

              <div className="flex justify-end">
                <button
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  type="submit"
                  disabled={isLoadingProfile || isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Security</h2>
            <p className="mt-1 text-sm text-slate-500">Change your password using your current password.</p>

            <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="current-password" label="Current password" />
                  <input
                    id="current-password"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                    disabled={isChangingPassword}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="new-password" label="New password" />
                  <input
                    id="new-password"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="confirm-password" label="Confirm password" />
                  <input
                    id="confirm-password"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-950">Password strength</p>
                  <p className="text-sm font-semibold text-slate-700">{passwordStrength.label}</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${passwordStrength.className}`} style={{ width: `${passwordStrength.value}%` }} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {passwordChecks.map((check) => (
                    <p key={check.label} className={`text-sm font-medium ${check.passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {check.passed ? '✓' : '-'} {check.label}
                    </p>
                  ))}
                </div>
              </div>

              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Password confirmation does not match.</p>
              ) : null}
              {passwordError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{passwordError}</p> : null}
              {passwordSuccess ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{passwordSuccess}</p> : null}

              <div className="flex justify-end">
                <button
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  type="submit"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
