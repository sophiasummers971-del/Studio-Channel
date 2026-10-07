import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApprovalBatch, ApprovalItem, ApprovalDecision, PlatformId, ContentFormatId } from '@/types';

interface DbBatch {
  id: string;
  week_label: string;
  review_date: string | null;
  status: string;
  created_at: string;
}

interface DbItem {
  id: string;
  batch_id: string;
  content_id: string;
  title: string;
  platform: string;
  format: string;
  decision: string;
  reviewer: string;
  notes: string;
  created_at: string;
}

function mapBatch(row: DbBatch, items: DbItem[]): ApprovalBatch {
  return {
    id: row.id,
    weekLabel: row.week_label,
    reviewDate: row.review_date || '',
    status: row.status as 'open' | 'closed',
    items: items.map((i) => ({
      contentId: i.content_id,
      title: i.title,
      platform: i.platform as PlatformId,
      format: i.format as ContentFormatId,
      decision: i.decision as ApprovalDecision,
      reviewer: i.reviewer,
      notes: i.notes,
    })),
  };
}

export function useApprovalPersistence() {
  const [batches, setBatches] = useState<ApprovalBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const loadBatches = useCallback(async () => {
    const { data: batchRows, error: batchErr } = await supabase
      .from('approval_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (batchErr) {
      setDbReady(false);
      throw new Error(batchErr.message);
    }

    const { data: itemRows, error: itemErr } = await supabase
      .from('approval_items')
      .select('*');

    if (itemErr) {
      setDbReady(false);
      throw new Error(itemErr.message);
    }

    const itemsByBatch = new Map<string, DbItem[]>();
    for (const row of itemRows || []) {
      if (!itemsByBatch.has(row.batch_id)) itemsByBatch.set(row.batch_id, []);
      itemsByBatch.get(row.batch_id)!.push(row);
    }

    const mapped = (batchRows || []).map((b) => mapBatch(b, itemsByBatch.get(b.id) || []));
    setBatches(mapped);
    setDbReady(true);
    return mapped;
  }, []);

  // Load from Supabase on mount.
  useEffect(() => {
    void loadBatches()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [loadBatches]);

  // Persist a decision change
  const persistDecision = useCallback(
    async (batchId: string, contentId: string, decision: ApprovalDecision, reviewer: string, notes: string) => {
      if (!dbReady) throw new Error('Approval database is not ready.');

      // Find the approval_items row for this batch + content
      {
        const { data: existing, error: findError } = await supabase
          .from('approval_items')
          .select('id')
          .eq('batch_id', batchId)
          .eq('content_id', contentId)
          .maybeSingle();

        if (findError) throw new Error(findError.message);

        if (existing) {
          const { error: updateError } = await supabase
            .from('approval_items')
            .update({ decision, reviewer, notes })
            .eq('id', existing.id);
          if (updateError) throw new Error(updateError.message);
        } else {
          // Find the item from the local state to get title/platform/format
          const batch = batches.find((b) => b.id === batchId);
          const item = batch?.items.find((i) => i.contentId === contentId);
          if (item) {
            const { error: insertError } = await supabase.from('approval_items').insert({
              batch_id: batchId,
              content_id: contentId,
              title: item.title,
              platform: item.platform,
              format: item.format,
              decision,
              reviewer,
              notes,
            });
            if (insertError) throw new Error(insertError.message);
          } else {
            throw new Error('Approval item is missing from the active batch.');
          }
        }
        await loadBatches();
      }
    },
    [dbReady, batches, loadBatches]
  );

  // Close a batch and promote approved content
  const closeBatchPersistence = useCallback(
    async (batchId: string) => {
      if (!dbReady) throw new Error('Approval database is not ready.');

      {
        // Mark batch as closed
        const { error: closeError } = await supabase
          .from('approval_batches')
          .update({ status: 'closed' })
          .eq('id', batchId);
        if (closeError) throw new Error(closeError.message);

        // Find approved items and promote to content_items
        const batch = batches.find((b) => b.id === batchId);
        if (!batch) return;

        const approved = batch.items.filter((i) => i.decision === 'approved');
        for (const item of approved) {
          // Upsert into content_items with stage='scheduled'
          const { error: promoteError } = await supabase.from('content_items').upsert(
            {
              id: item.contentId,
              platform: item.platform,
              format: item.format,
              title: item.title,
              stage: 'scheduled',
              status: 'active',
              decision: 'approved',
              reviewer: item.reviewer,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
          if (promoteError) throw new Error(promoteError.message);
        }
        await loadBatches();
      }
    },
    [dbReady, batches, loadBatches]
  );

  // Create a new batch (e.g., from generated content)
  const createBatch = useCallback(
    async (weekLabel: string, items: ApprovalItem[]) => {
      try {
        const { data: batch, error } = await supabase
          .from('approval_batches')
          .insert({ week_label: weekLabel, status: 'open' })
          .select('*')
          .single();

        if (error || !batch) throw error;

        // Insert approval items
        const rows = items.map((item) => ({
          batch_id: batch.id,
          content_id: item.contentId,
          title: item.title,
          platform: item.platform,
          format: item.format,
          decision: 'pending',
          reviewer: '',
          notes: '',
        }));

        const { error: itemErr } = await supabase.from('approval_items').insert(rows);
        if (itemErr) throw itemErr;

        const newBatch: ApprovalBatch = {
          id: batch.id,
          weekLabel: batch.week_label,
          reviewDate: batch.review_date || '',
          status: 'open',
          items,
        };

        setBatches((prev) => [newBatch, ...prev]);
        return newBatch;
      } catch {
        return null;
      }
    },
    []
  );

  return { batches, setBatches, loading, dbReady, persistDecision, closeBatchPersistence, createBatch, refreshBatches: loadBatches };
}
