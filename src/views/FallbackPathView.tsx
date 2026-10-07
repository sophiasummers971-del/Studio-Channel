import { useFallback } from '@/hooks/useFallback';
import {
  FAILURE_CASES,
  FALLBACK_STEPS,
  MVP_OUTPUTS,
  SEVERITY_CONFIG,
} from '@/data/fallback';
import { getWorkflowStage } from '@/data/workflow';
import type { FailureCaseId } from '@/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Circle,
  ArrowRight,
  RotateCcw,
  Zap,
  Eye,
  Send,
  FileText,
  CheckSquare,
  Bell,
  Lock,
  Unlock,
  type LucideIcon,
} from 'lucide-react';

const MODE_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; label: string; description: string }
> = {
  normal: {
    icon: ShieldCheck,
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Normal Mode',
    description: 'The universal workflow is running normally. All channel-specific flows are active.',
  },
  fallback: {
    icon: ShieldAlert,
    color: '#F59E0B',
    bg: '#FFFBEB',
    label: 'Fallback Mode',
    description: 'A failure has been detected. The universal baseline is producing content without platform overrides.',
  },
  recovering: {
    icon: Shield,
    color: '#0EA5E9',
    bg: '#E0F2FE',
    label: 'Recovery Mode',
    description: 'The failed stage has been repaired. Walking through recovery checks before returning to normal.',
  },
};

const STEP_ICONS: Record<string, LucideIcon> = {
  'fb-01': Activity,
  'fb-02': Lock,
  'fb-03': Zap,
  'fb-04': FileText,
  'fb-05': CheckSquare,
  'fb-06': Send,
  'fb-07': Eye,
  'fb-08': Bell,
};

export function FallbackPathView() {
  const fallback = useFallback();
  const {
    mode,
    activeFailure,
    fallbackStepProgress,
    recoveryChecks,
    preDeployChecks,
    triggerFallback,
    advanceFallbackStep,
    beginRecovery,
    toggleRecoveryCheck,
    completeRecovery,
    togglePreDeployCheck,
    requiredRecoveryComplete,
    canCompleteRecovery,
    preDeployRequiredComplete,
    preDeployRequiredCount,
    preDeployCheckedCount,
  } = fallback;

  const modeCfg = MODE_CONFIG[mode];
  const ModeIcon = modeCfg.icon;
  const activeFailureCase = FAILURE_CASES.find((f) => f.id === activeFailure);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Fallback Path</h2>
        <p className="text-sm text-slate-500">
          The safety line that keeps content flowing when a channel-specific flow breaks. The
          universal baseline takes over, produces minimum viable content, and queues it for manual
          review until the broken path is repaired.
        </p>
      </div>

      {/* Mode Status Banner */}
      <div
        className="rounded-xl border p-5 mb-6 transition-all"
        style={{ backgroundColor: modeCfg.bg, borderColor: `${modeCfg.color}40` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${modeCfg.color}20` }}
          >
            <ModeIcon size={24} style={{ color: modeCfg.color }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: modeCfg.color }}>
              {modeCfg.label}
            </h3>
            <p className="text-xs mt-0.5 text-slate-600">{modeCfg.description}</p>
          </div>
          {activeFailureCase && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className="font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: SEVERITY_CONFIG[activeFailureCase.severity].bg,
                  color: SEVERITY_CONFIG[activeFailureCase.severity].color,
                }}
              >
                {SEVERITY_CONFIG[activeFailureCase.severity].label}
              </span>
              <span className="text-slate-600">{activeFailureCase.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Failure Case Simulator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Failure Case Simulator</h3>
        </div>
        <div className="space-y-2">
          {FALLBACK_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[step.id] || Circle;
            const isComplete = mode === 'fallback' && i < fallbackStepProgress;
            const isCurrent = mode === 'fallback' && i === fallbackStepProgress;
            const isMvp = step.isMvp;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
                    : isComplete
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : 'bg-[#0b1118] border-[#1b2935]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isComplete
                      ? 'bg-emerald-100'
                      : isCurrent
                      ? 'bg-amber-100'
                      : 'bg-slate-100'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 size={17} className="text-emerald-600" />
                  ) : (
                    <Icon
                      size={17}
                      className={isCurrent ? 'text-amber-600' : 'text-slate-400'}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {String(step.order).padStart(2, '0')}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-800">{step.label}</h4>
                    {isMvp && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                        MVP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recovery entry */}
        {mode === 'fallback' && fallbackStepProgress >= FALLBACK_STEPS.length && (
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={beginRecovery}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
            >
              <Shield size={16} />
              Begin Recovery
            </button>
          </div>
        )}
      </div>

      {/* Minimum Viable Output */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Minimum Viable Output</h3>
          <span className="text-xs text-slate-400">— what fallback mode must produce</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MVP_OUTPUTS.map((mvp) => (
            <div
              key={mvp.id}
              className="flex items-start gap-3 bg-[#0b1118] border border-[#1b2935] rounded-xl p-4"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={17} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">{mvp.label}</h4>
                  {mvp.required && (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                      <Lock size={8} />
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mvp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery Checks */}
      {mode === 'fallback' && fallbackStepProgress >= FALLBACK_STEPS.length && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Recovery Checks</h3>
          </div>
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 space-y-2">
            {recoveryChecks.map((check) => (
              <button
                key={check.id}
                onClick={() => toggleRecoveryCheck(check.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  check.checked
                    ? 'bg-emerald-50/50 border border-emerald-100'
                    : 'bg-[#070b10] border border-[#14202a] hover:bg-[#101820]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    check.checked ? 'bg-emerald-500' : 'bg-[#0b1118] border border-slate-300'
                  }`}
                >
                  {check.checked ? (
                    <CheckCircle2 size={12} className="text-white" />
                  ) : (
                    <Circle size={12} className="text-transparent" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={check.checked ? 'text-sm font-medium text-slate-700' : 'text-sm font-medium text-slate-600'}>
                    {check.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{check.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-400 text-center">
              Complete all required recovery checks before returning to normal mode.
            </p>
          </div>
        </div>
      )}

      {/* Pre-Deploy Validation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Pre-Deploy Validation</h3>
          </div>
          <span className="text-xs text-slate-400">
            {preDeployCheckedCount}/{preDeployRequiredCount} required checks passed
          </span>
        </div>

        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 space-y-2">
          {preDeployChecks.map((check) => {
            const checked = check.checked;
            return (
              <button
                key={check.id}
                onClick={() => togglePreDeployCheck(check.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  checked
                    ? 'bg-emerald-50/50 border border-emerald-100'
                    : 'bg-[#070b10] border border-[#14202a] hover:bg-[#101820]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    checked ? 'bg-emerald-500' : 'bg-[#0b1118] border border-slate-300'
                  }`}
                >
                  {checked ? (
                    <CheckCircle2 size={12} className="text-white" />
                  ) : (
                    <Circle size={12} className="text-transparent" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        checked ? 'text-slate-700' : 'text-slate-600'
                      }`}
                    >
                      {check.label}
                    </p>
                    {check.required && (
                      <span className="flex items-center gap-0.5 text-[9px] font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                        <Lock size={8} />
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {check.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className={`mt-4 p-4 rounded-xl border transition-all ${
            preDeployRequiredComplete
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {preDeployRequiredComplete ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={16} className="text-amber-600" />
            )}
            <p
              className={`text-xs font-medium ${
                preDeployRequiredComplete ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {preDeployRequiredComplete
                ? 'All required pre-deploy checks passed. The fallback path is ready for deployment.'
                : `${preDeployRequiredCount - preDeployCheckedCount} required check(s) still need to be passed before the fallback path is ready.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
