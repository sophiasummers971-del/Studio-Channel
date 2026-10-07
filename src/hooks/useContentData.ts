import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContentItem, ContentStatus, PlatformId, ContentStage, ContentInput, ContentOutput } from '@/types';

interface DbRow {
  id: string;
  platform: string;
  format: string;
  title: string;
  stage: string;
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DbRow): ContentItem {
  return {
    id: row.id,
    platform: row.platform as PlatformId,
    format: row.format as ContentItem['format'],
    title: row.title,
    stage: row.stage as ContentItem['stage'],
    status: row.status as ContentItem['status'],
    assignee: '',
    input: (row.input as Partial<ContentInput>) || {},
    output: (row.output as Partial<ContentOutput>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useContentData() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [dbLive, setDbLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setContent((data || []).map(mapRow));
        setDbLive(true);
      } catch {
        // DB unreachable — keep the last known in-memory state.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addContent = useCallback(async (item: {
    platform: PlatformId;
    format: string;
    title: string;
    stage?: ContentStage;
    assignee?: string;
    input?: Partial<ContentInput>;
    output?: Partial<ContentOutput>;
  }): Promise<ContentItem> => {
    const row = {
      platform: item.platform,
      format: item.format,
      title: item.title,
      stage: item.stage || 'ideation',
      status: 'active' as ContentStatus,
      input: item.input || { topic: item.title },
      output: item.output || {},
    };
    const { data, error } = await supabase
      .from('content_items')
      .insert(row)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Content save returned no row.');

    const mapped = mapRow(data as DbRow);
    setContent((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  return { content, dbLive, loading, addContent };
}
