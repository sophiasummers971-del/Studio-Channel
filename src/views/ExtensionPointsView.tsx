import { EXTENSION_POINTS, WORKFLOW_STAGES, WORKFLOW_STAGE_ORDER } from '@/data/workflow';
import { PLATFORMS, getPlatform } from '@/data/platforms';
import type { PlatformId } from '@/types';
import {
  Zap,
  Compass,
  ClipboardList,
  PenLine,
  Image,
  Type,
  CheckSquare,
  CalendarClock,
  Send,
  Lock,
  Unlock,
  ArrowRight,
  Boxes,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STAGE_ICONS: Record<string, LucideIcon> = {
  Zap,
  Compass,
  ClipboardList,
  PenLine,
  Image,
  Type,
  CheckSquare,
  CalendarClock,
  Send,
};

export function ExtensionPointsView() {
  const universalPoints = EXTENSION_POINTS.filter((ep) => ep.universal);
  const channelPoints = EXTENSION_POINTS.filter((ep) => !ep.universal);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Extension Points</h2>
        <p className="text-sm text-slate-500">
          What stays universal in the baseline workflow and what will later become channel-specific.
          Each extension point shows the platform override that replaces the universal behavior.
        </p>
      </div>

      {/* Universal vs Channel Split */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-400/[0.04] flex items-center justify-center">
              <Lock size={18} className="text-sky-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Universal (Locked)</h3>
              <p className="text-xs text-slate-400">Same behavior across all channels</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {universalPoints.map((ep) => {
              const stage = WORKFLOW_STAGES.find((s) => s.id === ep.id);
              const Icon = STAGE_ICONS[stage?.icon || ''] || Lock;
              return (
                <div key={ep.id} className="flex items-center gap-2 px-3 py-2 bg-cyan-400/[0.04]/50 rounded-lg">
                  <Icon size={14} className="text-sky-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-300">{ep.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/[0.05] flex items-center justify-center">
              <Unlock size={18} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Channel-Specific (Extensible)</h3>
              <p className="text-xs text-slate-400">Overridden per platform</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {channelPoints.map((ep) => {
              const stage = WORKFLOW_STAGES.find((s) => s.id === ep.id);
              const Icon = STAGE_ICONS[stage?.icon || ''] || Unlock;
              return (
                <div key={ep.id} className="flex items-center gap-2 px-3 py-2 bg-amber-400/[0.05]/50 rounded-lg">
                  <Icon size={14} className="text-amber-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-300">{ep.label}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{ep.channelOverrides.length} overrides</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Stage Map with Extension Detail */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Stage-by-Stage Extension Map</h3>
        </div>

        <div className="space-y-3">
          {WORKFLOW_STAGE_ORDER.map((stageId, i) => {
            const stage = WORKFLOW_STAGES.find((s) => s.id === stageId)!;
            const extPoint = EXTENSION_POINTS.find((ep) => ep.id === stageId);
            const Icon = STAGE_ICONS[stage.icon] || Lock;
            const isUniversal = !extPoint || extPoint.universal;

            return (
              <div
                key={stageId}
                className={`bg-[#0b1118] border rounded-xl p-4 ${
                  isUniversal ? 'border-[#1b2935]' : 'border-amber-400/15'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUniversal ? 'bg-cyan-400/[0.04]' : 'bg-amber-400/[0.05]'
                      }`}
                    >
                      <Icon size={18} className={isUniversal ? 'text-sky-500' : 'text-amber-500'} />
                    </div>
                    {i < WORKFLOW_STAGE_ORDER.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-1 flex-1 min-h-[20px]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200">{stage.label}</h4>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isUniversal
                            ? 'bg-sky-100 text-cyan-200/75'
                            : 'bg-amber-100 text-amber-200/75'
                        }`}
                      >
                        {isUniversal ? 'Universal' : 'Channel-Specific'}
                      </span>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded-full bg-[#101820]">
                        {stage.cadence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{stage.description}</p>

                    {extPoint && !isUniversal && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {extPoint.channelOverrides.map((override) => {
                          const platform = getPlatform(override.platform);
                          if (!platform) return null;
                          return (
                            <div
                              key={override.platform}
                              className="flex items-start gap-2 px-3 py-2 bg-[#070b10] rounded-lg"
                            >
                              <span
                                className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
                                style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
                              >
                                {platform.label[0]}
                              </span>
                              <div>
                                <p className="text-[10px] font-medium text-slate-400">{platform.label}</p>
                                <p className="text-[11px] text-slate-500 leading-snug">{override.behavior}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Future Channel Summary */}
      <div className="bg-gradient-to-br from-slate-50 to-sky-50 border border-[#1b2935] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Boxes size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-300">How Channel-Specific Flows Will Plug In</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              <span><strong>Universal stages</strong> run identically for every channel</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span><strong>Extension points</strong> are overridden when a channel-specific flow is active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span><strong>Fallback</strong> disables overrides and runs the universal baseline</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {PLATFORMS.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center gap-1 px-3 py-2 bg-[#0b1118] rounded-lg border border-[#1b2935]"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: `${p.color}18`, color: p.color }}
                >
                  {p.label[0]}
                </span>
                <span className="text-[10px] text-slate-500">{p.label}</span>
              </div>
            ))}
            <ArrowRight size={16} className="text-slate-300" />
            <div className="flex flex-col items-center gap-1 px-3 py-2 bg-slate-900 rounded-lg">
              <Layers size={16} className="text-white" />
              <span className="text-[10px] text-slate-300">Baseline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}