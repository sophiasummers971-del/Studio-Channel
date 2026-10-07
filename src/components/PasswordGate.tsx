import { useState, useCallback } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'channel-studio-auth';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string | undefined;

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!APP_PASSWORD) {
      setError('Workspace access is not configured.');
      return;
    }

    if (password === APP_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthenticated(true);
      setError('');
      return;
    }

    setError('Wrong password');
  }, [password]);

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-violet-900/50 bg-slate-900 p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-700">
          <Lock size={28} className="text-white" />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-100">Channel Studio</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Internal workspace gate. Production access will move behind a server-enforced identity boundary.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Password"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-slate-100 outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600"
          >
            Enter Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
