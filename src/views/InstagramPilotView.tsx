import { useInstagramPilot } from '@/hooks/useInstagramPilot';
import { getWorkflowStage } from '@/data/workflow';
import { PLATFORMS } from '@/data/platforms';
import type { WorkflowStageId } from '@/types';
import {
  Instagram,
  Lock,
  Unlock,
  CheckCircle2,
  Circle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Layers,
  SlidersHorizontal,
  ClipboardCheck,
  Lightbulb,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

const STAGE_ICONS: Record<string, LucideIcon> = {
  'topic-selection': Lightbulb,
  'brief-creation': ClipboardCheck,
  'draft-generation': Layers,
  'asset-production': SlidersHorizontal,
  'caption-variants': SlidersHorizontal,
  scheduling: ClipboardCheck,
  handoff: ArrowRight,
  trigger: Rocket,
  'approval-checkpoint': CheckCircle2,
};

export function InstagramPilotView() {
  const pilot = useInstagramPilot();
  const {
    prerequisites,
    baselineElements,
    adjustments,
    pilotChecks,
    lessons,
    togglePrerequisite,
    toggleBaselineElement,
    toggleAdjustment,
    togglePilotCheck,
    allPrerequisitesMet,
    enabledAdjustmentCount,
    allPilotChecksPassed,
    pilotComplete,
    resetAll,
  } = pilot;

  const instagramPlatform = PLATFORMS.find((p) => p.id === 'instagram')!;
  const reusableLessons = lessons.filter((l) => !l.isInstagramSpecific);
  const instagramOnlyLessons = lessons.filter((l) => l.isInstagramSpecific);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${instagramPlatform.color}18` }}
          >
            <Instagram size={22} style={{ color: instagramPlatform.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Instagram Pilot Configuration</h2>
            <p className="text-sm text-slate-500">
              The first real channel test of the baseline system. Instagram runs on top of the
              validated universal workflow with only the minimum channel-specific adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-xl border p-5 mb-6 transition-all ${
          pilotComplete
            ? 'bg-emerald-400/[0.045] border-emerald-300'
            : allPrerequisitesMet
            ? 'bg-amber-400/[0.05] border-amber-400/15'
            : 'bg-[#070b10] border-[#1b2935]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              pilotComplete ? 'bg-emerald-100' : allPrerequisitesMet ? 'bg-amber-100' : 'bg-slate-200'
            }`}
          >
            {pilotComplete ? (
              <ShieldCheck size={24} className="text-emerald-400" />
            ) : allPrerequisitesMet ? (
              <Rocket size={24} className="text-amber-600" />
            ) : (
              <Lock size={24} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`text-sm font-semibold ${
                pilotComplete ? 'text-emerald-800' : allPrerequisitesMet ? 'text-amber-200/80' : 'text-slate-300'}
              }`}
            >
              {pilotComplete
                ? 'Pilot complete — Instagram is running on the validated baseline'
                : allPrerequisitesMet
                ? 'Prerequisites met — configure adjustments and run pilot checks'
                : 'Prerequisites not yet met — the pilot cannot begin'}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                pilotComplete ? 'text-emerald-400' : allPrerequisitesMet ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {pilotComplete
                ? 'Instagram can run as the first channel without breaking the simplicity, stability, or the universal fallback.'
                : `${baselineElements.filter((e) => e.reusedAsIs).length} of ${baselineElements.length} elements reused`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {baselineElements.map((el) => {
            const stage = getWorkflowStage(el.stageId);
            const StageIcon = STAGE_ICONS[el.stageId] || Circle;
            const reused = el.reusedAsIs;
            return (
              <button
                key={el.id}
                onClick={() => allPrerequisitesMet && toggleBaselineElement(el.id)}
                disabled={!allPrerequisitesMet}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  !allPrerequisitesMet ? 'cursor-not-allowed' : 'hover:bg-[#070b10]'
                } ${
                  reused
                    ? 'bg-emerald-400/[0.045]/30 border-emerald-400/10'
                    : 'bg-[#0b1118] border-[#1b2935]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#101820] flex items-center justify-center shrink-0">
                  <StageIcon size={16} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-200">{el.label}</h4>
                    {stage && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#101820] text-slate-500">
                        {stage.cadence}
                      </span>
                    )}
                    {reused ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-400/[0.045] text-emerald-400">
                        <CheckCircle2 size={10} />
                        Reused
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-400/[0.05] text-amber-600">
                        <AlertTriangle size={10} />
                        Modified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{el.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instagram-Specific Adjustments */}
      <div className={`mb-8 transition-all ${!allPrerequisitesMet ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-300">Instagram-Specific Adjustments</h3>
            <span className="text-xs text-slate-400">
              ({enabledAdjustmentCount}/{adjustments.length} enabled)
            </span>
          </div>
          <span className="text-xs text-slate-400">Only enable where it clearly improves the result</span>
        </div>
        <div className="space-y-2">
          {adjustments.map((adj) => {
            const stage = getWorkflowStage(adj.stageId);
            const StageIcon = STAGE_ICONS[adj.stageId] || Circle;
            const enabled = adj.enabled;
            return (
              <button
                key={adj.id}
                onClick={() => allPrerequisitesMet && toggleAdjustment(adj.id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
                  enabled
                    ? 'bg-cyan-400/[0.04]/50 border-sky-200'
                    : 'bg-[#0b1118] border-[#1b2935]'
                } ${!allPrerequisitesMet ? 'opacity-60' : ''}`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: enabled ? `${instagramPlatform.color}15` : '#F1F5F9',
                  }}
                >
                  <StageIcon
                    size={16}
                    style={{ color: enabled ? instagramPlatform.color : '#94A3B8' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-300">{adj.label}</p>
                    {enabled ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-400/[0.04] text-sky-600">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#101820] text-slate-400">
                        Off
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-500">Universal:</span> {adj.universalBehavior}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-500">Instagram:</span> {adj.instagramBehavior}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">{adj.rationale}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reusable Lessons */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Reusable Lessons for the Next Channel</h3>
        </div>

        {/* Reusable across channels */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Carry Forward to Other Channels
          </p>
          <div className="grid grid-cols-1 gap-2">
            {reusableLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-start gap-3 px-4 py-3 bg-[#0b1118] border border-[#1b2935] rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-400/[0.045] flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 leading-relaxed">{lesson.lesson}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    {lesson.appliesTo.map((pid) => {
                      const platform = PLATFORMS.find((p) => p.id === pid);
                      return platform ? (
                        <span
                          key={pid}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${platform.color}15`,
                            color: platform.color,
                          }}
                        >
                          {platform.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instagram-specific */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Instagram-Specific — Do Not Carry Forward
          </p>
          <div className="grid grid-cols-1 gap-2">
            {instagramOnlyLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-start gap-3 px-4 py-3 bg-[#070b10] border border-[#1b2935] rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-[#101820] flex items-center justify-center shrink-0">
                  <Lock size={15} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 leading-relaxed">{lesson.lesson}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#101820] text-slate-400">
                    Instagram only
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Check */}
      <div
        className={`rounded-xl border p-5 transition-all ${
          pilotComplete
            ? 'bg-emerald-400/[0.045] border-emerald-300'
            : 'bg-[#070b10] border-[#1b2935]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              pilotComplete ? 'bg-emerald-100' : 'bg-slate-200'
            }`}
          >
            <ShieldCheck
              size={20}
              className={pilotComplete ? 'text-emerald-400' : 'text-slate-400'}
            />
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${
                pilotComplete ? 'text-emerald-800' : 'text-slate-300'
              }`}
            >
              {pilotComplete
                ? 'Baseline validated — Instagram is ready to run'
                : 'Instagram pilot in progress'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pilotComplete
                ? 'The universal workflow has been proven on Instagram. Lessons apply to TikTok, Pinterest, and LinkedIn.'
                : 'Entry criteria must pass before the pilot moves to full rollout.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
