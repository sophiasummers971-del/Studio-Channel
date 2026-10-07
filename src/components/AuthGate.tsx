import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogIn, LogOut, ShieldCheck, ShieldX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type GateState = 'loading' | 'signed-out' | 'unauthorized' | 'authorized';

export function AuthGate({ children }: { children: ReactNode }) {
  const [gateState, setGateState] = useState<GateState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const evaluateSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setGateState('signed-out');
      return;
    }

    const { data, error: membershipError } = await supabase
      .from('studio_operators')
      .select('user_id')
      .eq('user_id', nextSession.user.id)
      .maybeSingle();

    if (membershipError) {
      setError('Could not verify Studio authorization.');
      setGateState('unauthorized');
      return;
    }

    setGateState(data?.user_id ? 'authorized' : 'unauthorized');
  }, []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) void evaluateSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) void evaluateSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [evaluateSession]);

  const requestMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const address = email.trim();
    if (!address) {
      setError('Enter the email address invited to Studio.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage('Magic link sent. Open it in this browser to continue.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setGateState('signed-out');
  };

  if (gateState === 'authorized') return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-700">
          {gateState === 'unauthorized' ? (
            <ShieldX size={30} className="text-white" />
          ) : (
            <ShieldCheck size={30} className="text-white" />
          )}
        </div>

        <h1 className="text-center text-2xl font-bold text-slate-100">Channel Studio</h1>

        {gateState === 'loading' && (
          <p className="mt-3 text-center text-sm text-slate-400">Checking secure workspace access…</p>
        )}

        {gateState === 'signed-out' && (
          <>
            <p className="mt-3 text-center text-sm text-slate-400">
              Sign in with your Studio email. New identities can be created here, but access stays locked until that user is added to the Studio operator allowlist.
            </p>
            <form onSubmit={requestMagicLink} className="mt-7 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600"
              >
                <LogIn size={16} />
                Send magic link
              </button>
            </form>
          </>
        )}

        {gateState === 'unauthorized' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-amber-800/50 bg-amber-950/40 p-4">
              <p className="text-sm font-semibold text-amber-200">Authenticated, but not authorized for Studio.</p>
              <p className="mt-2 break-all text-xs text-amber-300/80">
                User ID: {session?.user.id || 'unknown'}
              </p>
              <p className="mt-2 text-xs text-amber-300/80">
                An administrator must add this user ID to the Studio operator allowlist.
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}

        {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
