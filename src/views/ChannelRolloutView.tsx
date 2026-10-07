import { useState } from 'react';
import { useRollout } from '@/hooks/useRollout';
import { getPlatform } from '@/data/platforms';
import { ROLLOUT_DEPENDENCIES, PHASE_LABELS, PHASE_COLORS } from '@/data/channelRollout';
import type { ChannelRolloutStep, RolloutPhaseId } from '@/types';
import {
  Rocket,
  Lock,
  Unlock,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Layers,
  GitBranch,
  Flag,
  TrendingUp,
  Clock,
  type LucideIcon,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  locked: { icon: Lock, color: '#94A3B8', bg: '#F1F5F9', label: 'Locked' },
  ready: { icon: Unlock, color: '#0EA5E9', bg: '#E0F2FE', label: 'Ready' },
  'in-progress': { icon: Clock, color: '#F59E0B', bg: '#FFFBEB', label: 'In Progress' },
  passed: { icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5', label: 'Passed' },
  blocked: { icon: AlertTriangle, color: '#EF4444', bg: '#FEF2F2', label: 'Blocked' },
};

export function ChannelRolloutView() {
  const rollout = useRollout();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    steps,
    completedCount,
    isFullyRolledOut,
    toggleEntryCriterion,
    toggleCheckpoint,
    activateStep,
    completeStep,
    resetStep,
    resetAll,
    canActivate,
    canComplete,
    allEntryCriteriaMet,
    allCheckpointsPassed,
    areDependenciesMet,
  } = rollout;

  const channelSteps = steps.filter((s) => s.checkpoints.length > 0);
  const phaseSteps = steps.filter((s) => s.checkpoints.length === 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Channel Rollout</h2>
        <p className="text-sm text-slate-500">
          A gated, phased path from the deployed universal baseline into channel-specific setups.
          Each channel is added one at a time, only after the previous step passes its checks.
        </p>
      </div>

      {/* Progress Banner */}
      <div
        className={`rounded-xl border p-5 mb-6 transition-all ${
          isFullyRolledOut
            ? 'bg-emerald-400/[0.045] border-emerald-300'
            : 'bg-cyan-400/[0.04] border-cyan-400/15'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isFullyRolledOut ? 'bg-emerald-100' : 'bg-sky-100'
            }`}
          >
            {isFullyRolledOut ? (
              <ShieldCheck size={24} className="text-emerald-400" />
            ) : (
              <TrendingUp size={24} className="text-sky-600" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`text-sm font-semibold ${
                isFullyRolledOut ? 'text-emerald-800' : 'text-sky-800'
              }`}
            >
              {isFullyRolledOut
                ? 'All channels rolled out'
                : `${completedCount} of ${steps.length} steps complete`}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isFullyRolledOut ? 'text-emerald-400' : 'text-sky-600'
              }`}
            >
              {isFullyRolledOut
                ? 'Every channel is running a channel-specific flow on top of the validated baseline.'
                : 'Channels are added one at a time. The baseline workflow stays running underneath as the safety line.'}
            </p>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-[#0b1118] border border-[#1b2935] rounded-lg hover:bg-[#070b10] transition-colors"
          >
            <RotateCcw size={13} />
            Reset All
          </button>
        </div>
      </div>


      {/* Working Rule Callout */}
      <div className="mb-8 p-4 bg-amber-400/[0.05] border border-amber-400/10 rounded-xl">
        <div className="flex items-start gap-3">
          <Flag size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-200/80">Working Rule</h4>
            <p className="text-xs text-amber-200/75 mt-1 leading-relaxed">
              Roll out only at a pace that keeps the system smooth and manageable. Prefer steady expansion
              over fast expansion. Stop and simplify if a new channel introduces unnecessary pressure.
            </p>
          </div>
        </div>
      </div>

      {/* Step Cards */}
      <div className="space-y-4 mb-8">
        {steps.map((step) => {
          const platform = getPlatform(step.platformId);
          const isPhase = step.checkpoints.length === 0;
          const statusCfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.locked;
          const expanded = expandedId === step.id;
          const criteriaMet = step.entryCriteria.every((c) => c.met);
          const depsMet = areDependenciesMet(step, steps);
          const canAct = canActivate(step);
          const canComp = canComplete(step);

          return (
            <div
              key={step.id}
              className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden transition-all hover:shadow-sm"
            >
              {/* Step Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : step.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: statusCfg.bg }}
                >
                  <statusCfg.icon size={16} style={{ color: statusCfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{step.label}</span>
                    {platform && !isPhase && (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
                      >
                        {platform.label}
                      </span>
                    )}
                    {!isPhase && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-violet-100 text-violet-300">
                        Channel Step
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{step.notes}</p>
                </div>
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0"
                  style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                >
                  <statusCfg.icon size={11} />
                  {statusCfg.label}
                </span>
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="px-5 pb-5 border-t border-[#14202a]">
                  {/* Entry Criteria */}
                  {step.entryCriteria.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                        <Layers size={12} />
                        Entry Criteria
                      </p>
                      <div className="space-y-1.5">
                        {step.entryCriteria.map((criterion) => {
                          const met = criterion.met;
                          return (
                            <button
                              key={criterion.id}
                              onClick={() => toggleEntryCriterion(step.id, criterion.id)}
                              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                met
                                  ? 'bg-emerald-400/[0.045]/50 border border-emerald-400/10'
                                  : 'bg-[#070b10] border border-[#14202a] hover:bg-[#101820]'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                  met ? 'bg-emerald-400/[0.045]0' : 'bg-[#0b1118] border border-slate-300'
                                }`}
                              >
                                {met ? (
                                  <CheckCircle2 size={12} className="text-white" />
                                ) : (
                                  <Circle size={12} className="text-transparent" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-medium ${
                                    met ? 'text-slate-300' : 'text-slate-400'
                                  }`}
                                >
                                  {criterion.label}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                  {criterion.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Checkpoints (only for channel steps) */}
                  {step.checkpoints.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={12} />
                        Checkpoints
                      </p>
                      <div className="space-y-1.5">
                        {step.checkpoints.map((cp) => {
                          const passed = cp.passed;
                          return (
                            <button
                              key={cp.id}
                              onClick={() => toggleCheckpoint(step.id, cp.id)}
                              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                passed
                                  ? 'bg-emerald-400/[0.045]/50 border border-emerald-400/10'
                                  : 'bg-[#070b10] border border-[#14202a] hover:bg-[#101820]'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                  passed ? 'bg-emerald-400/[0.045]0' : 'bg-[#0b1118] border border-slate-300'
                                }`}
                              >
                                {passed ? (
                                  <CheckCircle2 size={12} className="text-white" />
                                ) : (
                                  <Circle size={12} className="text-transparent" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${passed ? 'text-slate-300' : 'text-slate-400'}`}>
                                  {cp.label}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                  {cp.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}


                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#14202a] flex items-center gap-2">
                      {step.status === 'locked' && canAct && (
                        <button
                          onClick={() => activateStep(step.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-cyan-400/[0.04]0 rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
                        >
                          <Rocket size={15} />
                          {isPhase ? 'Confirm & Proceed' : 'Activate Channel'}
                        </button>
                      )}
                      {step.status === 'locked' && !canAct && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Lock size={12} />
                          {step.dependencies.length > 0 && !depsMet
                            ? 'Waiting on previous step to pass'
                            : !criteriaMet
                            ? 'Meet all entry criteria to unlock'
                            : 'Cannot activate yet'}
                        </span>
                      )}
                      {step.status === 'in-progress' && canComp && (
                        <button
                          onClick={() => completeStep(step.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-400/[0.045]0 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                          <CheckCircle2 size={15} />
                          Complete & Pass
                        </button>
                      )}
                      {step.status === 'in-progress' && !canComp && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={12} />
                          Pass all checkpoints to complete
                        </span>
                      )}
                      {step.status === 'passed' && (
                        <button
                          onClick={() => resetStep(step.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-[#101820] rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <RotateCcw size={12} />
                          Reset Step
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      {/* Dependency Map */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Dependency Map</h3>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
          <div className="space-y-2">
            {ROLLOUT_DEPENDENCIES.map((dep) => {
              const fromStep = steps.find((s) => s.id === dep.from);
              const toStep = steps.find((s) => s.id === dep.to);
              const fromPassed = fromStep && fromStep.status === 'passed';
              if (!fromStep || !toStep) return null;
              return (
                <div
                  key={dep.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#070b10] rounded-lg"
                >
                  <span className="text-xs font-medium text-slate-400">{fromStep.label}</span>
                  <ArrowRight size={12} className={`${fromPassed ? 'text-emerald-400' : 'text-slate-300'}`} />
                  <span className="text-xs font-medium text-slate-400">{toStep.label}</span>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    dep.type === 'blocking' ? 'bg-red-100 text-red-700' :
                    dep.type === 'conditional' ? 'bg-amber-100 text-amber-200/75' :
                    'bg-[#101820] text-slate-500'
                  }`}>
                    {dep.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}