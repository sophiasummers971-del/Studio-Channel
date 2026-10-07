import { useState, useCallback } from 'react';
import { useContentData } from '@/hooks/useContentData';
import { useWeeklyBatch } from '@/hooks/useWeeklyBatch';
import { generateContent, generateContentAI, type GenerationInput } from '@/lib/generateContent';
import { PLATFORMS, getPlatform, getFormat } from '@/data/platforms';
import type { PlatformId, ContentItem } from '@/types';
import {
  Sparkles,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  RefreshCw,
  X,
  Target,
  Users,
  MessageSquare,
  Hash,
  Calendar,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  ScrollText,
} from 'lucide-react';

const NICHES = [
  'AI productivity',
  'dark fantasy',
  'ancient wisdom',
  'solopreneur',
];

const TONES = [
  'Inspirational & empowering',
  'Dark & mysterious',
  'Casual & friendly',
  'Professional & authoritative',
  'Bold & provocative',
  'Educational & clear',
];

export function ContentGeneratorView() {
  const { content, addContent, dbLive } = useContentData();
  const { batchId, weekLabel, items: batchItems, addToBatch, addMultipleToBatch } = useWeeklyBatch();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('instagram');
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('AI productivity');
  const [tone, setTone] = useState('Inspirational & empowering');
  const [audience, setAudience] = useState('');
  const [count, setCount] = useState(7);
  const [useAI, setUseAI] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ContentItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenerated([]);
    setSaved(new Set());

    // Simulate slight delay for UX
    setTimeout(async () => {
      const input: GenerationInput = {
        platform: selectedPlatform,
        topic: topic.trim(),
        niche,
        tone,
        audience: audience.trim() || 'General audience interested in ' + niche,
        count,
      };
      const items = useAI ? await generateContentAI(input) : generateContent(input);
      setGenerated(items);
      setGenerating(false);
    }, 800);
  }, [selectedPlatform, topic, niche, tone, audience, count, useAI]);

  const handleSaveItem = useCallback(async (item: ContentItem) => {
    const savedItem = await addContent({
      platform: item.platform,
      format: item.format,
      title: item.title,
      stage: 'ideation',
      assignee: 'AI Generator',
      input: item.input,
      output: item.output,
    });
    await addToBatch(savedItem);
    setSaved((prev) => new Set(prev).add(item.id));
  }, [addContent, addToBatch]);

  const handleSaveAll = useCallback(async () => {
    const toSave = generated.filter((item) => !saved.has(item.id));
    for (const item of toSave) {
      const savedItem = await addContent({
        platform: item.platform,
        format: item.format,
        title: item.title,
        stage: 'ideation',
        assignee: 'AI Generator',
        input: item.input,
        output: item.output,
      });
      await addToBatch(savedItem);
      setSaved((prev) => new Set(prev).add(item.id));
    }
  }, [generated, saved, addContent, addToBatch]);

  const platform = getPlatform(selectedPlatform);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Content Generator</h2>
            <p className="text-sm text-slate-500">
              Generate a week of platform-specific content with AI — review, approve, publish
            </p>
          </div>
        </div>
        {dbLive && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/[0.045] px-2.5 py-1 rounded-full border border-emerald-400/20 ml-14">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected to Supabase
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Generator Form */}
        <div className="lg:col-span-1 space-y-5">
          {/* Platform selector */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id as PlatformId)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedPlatform === p.id
                      ? 'text-white shadow-md'
                      : 'bg-[#070b10] text-slate-400 hover:bg-[#101820] border border-[#1b2935]'
                  }`}
                  style={selectedPlatform === p.id ? { backgroundColor: p.color } : {}}
                >
                  <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center bg-[#0b1118]/20">
                    {p.label[0]}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Target size={13} /> Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 AI tools that save 3 hours daily"
              className="w-full px-3 py-2.5 rounded-lg border border-[#1b2935] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Niche */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Hash size={13} /> Niche
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    niche === n
                      ? 'bg-violet-100 text-violet-300 border border-violet-300'
                      : 'bg-[#070b10] text-slate-500 border border-[#1b2935] hover:bg-[#101820]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <MessageSquare size={13} /> Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#1b2935] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-[#0b1118]"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Audience */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Users size={13} /> Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Solo entrepreneurs aged 25-40"
              className="w-full px-3 py-2.5 rounded-lg border border-[#1b2935] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Count */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Calendar size={13} /> Posts to Generate
            </label>
            <div className="flex items-center gap-3">
              {[3, 5, 7, 14].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    count === n
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-[#070b10] text-slate-500 border border-[#1b2935] hover:bg-[#101820]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* AI Mode Toggle */}
          <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles size={13} /> Content Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUseAI(true)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  useAI
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-[#070b10] text-slate-400 border border-[#1b2935] hover:bg-[#101820]'
                }`}
              >
                <Sparkles size={14} />
                AI Generated
              </button>
              <button
                onClick={() => setUseAI(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  !useAI
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-[#070b10] text-slate-400 border border-[#1b2935] hover:bg-[#101820]'
                }`}
              >
                <RefreshCw size={14} />
                Template
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              AI mode uses OpenAI via Supabase Edge Function. Template mode works offline.
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
          >
            {generating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating {count} posts...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate {count} Posts
              </>
            )}
          </button>
        </div>

        {/* Right: Generated Content */}
        <div className="lg:col-span-2">
          {generated.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center py-20">
              <div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center border border-violet-400/10">
                  <Sparkles size={32} className="text-violet-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Generate</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Fill in the topic and settings on the left, then hit Generate. Your content will appear here — review, edit, save to pipeline.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch actions */}
              <div className="flex items-center justify-between bg-[#0b1118] border border-[#1b2935] rounded-xl px-4 py-3">
                <span className="text-sm text-slate-400">
                  <strong>{generated.length}</strong> posts generated for{' '}
                  <span style={{ color: platform?.color }} className="font-semibold">{platform?.label}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-[#101820] rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} /> Regenerate
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={saved.size === generated.length}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} /> Save All to Pipeline
                  </button>
                </div>
              </div>

              {/* Content cards */}
              {generated.map((item, idx) => {
                const isExpanded = expandedId === item.id;
                const isSaved = saved.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-[#0b1118] border rounded-xl overflow-hidden transition-all ${
                      isSaved ? 'border-emerald-400/20 bg-emerald-400/[0.045]/30' : 'border-[#1b2935] hover:border-violet-400/15'
                    }`}
                  >
                    {/* Card header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: platform?.color }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{item.title}</h4>
                          <span className="text-xs text-slate-400">
                            {getFormat(item.format)?.label} · {item.output.postingTime} · Est. {item.output.estimatedReach}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSaved ? (
                          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Saved
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveItem(item); }}
                            className="px-3 py-1.5 text-xs font-medium text-violet-300 bg-violet-400/[0.045] border border-violet-400/15 rounded-lg hover:bg-violet-100 transition-all flex items-center gap-1"
                          >
                            <Plus size={13} /> Save
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : item.id); }}
                          className="p-1.5 rounded-lg hover:bg-[#101820] transition-all text-slate-400"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#14202a] pt-3 space-y-3">
                        {/* Caption */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                            <FileText size={12} /> Caption
                          </div>
                          <p className="text-sm text-slate-300 bg-[#070b10] rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                            {item.output.caption}
                          </p>
                        </div>
                        {/* Hashtags */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                            <Hash size={12} /> Hashtags
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.output.hashtags?.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Script */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                            <ScrollText size={12} /> Script / Flow
                          </div>
                          <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3 whitespace-pre-wrap">
                            {item.output.script}
                          </p>
                        </div>
                        {/* Visual Direction */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                            <ImageIcon size={12} /> Visual Direction
                          </div>
                          <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3 whitespace-pre-wrap">
                            {item.output.visualDirection}
                          </p>
                        </div>
                        {/* Thumbnail */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                            <ImageIcon size={12} /> Thumbnail Concept
                          </div>
                          <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3">
                            {item.output.thumbnailConcept}
                          </p>
                        </div>

                        {/* Pinterest-specific fields */}
                        {item.platform === 'pinterest' && (item.output.pinTitle || item.output.boardName) && (
                          <div className="grid grid-cols-2 gap-3">
                            {item.output.pinTitle && (
                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                                  <FileText size={12} /> Pin Title
                                </div>
                                <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3">
                                  {item.output.pinTitle}
                                </p>
                              </div>
                            )}
                            {item.output.boardName && (
                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                                  <Target size={12} /> Board
                                </div>
                                <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3">
                                  {item.output.boardName}
                                </p>
                              </div>
                            )}
                            {item.output.pinDescription && (
                              <div className="col-span-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                                  <ScrollText size={12} /> Pin Description (SEO)
                                </div>
                                <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3 whitespace-pre-wrap">
                                  {item.output.pinDescription}
                                </p>
                              </div>
                            )}
                            {item.output.altText && (
                              <div className="col-span-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                                  <ImageIcon size={12} /> Alt Text
                                </div>
                                <p className="text-sm text-slate-400 bg-[#070b10] rounded-lg p-3">
                                  {item.output.altText}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
