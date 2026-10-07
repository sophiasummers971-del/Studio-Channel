import { useState, useMemo } from 'react';
import { MOCK_CONTENT } from '@/data/mockContent';
import { PLATFORMS, CONTENT_FORMATS, getPlatform, getFormat } from '@/data/platforms';
import type { PlatformId, ContentFormatId, ContentItem } from '@/types';
import { ContentCard } from '@/components/ContentCard';
import {
  Film,
  Clock,
  Image as ImageIcon,
  Pin,
  Video,
  ArrowLeft,
  Plus,
  type LucideIcon,
} from 'lucide-react';

const FORMAT_ICONS: Record<string, LucideIcon> = {
  Film,
  Clock,
  Image: ImageIcon,
  Pin,
  Video,
};

interface PlatformSectionProps {
  platformId: PlatformId;
  onBack: () => void;
  onItemClick: (item: ContentItem) => void;
}

export function PlatformSection({ platformId, onBack, onItemClick }: PlatformSectionProps) {
  const platform = getPlatform(platformId);
  const [activeFormat, setActiveFormat] = useState<ContentFormatId | 'all'>('all');

  const filteredContent = useMemo(() => {
    return MOCK_CONTENT.filter((c) => {
      if (c.platform !== platformId) return false;
      if (activeFormat !== 'all' && c.format !== activeFormat) return false;
      return true;
    });
  }, [platformId, activeFormat]);

  if (!platform) return null;

  const formatTabs = platform.formats.map((fmtId) => CONTENT_FORMATS[fmtId]).filter(Boolean);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${platform.color}15` }}
          >
            <span className="text-xl font-bold" style={{ color: platform.color }}>
              {platform.label[0]}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{platform.label}</h2>
            <p className="text-sm text-slate-500">{platform.description}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm">
          <Plus size={16} />
          New {platform.label} Content
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-[#1b2935] pb-px">
        <button
          onClick={() => setActiveFormat('all')}
          className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
            activeFormat === 'all'
              ? 'text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          All Content
          <span className="ml-1.5 text-xs text-slate-400">
            {MOCK_CONTENT.filter((c) => c.platform === platformId).length}
          </span>
          {activeFormat === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
          )}
        </button>
        {formatTabs.map((fmt) => {
          const Icon = FORMAT_ICONS[fmt.icon] || ImageIcon;
          const count = MOCK_CONTENT.filter(
            (c) => c.platform === platformId && c.format === fmt.id
          ).length;
          const isActive = activeFormat === fmt.id;
          return (
            <button
              key={fmt.id}
              onClick={() => setActiveFormat(fmt.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative flex items-center gap-2 ${
                isActive ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={15} />
              {fmt.label}
              <span className="text-xs text-slate-400">{count}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {activeFormat !== 'all' && (
        <div className="mb-6 p-4 bg-cyan-400/[0.04] border border-cyan-400/10 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              {(() => {
                const Icon = FORMAT_ICONS[getFormat(activeFormat)?.icon || ''] || ImageIcon;
                return <Icon size={18} className="text-sky-600" />;
              })()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {getFormat(activeFormat)?.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {getFormat(activeFormat)?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#101820] flex items-center justify-center mb-4">
            <Plus size={28} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">No content yet</p>
          <p className="text-xs text-slate-400">
            Create your first {activeFormat !== 'all' ? getFormat(activeFormat)?.label.toLowerCase() : ''} content for {platform.label}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <ContentCard key={item.id} item={item} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}
