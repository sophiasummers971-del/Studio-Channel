import { useContentData } from '@/hooks/useContentData';
import { CONTENT_STAGES, STAGE_ORDER, getPlatform, getFormat } from '@/data/platforms';
import type { ContentItem, ContentStage } from '@/types';
import { ArrowRight, Database } from 'lucide-react';

interface PipelineViewProps {
  onItemClick: (item: ContentItem) => void;
}

export function PipelineView({ onItemClick }: PipelineViewProps) {
  const { content, dbLive, loading } = useContentData();
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Content Pipeline</h2>
          <p className="text-sm text-slate-500">
            Track content as it moves through the universal workflow stages
          </p>
        </div>
        {dbLive && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-400/[0.045] border border-emerald-400/20 px-2.5 py-1.5 rounded-full">
            <Database size={13} />
            Saved to database
          </span>
        )}
      </div>
      {loading && (
        <p className="text-sm text-slate-400 mb-4">Loading from database…</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stageId) => {
          const stageInfo = CONTENT_STAGES.find((s) => s.id === stageId)!;
          const items = content.filter((c) => c.stage === stageId);

          return (
            <div key={stageId} className="w-72 shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stageInfo.color }}
                  />
                  <h3 className="text-sm font-semibold text-slate-300">{stageInfo.label}</h3>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-[#101820] px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              <div className="bg-[#070b10] rounded-xl p-2 min-h-[200px] space-y-2">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-xs text-slate-400">
                    No items
                  </div>
                ) : (
                  items.map((item) => {
                    const platform = getPlatform(item.platform);
                    const format = getFormat(item.format);
                    if (!platform || !format) return null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className="group w-full text-left bg-[#0b1118] border border-[#1b2935] rounded-lg p-3 hover:shadow-md hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
                          >
                            {platform.label[0]}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {platform.label} · {format.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 line-clamp-2 group-hover:text-sky-600 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5">{item.assignee}</p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-2 px-1">
                <p className="text-[10px] text-slate-400 text-center">
                  {stageId !== 'published' && items.length > 0 && (
                    <span className="flex items-center justify-center gap-1">
                      Next: {STAGE_ORDER[STAGE_ORDER.indexOf(stageId) + 1] && CONTENT_STAGES.find((s) => s.id === STAGE_ORDER[STAGE_ORDER.indexOf(stageId) + 1])?.label}
                      <ArrowRight size={10} />
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
