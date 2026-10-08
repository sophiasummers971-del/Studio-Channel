import { useState, useCallback } from 'react';
import { usePublishPipeline } from '@/hooks/usePublishPipeline';
import { PLATFORMS, getPlatform, getFormat } from '@/data/platforms';
import type { ScheduledContent, PlatformId } from '@/types';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink,
  Zap,
  AlertTriangle,
  Rocket,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Queued', color: '#94A3B8', bg: '#F1F5F9', icon: Clock },
  publishing: { label: 'Publishing', color: '#F59E0B', bg: '#FFFBEB', icon: Loader2 },
  published: { label: 'Published', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
  failed: { label: 'Failed', color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

export function PublishHandoffView() {
  const {
    scheduled,
    loading,
    publishing,
    publishItem,
    publishAll,
    setPinterestMediaUrl,
    uploadMedia,
    removeMedia,
  } = usePublishPipeline();
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; error?: string; pinLink?: string; externalUrl?: string }>>({});
  const [mediaDrafts, setMediaDrafts] = useState<Record<string, string>>({});
  const [savingMedia, setSavingMedia] = useState<Set<string>>(new Set());
  const [uploadingMedia, setUploadingMedia] = useState<Set<string>>(new Set());

  const saveMediaUrl = useCallback(async (item: ScheduledContent) => {
    const value = (mediaDrafts[item.id] ?? item.output.mediaUrl ?? '').trim();
    setSavingMedia((prev) => new Set(prev).add(item.id));
    try {
      await setPinterestMediaUrl(item, value);
      setResults((prev) => ({ ...prev, [item.id]: { ok: false, error: value ? 'Image URL saved. Ready for publish validation.' : 'Image URL cleared.' } }));
    } catch (error) {
      setResults((prev) => ({ ...prev, [item.id]: { ok: false, error: error instanceof Error ? error.message : 'Could not save image URL.' } }));
    } finally {
      setSavingMedia((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [mediaDrafts, setPinterestMediaUrl]);

  const handleMediaUpload = useCallback(async (item: ScheduledContent, file: File | null) => {
    if (!file) return;
    setUploadingMedia((prev) => new Set(prev).add(item.id));
    try {
      const publicUrl = await uploadMedia(item, file);
      setMediaDrafts((prev) => ({ ...prev, [item.id]: publicUrl }));
      setResults((prev) => ({
        ...prev,
        [item.id]: { ok: false, error: 'Media uploaded and attached. Ready for publish validation.' },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [item.id]: {
          ok: false,
          error: error instanceof Error ? error.message : 'Could not upload media.',
        },
      }));
    } finally {
      setUploadingMedia((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [uploadMedia]);

  const handleRemoveMedia = useCallback(async (item: ScheduledContent) => {
    setUploadingMedia((prev) => new Set(prev).add(item.id));
    try {
      await removeMedia(item);
      setMediaDrafts((prev) => ({ ...prev, [item.id]: '' }));
      setResults((prev) => ({
        ...prev,
        [item.id]: { ok: false, error: 'Media removed from this content item.' },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [item.id]: {
          ok: false,
          error: error instanceof Error ? error.message : 'Could not remove media.',
        },
      }));
    } finally {
      setUploadingMedia((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [removeMedia]);

  const filtered = activePlatform
    ? scheduled.filter((item) => item.platform === activePlatform)
    : scheduled;

  const pendingCount = filtered.filter(
    (item) => !item.publishJob || item.publishJob.status === 'pending'
  ).length;

  const publishedCount = filtered.filter(
    (item) => item.publishJob?.status === 'published'
  ).length;

  const failedCount = filtered.filter(
    (item) => item.publishJob?.status === 'failed'
  ).length;

  const handlePublish = useCallback(
    async (item: ScheduledContent) => {
      const result = await publishItem(item);
      setResults((prev) => ({ ...prev, [item.id]: result }));
    },
    [publishItem]
  );

  const handlePublishAll = useCallback(async () => {
    if (!activePlatform) return;
    const bulkResults = await publishAll(activePlatform);
    const map: Record<string, { ok: boolean; error?: string }> = {};
    for (const r of bulkResults) map[r.id] = { ok: r.ok, error: r.error };
    setResults((prev) => ({ ...prev, ...map }));
  }, [activePlatform, publishAll]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading publish pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Rocket size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Publish Handoff</h2>
            <p className="text-sm text-slate-500">
              Scheduled content ready to publish — push to live platforms
            </p>
          </div>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActivePlatform(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !activePlatform
              ? 'bg-slate-900 text-white'
              : 'bg-[#0b1118] border border-[#1b2935] text-slate-400 hover:bg-[#070b10]'
          }`}
        >
          All ({scheduled.length})
        </button>
        {PLATFORMS.map((p) => {
          const count = scheduled.filter((s) => s.platform === p.id).length;
          if (count === 0) return null;
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id as PlatformId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activePlatform === p.id
                  ? 'text-white shadow-md'
                  : 'bg-[#0b1118] border border-[#1b2935] text-slate-400 hover:bg-[#070b10]'
              }`}
              style={activePlatform === p.id ? { backgroundColor: p.color } : {}}
            >
              <span>{p.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activePlatform === p.id ? 'bg-[#0b1118]/20' : 'bg-[#101820]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-100">{filtered.length}</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Queued</p>
          <p className="text-2xl font-bold text-sky-600">{pendingCount}</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Published</p>
          <p className="text-2xl font-bold text-emerald-400">{publishedCount}</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Failed</p>
          <p className="text-2xl font-bold text-rose-600">{failedCount}</p>
        </div>
      </div>

      {/* Bulk actions */}
      {activePlatform && pendingCount > 0 && (
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-amber-500" />
            <div>
              <p className="text-sm font-medium text-slate-200">
                {pendingCount} {getPlatform(activePlatform)?.label} items ready to publish
              </p>
              <p className="text-xs text-slate-400">
                Publish all queued items to {getPlatform(activePlatform)?.label} at once
              </p>
            </div>
          </div>
          <button
            onClick={handlePublishAll}
            disabled={publishing.size > 0}
            className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
          >
            {publishing.size > 0 ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Publish All ({pendingCount})
          </button>
        </div>
      )}

      {/* Content list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#101820] flex items-center justify-center">
            <Send size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">No scheduled content</p>
          <p className="text-sm text-slate-400">
            Content moves here after approval. Generate and approve content first.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const platform = getPlatform(item.platform);
            const format = getFormat(item.format);
            const job = item.publishJob;
            const status = job?.status || 'pending';
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isPublishing = publishing.has(item.id);
            const result = results[item.id];

            return (
              <div
                key={item.id}
                className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {/* Platform badge */}
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: `${platform?.color}18`, color: platform?.color }}
                  >
                    {platform?.label[0]}
                  </span>

                  {/* Content info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">
                      {platform?.label} · {format?.label}
                      {job?.externalId && ` · Pin ${job.externalId.substring(0, 8)}...`}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    <StatusIcon size={12} className={status === 'publishing' ? 'animate-spin' : ''} />
                    {cfg.label}
                  </span>

                  {/* Publish button */}
                  {status !== 'published' && (
                    <button
                      onClick={() => handlePublish(item)}
                      disabled={isPublishing}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                        status === 'failed'
                          ? 'bg-amber-400/[0.05] text-amber-200/75 border border-amber-400/15 hover:bg-amber-100'
                          : 'bg-emerald-400/[0.045] text-emerald-700 border border-emerald-400/20 hover:bg-emerald-100'
                      } disabled:opacity-50`}
                    >
                      {isPublishing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : status === 'failed' ? (
                        <RefreshCw size={14} />
                      ) : (
                        <Send size={14} />
                      )}
                      {status === 'failed' ? 'Retry' : 'Publish'}
                    </button>
                  )}

                  {/* External link */}
                  {job?.externalUrl && (
                    <a
                      href={job.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-[#101820] text-slate-400 hover:text-sky-600 transition-all shrink-0"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                {status !== 'published' && (
                  <div className="mt-3 rounded-lg border border-[#1b2935] bg-[#070b10]/60 p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.output.mediaUrl ? (
                        <img
                          src={item.output.mediaUrl}
                          alt={item.output.altText || item.title}
                          className="w-16 h-16 rounded-lg object-cover border border-[#1b2935]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-[#2a3946] flex items-center justify-center text-slate-600">
                          <ImageIcon size={22} />
                        </div>
                      )}

                      <div className="flex-1 min-w-[180px]">
                        <p className="text-xs font-semibold text-slate-300">Publish media</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Upload once and reuse the direct HTTPS asset URL across supported channels.
                        </p>
                        {item.output.mediaUrl && (
                          <p className="text-[10px] text-cyan-300/70 mt-1 truncate">
                            {item.output.mediaUrl}
                          </p>
                        )}
                      </div>

                      <label className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#101820] text-cyan-200 border border-cyan-400/15 hover:bg-[#13202a] cursor-pointer inline-flex items-center gap-2">
                        <Upload size={13} />
                        {uploadingMedia.has(item.id) ? 'Uploading…' : item.output.mediaUrl ? 'Replace' : 'Upload image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingMedia.has(item.id)}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            void handleMediaUpload(item, file);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>

                      {item.output.mediaUrl && (
                        <button
                          onClick={() => void handleRemoveMedia(item)}
                          disabled={uploadingMedia.has(item.id)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-400/[0.04] text-rose-300 border border-rose-400/15 hover:bg-rose-400/[0.08] disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      )}
                    </div>

                    {item.platform === 'pinterest' && (
                      <div className="mt-3 pt-3 border-t border-[#1b2935] grid gap-2 md:grid-cols-[1fr_auto]">
                        <input
                          type="url"
                          value={mediaDrafts[item.id] ?? item.output.mediaUrl ?? ''}
                          onChange={(e) => setMediaDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Or paste a direct public HTTPS image URL"
                          className="w-full px-3 py-2 rounded-lg border border-[#1b2935] bg-[#070b10] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        />
                        <button
                          onClick={() => void saveMediaUrl(item)}
                          disabled={savingMedia.has(item.id)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#101820] text-cyan-200 border border-cyan-400/15 hover:bg-[#13202a] disabled:opacity-50"
                        >
                          {savingMedia.has(item.id) ? 'Saving…' : 'Save fallback URL'}
                        </button>
                        <p className="md:col-span-2 text-[11px] text-slate-500">
                          Pinterest requires a public HTTPS image. Uploaded Studio media is used automatically; manual URL remains a fallback.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error message */}
                {job?.errorMessage && status === 'failed' && (
                  <div className="mt-2 ml-13 pl-3 border-l-2 border-rose-200 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-600">{job.errorMessage}</p>
                  </div>
                )}

                {/* Publish result toast */}
                {result && !result.ok && (
                  <div className="mt-2 ml-13 pl-3 border-l-2 border-rose-200">
                    <p className="text-xs text-rose-600">{result.error}</p>
                  </div>
                )}
                {result?.ok && (result.externalUrl || result.pinLink) && (
                  <div className="mt-2 ml-13 pl-3 border-l-2 border-emerald-400/20 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <a
                      href={result.externalUrl || result.pinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      View live {item.platform === 'pinterest' ? 'pin' : 'post'}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
