import type { ContentItem } from '@/types';
import { getPlatform, getFormat, getStageInfo } from '@/data/platforms';
import { Calendar, User, ChevronRight } from 'lucide-react';

interface ContentCardProps {
  item: ContentItem;
  onClick?: (item: ContentItem) => void;
  compact?: boolean;
}

export function ContentCard({ item, onClick, compact }: ContentCardProps) {
  const platform = getPlatform(item.platform);
  const format = getFormat(item.format);
  const stage = getStageInfo(item.stage);

  if (!platform || !format || !stage) return null;

  return (
    <button
      onClick={() => onClick?.(item)}
      className="group w-full text-left bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
          >
            {platform.label[0]}
          </span>
          <span className="text-xs font-medium text-slate-500">{format.label}</span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
        >
          {stage.label}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-slate-100 mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors">
        {item.title}
      </h3>

      {!compact && (
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <User size={12} />
            {item.assignee}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#14202a] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Object.keys(item.output).length > 0 ? (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/[0.045]0" />
              Output ready
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              In progress
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
