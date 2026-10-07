import { MOCK_CONTENT } from '@/data/mockContent';
import { getPlatform, getFormat } from '@/data/platforms';
import type { ContentOutput } from '@/types';
import {
  FileText,
  Hash,
  ScrollText,
  Eye,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  ArrowUp,
  type LucideIcon,
} from 'lucide-react';

const OUTPUT_FIELDS: { key: keyof ContentOutput; label: string; icon: LucideIcon; description: string }[] = [
  { key: 'caption', label: 'Caption', icon: FileText, description: 'Primary text accompanying the content' },
  { key: 'hashtags', label: 'Hashtags', icon: Hash, description: 'Discoverability tags for the platform' },
  { key: 'script', label: 'Script', icon: ScrollText, description: 'Scene-by-scene or voiceover direction' },
  { key: 'visualDirection', label: 'Visual Direction', icon: Eye, description: 'Lighting, composition, and style guidance' },
  { key: 'thumbnailConcept', label: 'Thumbnail Concept', icon: ImageIcon, description: 'Cover image or first-frame direction' },
  { key: 'postingTime', label: 'Posting Time', icon: Clock, description: 'Recommended day and time for publishing' },
  { key: 'estimatedReach', label: 'Estimated Reach', icon: TrendingUp, description: 'Projected audience size range' },
];

export function OutputPanel() {
  const sampleItem = MOCK_CONTENT.find(
    (c) => Object.keys(c.output).length >= 4
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ArrowUp size={18} className="text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-100">Standard Outputs</h2>
        </div>
        <p className="text-sm text-slate-500">
          The universal output model the workflow produces for every content item
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {OUTPUT_FIELDS.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.key}
              className="flex items-start gap-3 bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-400/[0.045] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">{field.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
              </div>
              <span className="text-[10px] font-medium text-slate-400 bg-[#101820] px-2 py-1 rounded-full">
                Universal
              </span>
            </div>
          );
        })}
      </div>

      {sampleItem && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Sample Output</h3>
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#14202a]">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: `${getPlatform(sampleItem.platform)?.color}18`,
                  color: getPlatform(sampleItem.platform)?.color,
                }}
              >
                {getPlatform(sampleItem.platform)?.label[0]}
              </span>
              <span className="text-sm font-medium text-slate-300">{sampleItem.title}</span>
              <span className="text-xs text-slate-400">
                · {getFormat(sampleItem.format)?.label}
              </span>
            </div>
            <div className="space-y-3">
              {OUTPUT_FIELDS.map((field) => {
                const value = sampleItem.output[field.key];
                if (!value) return null;
                const Icon = field.icon;
                return (
                  <div key={field.key} className="flex items-start gap-3 bg-[#070b10] rounded-lg p-3">
                    <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                        {field.label}
                      </p>
                      <p className="text-sm text-slate-300">
                        {Array.isArray(value) ? value.join(' · ') : value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-emerald-400/[0.045] border border-emerald-400/10 rounded-xl">
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold">Reusability:</span> Every platform writes to this same
          output schema. Platform-specific outputs can add fields without breaking the shared
          structure, so downstream systems always know where to find the core results.
        </p>
      </div>
    </div>
  );
}
