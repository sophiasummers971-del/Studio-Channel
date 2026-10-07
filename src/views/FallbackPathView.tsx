import {
  FAILURE_CASES,
  FALLBACK_STEPS,
  MVP_OUTPUTS,
  RECOVERY_CHECKS,
  FALLBACK_PRE_DEPLOY_CHECKS,
  SEVERITY_CONFIG,
} from '@/data/fallback';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Lock,
  FileText,
} from 'lucide-react';

export function FallbackPathView() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Fallback / Recovery Blueprint</h2>
        <p className="text-sm text-slate-500">
          Design specification for a future safety path. This page does not activate, detect, recover, notify, or reroute production workflow today.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-rose-400/25 bg-rose-400/[0.05] p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-rose-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-200">NOT IMPLEMENTED</p>
            <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
              The previous controls only changed local browser state. No production failure detector, automatic fallback switch, recovery engine, or operator notification path is currently wired.
            </p>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-300">Planned failure cases</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FAILURE_CASES.map((failure) => {
            const cfg = SEVERITY_CONFIG[failure.severity];
            return (
              <div key={failure.id} className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="text-sm font-semibold text-slate-200">{failure.label}</h4>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{failure.description}</p>
                <p className="text-[11px] text-slate-600 mt-2">
                  Planned detection: {failure.autoDetect ? 'automatic' : 'operator/manual'} · not wired
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-cyan-300" />
          <h3 className="text-sm font-semibold text-slate-300">Planned fallback sequence</h3>
        </div>
        <div className="space-y-2">
          {FALLBACK_STEPS.map((step) => (
            <div key={step.id} className="flex items-start gap-3 bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
              <span className="w-7 h-7 rounded-lg bg-[#101820] flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                {step.order}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-200">{step.label}</h4>
                  {step.isMvp && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-400/[0.06] text-cyan-300">MVP target</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Minimum viable safety outputs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MVP_OUTPUTS.map((item) => (
            <div key={item.id} className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Circle size={13} className="text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-200">{item.label}</h4>
                {item.required && <Lock size={11} className="text-rose-400" />}
              </div>
              <p className="text-xs text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Evidence required before this may be called operational</h3>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 space-y-2">
          {[...FALLBACK_PRE_DEPLOY_CHECKS, ...RECOVERY_CHECKS].map((check) => (
            <div key={check.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#070b10] border border-[#14202a]">
              <CheckCircle2 size={14} className="text-slate-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-slate-300">{check.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{check.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
