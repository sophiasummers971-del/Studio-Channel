import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApprovalItem, PlatformId, ContentFormatId, ContentItem } from '@/types';

interface DbBatch {
  id: string;
  week_label: string;
  review_date: string | null;
  status: string;
  created_at: string;
}

interface DbApprovalItem {
  id: string;
  batch_id: string;
  content_id: string;
  title: string;
  platform: string;
  format: string;
  decision: string;
  reviewer: string;
  notes: string;
}

interface WeeklyBatchState {
  batchId: string | null;
  weekLabel: string;
  items: ApprovalItem[];
  loading: boolean;
}

function getCurrentWeekLabel(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `Week ${weekNum} (${fmt(weekStart)}–${fmt(weekEnd)})`;
}

export function useWeeklyBatch() {
  const [state, setState] = useState<WeeklyBatchState>({
    batchId: null,
    weekLabel: getCurrentWeekLabel(),
    items: [],
    loading: true,
  });

  // Load or create the current week's batch
  useEffect(() => {
    (async () => {
      try {
        const weekLabel = getCurrentWeekLabel();

        // Reuse only the open batch for the current week.
        const { data: existing, error: existingError } = await supabase
          .from('approval_batches')
          .select('*')
          .eq('status', 'open')
          .eq('week_label', weekLabel)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingError) throw existingError;

        let batchId: string;

        if (existing) {
          batchId = existing.id;
        } else {
          // Create a new batch for this week
          const { data: newBatch, error } = await supabase
            .from('approval_batches')
            .insert({ week_label: weekLabel, status: 'open' })
            .select('*')
            .single();
          if (error) throw error;
          batchId = newBatch.id;
        }

        // Load items for this batch
        const { data: itemRows } = await supabase
          .from('approval_items')
          .select('*')
          .eq('batch_id', batchId);

        const items: ApprovalItem[] = (itemRows || []).map((r: DbApprovalItem) => ({
          contentId: r.content_id,
          title: r.title,
          platform: r.platform as PlatformId,
          format: r.format as ContentFormatId,
          decision: r.decision as ApprovalItem['decision'],
          reviewer: r.reviewer,
          notes: r.notes,
        }));

        setState({ batchId, weekLabel, items, loading: false });
      } catch {
        setState((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  // Add a content item to the current week's batch
  const addToBatch = useCallback(
    async (item: ContentItem) => {
      const { batchId } = state;
      if (!batchId) throw new Error('Approval batch is not ready yet.');

      // Check if already in batch
      if (state.items.some((i) => i.contentId === item.id)) return;

      const approvalItem: ApprovalItem = {
        contentId: item.id,
        title: item.title,
        platform: item.platform,
        format: item.format,
        decision: 'pending',
        reviewer: '',
        notes: '',
      };

      const { error } = await supabase.from('approval_items').insert({
        batch_id: batchId,
        content_id: item.id,
        title: item.title,
        platform: item.platform,
        format: item.format,
        decision: 'pending',
        reviewer: '',
        notes: '',
      });

      if (error) throw new Error(error.message);

      setState((prev) => ({
        ...prev,
        items: [...prev.items, approvalItem],
      }));
    },
    [state]
  );

  // Bulk-add multiple items
  const addMultipleToBatch = useCallback(
    async (items: ContentItem[]) => {
      for (const item of items) {
        await addToBatch(item);
      }
    },
    [addToBatch]
  );

  return {
    batchId: state.batchId,
    weekLabel: state.weekLabel,
    items: state.items,
    loading: state.loading,
    addToBatch,
    addMultipleToBatch,
  };
}
