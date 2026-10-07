import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkflowStageId, RunStatus, ApprovalDecision, WorkflowRun } from '@/types';
import { useApprovalPersistence } from './useApprovalPersistence';

interface RunState {
  stageId: WorkflowStageId;
  status: RunStatus;
}

interface DbWorkflowRun {
  id: string;
  date: string;
  stage: string;
  status: string;
  items_processed: number;
  items_generated: number;
  duration: string;
}

const DAILY_STAGE_IDS: WorkflowStageId[] = [
  'trigger',
  'topic-selection',
  'brief-creation',
  'draft-generation',
  'asset-production',
  'caption-variants',
];

export function useWorkflow() {
  const [runStates, setRunStates] = useState<RunState[]>([]);
  const [todayRuns, setTodayRuns] = useState<WorkflowRun[]>([]);
  const [latestRunDate, setLatestRunDate] = useState<string | null>(null);
  const [workflowEvidenceLoading, setWorkflowEvidenceLoading] = useState(true);
  const [workflowEvidenceError, setWorkflowEvidenceError] = useState<string | null>(null);

  const {
    batches: dbBatches,
    loading: approvalLoading,
    dbReady,
    persistDecision,
    closeBatchPersistence,
    refreshBatches,
  } = useApprovalPersistence();

  const [approvalBatches, setApprovalBatches] = useState(dbBatches);

  useEffect(() => {
    if (!approvalLoading) setApprovalBatches(dbBatches);
  }, [approvalLoading, dbBatches]);

  const refreshWorkflowRuns = useCallback(async () => {
    setWorkflowEvidenceLoading(true);
    setWorkflowEvidenceError(null);
    try {
      const { data, error } = await supabase
        .from('workflow_runs')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);

      const rows = (data || []) as DbWorkflowRun[];
      const newestDate = rows[0]?.date || null;
      setLatestRunDate(newestDate);

      if (!newestDate) {
        setRunStates([]);
        setTodayRuns([]);
        return;
      }

      const latestRows = rows.filter((row) => row.date === newestDate);
      const latestPerStage = new Map<WorkflowStageId, DbWorkflowRun>();
      for (const row of latestRows) {
        const stage = row.stage as WorkflowStageId;
        if (DAILY_STAGE_IDS.includes(stage) && !latestPerStage.has(stage)) {
          latestPerStage.set(stage, row);
        }
      }

      setRunStates(
        DAILY_STAGE_IDS.map((stageId) => ({
          stageId,
          status: (latestPerStage.get(stageId)?.status || 'pending') as RunStatus,
        }))
      );

      setTodayRuns(
        latestRows.map((row) => ({
          id: row.id,
          date: row.date,
          stage: row.stage as WorkflowStageId,
          status: row.status as RunStatus,
          itemsProcessed: row.items_processed,
          itemsGenerated: row.items_generated,
          duration: row.duration,
        }))
      );
    } catch (error) {
      setWorkflowEvidenceError(error instanceof Error ? error.message : 'Could not load workflow evidence.');
      setRunStates([]);
      setTodayRuns([]);
      setLatestRunDate(null);
    } finally {
      setWorkflowEvidenceLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkflowRuns();
  }, [refreshWorkflowRuns]);

  const setApprovalDecision = useCallback(
    async (batchId: string, contentId: string, decision: ApprovalDecision, reviewer: string, notes: string) => {
      await persistDecision(batchId, contentId, decision, reviewer, notes);
      await refreshBatches();
    },
    [persistDecision, refreshBatches]
  );

  const closeBatch = useCallback(
    async (batchId: string) => {
      await closeBatchPersistence(batchId);
      await refreshBatches();
    },
    [closeBatchPersistence, refreshBatches]
  );

  const currentStage = useMemo(
    () => runStates.find((r) => r.status === 'running'),
    [runStates]
  );

  const completedCount = useMemo(
    () => runStates.filter((r) => r.status === 'complete').length,
    [runStates]
  );

  const pendingApprovals = useMemo(() => {
    const openBatch = approvalBatches.find((b) => b.status === 'open');
    return openBatch ? openBatch.items.filter((i) => i.decision === 'pending').length : 0;
  }, [approvalBatches]);

  return {
    runStates,
    todayRuns,
    latestRunDate,
    currentStage,
    completedCount,
    workflowEvidenceLoading,
    workflowEvidenceError,
    refreshWorkflowRuns,
    approvalBatches,
    setApprovalDecision,
    closeBatch,
    pendingApprovals,
    dbReady,
    refreshApprovals: refreshBatches,
  };
}

export type UseWorkflowReturn = ReturnType<typeof useWorkflow>;
