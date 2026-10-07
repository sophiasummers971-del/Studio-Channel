import { MOCK_CONTENT } from '@/data/mockContent';
import { PLATFORMS, CONTENT_FORMATS, getPlatform, getFormat } from '@/data/platforms';
import type { ContentInput } from '@/types';
import {
  Target,
  Users,
  MessageSquare,
  Tag,
  Link2,
  Megaphone,
  BookOpen,
  ArrowDown,
  type LucideIcon,
} from 'lucide-react';

const INPUT_FIELDS: { key: keyof ContentInput; label: string; icon: LucideIcon; placeholder: string; type: 'text' | 'textarea' | 'tags' }[] = [
  { key: 'topic', label: 'Topic', icon: Target, placeholder: 'What is this content about?', type: 'text' },
  { key: 'audience', label: 'Target Audience', icon: Users, placeholder: 'Who is this for?', type: 'text' },
  { key: 'tone', label: 'Tone & Voice', icon: MessageSquare, placeholder: 'What feeling should it convey?', type: 'text' },
  { key: 'keywords', label: 'Keywords', icon: Tag, placeholder: 'Add keywords...', type: 'tags' },
  { key: 'references', label: 'References', icon: Link2, placeholder: 'Add reference links...', type: 'tags' },
  { key: 'callToAction', label: 'Call to Action', icon: Megaphone, placeholder: 'What should the viewer do?', type: 'text' },
  { key: 'brandGuidelines', label: 'Brand Guidelines', icon: BookOpen, placeholder: 'Any visual or tone rules?', type: 'textarea' },
];

export function InputPanel() {
  const sampleItem = MOCK_CONTENT.find((c) => Object.keys(c.input).length >= 5);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ArrowDown size={18} className="text-sky-500" />
          <h2 className="text-2xl font-bold text-slate-100">Standard Inputs</h2>
        </div>
        <p className="text-sm text-slate-500">
          The universal input model every channel uses to start the content workflow
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 bg-[#0b1118] border border-[#1b2935] rounded-lg px-3 py-2.5"
          >
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: `${p.color}18`, color: p.color }}
            >
              {p.label[0]}
            </span>
            <span className="text-xs font-medium text-slate-400">{p.label}</span>
            <span className="text-[10px] text-slate-400 ml-auto">
              {p.formats.length} formats
            </span>
          </div>
        ))}
      </div>

      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
        <div className="bg-[#070b10] px-5 py-3 border-b border-[#1b2935]">
          <h3 className="text-sm font-semibold text-slate-300">Input Schema</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            These fields are collected for every content item across all platforms
          </p>
        </div>

        <div className="p-5 space-y-4">
          {INPUT_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key}>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                  <Icon size={15} className="text-slate-400" />
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-[#070b10] border border-[#1b2935] rounded-lg outline-none transition-all focus:bg-[#0b1118] focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400 resize-none"
                  />
                ) : field.type === 'tags' ? (
                  <div className="flex items-center gap-2 flex-wrap min-h-[38px] px-3 py-2 bg-[#070b10] border border-[#1b2935] rounded-lg">
                    <span className="text-xs text-slate-400">Add tags and press Enter</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm bg-[#070b10] border border-[#1b2935] rounded-lg outline-none transition-all focus:bg-[#0b1118] focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {sampleItem && (
        <div className="mt-6 bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Sample Input</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(sampleItem.input).map(([key, value]) => (
              <div key={key} className="bg-[#070b10] rounded-lg p-3">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{key}</span>
                <p className="text-xs text-slate-300 mt-1">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}