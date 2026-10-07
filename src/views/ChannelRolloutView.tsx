import { useState } from 'react';
import { useRollout } from '@/hooks/useRollout';
import { getPlatform } from '@/data/platforms';
import { ROLLOUT_SEQUENCE } from '@/data/channelRollout';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  Database,
  Lock,
} from 'lucide-react';

export function ChannelRolloutView() {
  const { steps, loading, error, refresh } = useRollout();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const passed = steps.filter((step) => step.status === 'passed').length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Channel Rollout Evidence</h2>
        <p className="text-sm text-slate-500">
          Persisted rollout records only. Local checkboxes cannot activate or certify a channel.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={17} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Manual rollout simulator removed</p>
            <p className="text-xs text-amber-200/70 mt-1">
              A rollout step is shown as passed only when a real row exists in the rollout tables. Planned steps remain definitions, not status claims.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/[0.04] flex items-center justify-center">
              <Database size={19} className="text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {steps.length ? `${passed} of ${steps.length} persisted rollout steps passed` : 'No rollout evidence recorded'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Database tables: rollout_steps, rollout_entry_criteria, rollout_checkpoints
              </p>
            </div>
          </div>
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 bg-[#101820] rounded-lg hover:bg-[#13202a] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] px-3 py-2 text-xs text-rose-300">
            Rollout evidence error: {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading rollout evidence…</div>
      ) : steps.length ? (
        <div className="space-y-3 mb-8">
          {steps.map((step) => {
            const platform = getPlatform(step.platformId);
            const expanded = expandedId === step.id;
            const passedStep = step.status === 'passed';
            return (
              <div key={step.id} className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : step.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${passedStep ? 'bg-emerald-400/[0.08]' : 'bg-[#101820]'}`}>
                    {passedStep ? <CheckCircle2 size={17} className="text-emerald-400" /> : <Lock size={16} className="text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">{step.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {platform?.label || step.platformId} · persisted status: {step.status}
                    </p>
                  </div>
                </button>
                {expanded && (
                  <div className="px-5 pb-5 border-t border-[#14202a] pt-4 space-y-4">
                    {step.notes && <p className="text-xs text-slate-500">{step.notes}</p>}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Persisted entry criteria</p>
                      {step.entryCriteria.length ? step.entryCriteria.map((criterion) => (
                        <div key={criterion.id} className="flex items-start gap-2 py-1.5">
                          {criterion.met ? <CheckCircle2 size={13} className="text-emerald-400 mt-0.5" /> : <Circle size={13} className="text-slate-600 mt-0.5" />}
                          <div>
                            <p className="text-xs text-slate-300">{criterion.label}</p>
                            <p className="text-[11px] text-slate-600">{criterion.description}</p>
                          </div>
                        </div>
                      )) : <p className="text-xs text-slate-600">No persisted criteria.</p>}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Persisted checkpoints</p>
                      {step.checkpoints.length ? step.checkpoints.map((checkpoint) => (
                        <div key={checkpoint.id} className="flex items-start gap-2 py-1.5">
                          {checkpoint.passed ? <CheckCircle2 size={13} className="text-emerald-400 mt-0.5" /> : <Circle size={13} className="text-slate-600 mt-0.5" />}
                          <div>
                            <p className="text-xs text-slate-300">{checkpoint.label}</p>
                            <p className="text-[11px] text-slate-600">{checkpoint.description}</p>
                          </div>
                        </div>
                      )) : <p className="text-xs text-slate-600">No persisted checkpoints.</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-[#1b2935] bg-[#0b1118] p-6 text-center">
          <p className="text-sm text-slate-300">No real rollout state exists yet.</p>
          <p className="text-xs text-slate-600 mt-1">Nothing is marked ready, active, or passed without database evidence.</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Planned rollout definitions</h3>
        <p className="text-xs text-slate-600 mb-4">
          These are design targets only. They do not represent current state.
        </p>
        <div className="space-y-2">
          {ROLLOUT_SEQUENCE.map((step) => (
            <div key={step.id} className="bg-[#070b10] border border-[#14202a] rounded-lg px-4 py-3">
              <p className="text-sm text-slate-400">{step.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{step.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
