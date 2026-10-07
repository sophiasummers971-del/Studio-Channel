import { useContentData } from '@/hooks/useContentData';
import { STAGE_ORDER, CONTENT_STAGES, getPlatform, getFormat } from '@/data/platforms';
import type { ContentItem } from '@/types';
import { ArrowRight, FileText, Settings, CheckCircle2 } from 'lucide-react';

interface HandoffFlowProps {
  onItemClick: (item: ContentItem) => void;
}

export function HandoffFlow({ onItemClick }: HandoffFlowProps) {
  const { content, loading, dbLive } = useContentData();

  const flowSteps = [
    {
      title: '1. Define Input',
      description: 'Topic, audience, tone, keywords, references, CTA, and brand guidelines are collected.',
      icon: FileText,
      color: '#0EA5E9',
      items: content.filter((c) => Object.keys(c.input).length >= 3),
    },
    {
      title: '2. Process Through Stages',
      description: 'Content moves through ideation, drafting, and review. Each stage is tracked in the pipeline.',
      icon: Settings,
      color: '#F59E0B',
      items: content.filter((c) =>
        ['ideation', 'drafting', 'review'].includes(c.stage)
      ),
    },
    {
      title: '3. Generate Output',
      description: 'Caption, hashtags, script, visual direction, thumbnail, posting time, and reach estimate are produced.',
      icon: CheckCircle2,
      color: '#10B981',
      items: content.filter((c) => Object.keys(c.output).length >= 3),
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Handoff Flow</h2>
        <p className="text-sm text-slate-500">
          Live content handoff state from Supabase. No sample rows are injected into counts or stage progression.
        </p>
      </div>

      {!dbLive && !loading && (
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 text-sm text-amber-200">
          Live content data is unavailable. This view will not substitute demo rows.
        </div>
      )}
      {loading && <div className="mb-5 text-sm text-slate-500">Loading live handoff evidence…</div>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {flowSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="relative">
              <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 h-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${step.color}12` }}
                >
                  <Icon size={24} style={{ color: step.color }} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{step.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="font-medium">{step.items.length}</span> items in this step
                </div>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                  <div className="w-6 h-6 rounded-full bg-[#0b1118] border border-[#1b2935] flex items-center justify-center shadow-sm">
                    <ArrowRight size={12} className="text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Stage Progression</h3>
        <div className="flex items-center gap-2">
          {STAGE_ORDER.map((stageId, i) => {
            const stage = CONTENT_STAGES.find((s) => s.id === stageId)!;
            const count = content.filter((c) => c.stage === stageId).length;
            return (
              <div key={stageId} className="flex items-center flex-1">
                <div className="flex-1 text-center">
                  <div
                    className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-1.5"
                    style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                  >
                    {count}
                  </div>
                  <p className="text-[10px] font-medium text-slate-400">{stage.label}</p>
                </div>
                {i < STAGE_ORDER.length - 1 && (
                  <ArrowRight size={14} className="text-slate-300 -mt-5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">All Content in Flow</h3>
        <div className="space-y-2">
          {content.map((item) => {
            const platform = getPlatform(item.platform);
            const format = getFormat(item.format);
            if (!platform || !format) return null;
            const stage = CONTENT_STAGES.find((s) => s.id === item.stage)!;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="group w-full flex items-center gap-3 bg-[#0b1118] border border-[#1b2935] rounded-lg px-4 py-3 hover:shadow-md hover:border-slate-300 transition-all text-left"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
                >
                  {platform.label[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate group-hover:text-sky-600 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {platform.label} · {format.label} · {item.assignee}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400">
                    {Object.keys(item.input).length} inputs
                  </span>
                  <ArrowRight size={12} className="text-slate-300" />
                  <span className="text-[10px] text-slate-400">
                    {Object.keys(item.output).length} outputs
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                  >
                    {stage.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
