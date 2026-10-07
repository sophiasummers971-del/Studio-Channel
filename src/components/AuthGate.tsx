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
    <div className="relative min-h-screen flex items-center justify-center bg-[#030507] px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/[0.035] blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[26rem] rounded-full bg-violet-500/[0.035] blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#1b2b37] bg-[#091017]/95 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-700">
          {gateState === 'unauthorized' ? (
            <ShieldX size={30} className="text-white" />
          ) : (
            <ShieldCheck size={30} className="text-white" />
          )}
        </div>

        <p className="studio-kicker mb-2 text-center">SECURE OPERATOR ACCESS</p>
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
                className="studio-input w-full px-4 py-3 text-slate-100"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/15"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.035] border border-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
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
