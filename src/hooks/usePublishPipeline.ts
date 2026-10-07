import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContentItem, PublishJob, ScheduledContent, PlatformId } from '@/types';

interface DbContentRow {
  id: string;
  platform: string;
  format: string;
  title: string;
  stage: string;
  status: string;
  assignee: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface DbPublishRow {
  id: string;
  content_id: string;
  platform: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  external_id: string | null;
  external_url: string | null;
  error_message: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapContent(row: DbContentRow): ContentItem {
  return {
    id: row.id,
    platform: row.platform as PlatformId,
    format: row.format as ContentItem['format'],
    title: row.title,
    stage: row.stage as ContentItem['stage'],
    status: row.status as ContentItem['status'],
    assignee: row.assignee || '',
    input: (row.input as ContentItem['input']) || {},
    output: (row.output as ContentItem['output']) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublishJob(row: DbPublishRow): PublishJob {
  return {
    id: row.id,
    contentId: row.content_id,
    platform: row.platform as PlatformId,
    status: row.status as PublishJob['status'],
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    externalId: row.external_id,
    externalUrl: row.external_url,
    errorMessage: row.error_message,
    attemptCount: row.attempt_count,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePublishPipeline() {
  const [scheduled, setScheduled] = useState<ScheduledContent[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<Set<string>>(new Set());

  // Load scheduled content + their publish jobs
  const loadData = useCallback(async () => {
    try {
      const { data: contentRows, error: cErr } = await supabase
        .from('content_items')
        .select('*')
        .in('stage', ['scheduled', 'published'])
        .order('updated_at', { ascending: false });

      if (cErr) throw cErr;

      const contentItems = (contentRows || []).map(mapContent);

      const { data: jobRows } = await supabase
        .from('publish_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      const jobs = (jobRows || []).map(mapPublishJob);
      setPublishJobs(jobs);

      // Merge publish jobs onto content items
      const merged: ScheduledContent[] = contentItems.map((item) => ({
        ...item,
        publishJob: jobs.find((j) => j.contentId === item.id),
      }));

      setScheduled(merged);
    } catch {
      // offline — keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create a publish job for a scheduled content item
  const createPublishJob = useCallback(
    async (contentId: string, platform: PlatformId) => {
      try {
        const { data, error } = await supabase
          .from('publish_jobs')
          .insert({
            content_id: contentId,
            platform,
            status: 'pending',
          })
          .select('*')
          .single();

        if (error) throw error;
        const job = mapPublishJob(data as DbPublishRow);
        setPublishJobs((prev) => [job, ...prev]);
        setScheduled((prev) =>
          prev.map((item) => (item.id === contentId ? { ...item, publishJob: job } : item))
        );
        return job;
      } catch {
        return null;
      }
    },
    []
  );

  const setPinterestMediaUrl = useCallback(async (item: ScheduledContent, mediaUrl: string) => {
    const trimmed = mediaUrl.trim();
    const nextOutput = { ...(item.output || {}), mediaUrl: trimmed };

    const { error } = await supabase
      .from('content_items')
      .update({ output: nextOutput, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (error) throw error;
    await loadData();
  }, [loadData]);

  // Publish a single item via the Edge Function
  const publishItem = useCallback(
    async (item: ScheduledContent) => {
      const output = item.output || {};
      const mediaUrl = typeof output.mediaUrl === 'string' ? output.mediaUrl.trim() : '';

      if (item.platform === 'pinterest') {
        if (!mediaUrl) {
          return { ok: false, error: 'Pinterest requires a public HTTPS image URL before publishing.' };
        }

        try {
          const parsed = new URL(mediaUrl);
          if (parsed.protocol !== 'https:') {
            return { ok: false, error: 'Pinterest media URL must use HTTPS.' };
          }
        } catch {
          return { ok: false, error: 'Pinterest media URL is not a valid URL.' };
        }
      }

      if (!item.publishJob && item.platform === 'pinterest') {
        // Create job first
        const job = await createPublishJob(item.id, item.platform);
        if (!job) return { ok: false, error: 'Failed to create publish job' };
        item = { ...item, publishJob: job };
      }

      const job = item.publishJob;
      if (!job) return { ok: false, error: 'No publish job found' };

      setPublishing((prev) => new Set(prev).add(item.id));

      try {
        const { data, error } = await supabase.functions.invoke('publish-pin', {
          body: {
            jobId: job.id,
            contentId: item.id,
            platform: item.platform,
            pinTitle: output.pinTitle || item.title,
            pinDescription: output.pinDescription || output.caption || '',
            boardName: output.boardName || 'Channel Studio Pins',
            caption: output.caption || '',
            hashtags: output.hashtags || [],
            imageUrl: mediaUrl || undefined,
            link: undefined,
          },
        });

        if (error) {
          await loadData();
          return { ok: false, error: error.message };
        }

        if (data?.error) {
          // Refresh job status from DB
          await loadData();
          return { ok: false, error: data.error };
        }

        // Refresh job status from DB
        await loadData();
        return { ok: true, pinId: data.pinId, pinLink: data.pinLink };
      } catch (err) {
        await loadData();
        return { ok: false, error: String(err) };
      } finally {
        setPublishing((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [createPublishJob, loadData]
  );

  // Bulk publish all pending scheduled items for a platform
  const publishAll = useCallback(
    async (platform: PlatformId) => {
      const pending = scheduled.filter(
        (item) =>
          item.platform === platform &&
          item.stage === 'scheduled' &&
          (!item.publishJob || item.publishJob.status === 'pending' || item.publishJob.status === 'failed')
      );

      const results: { ok: boolean; id: string; error?: string }[] = [];
      for (const item of pending) {
        const result = await publishItem(item);
        results.push({ ok: result.ok, id: item.id, error: result.error });
      }
      return results;
    },
    [scheduled, publishItem]
  );

  return { scheduled, publishJobs, loading, publishing, publishItem, publishAll, setPinterestMediaUrl, refresh: loadData };
}
