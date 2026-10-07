import { useState, useCallback, useMemo, useEffect } from 'react';
import type { WorkflowStageId, RunStatus, ApprovalDecision } from '@/types';
import { useApprovalPersistence } from './useApprovalPersistence';

interface RunState {
  stageId: WorkflowStageId;
  status: RunStatus;
}

const INITIAL_RUN_STATES: RunState[] = [
  { stageId: 'trigger', status: 'complete' },
  { stageId: 'topic-selection', status: 'complete' },
  { stageId: 'brief-creation', status: 'complete' },
  { stageId: 'draft-generation', status: 'running' },
  { stageId: 'asset-production', status: 'pending' },
  { stageId: 'caption-variants', status: 'pending' },
];

export function useWorkflow() {
  const [runStates, setRunStates] = useState<RunState[]>(INITIAL_RUN_STATES);
  const [fallbackActive, setFallbackActive] = useState(false);

  const {
    batches: dbBatches,
    setBatches: setDbBatches,
    loading: approvalLoading,
    dbReady,
    persistDecision,
    closeBatchPersistence,
    refreshBatches,
  } = useApprovalPersistence();

  const [approvalBatches, setApprovalBatches] = useState(dbBatches);

  useEffect(() => {
    if (!approvalLoading) {
      setApprovalBatches(dbBatches);
    }
  }, [approvalLoading, dbBatches]);

  const advanceStage = useCallback((stageId: WorkflowStageId) => {
    setRunStates((prev) => {
      const idx = prev.findIndex((r) => r.stageId === stageId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], status: 'complete' };
      if (idx + 1 < next.length) {
        next[idx + 1] = { ...next[idx + 1], status: 'running' };
      }
      return next;
    });
  }, []);

  const resetRun = useCallback(() => {
    setRunStates(INITIAL_RUN_STATES);
  }, []);

  const toggleFallback = useCallback(() => {
    setFallbackActive((prev) => !prev);
  }, []);

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

  const todayRuns = useMemo(() => [], []);

  const currentStage = useMemo(
    () => runStates.find((r) => r.status === 'running'),
    [runStates]
  );

  const completedCount = useMemo(
    () => runStates.filter((r) => r.status === 'complete').length,
    [runStates]
  );

  const pendingApprovals = useMemo(
    () => {
      const openBatch = approvalBatches.find((b) => b.status === 'open');
      return openBatch ? openBatch.items.filter((i) => i.decision === 'pending').length : 0;
    },
    [approvalBatches]
  );

  return {
    runStates,
    todayRuns,
    currentStage,
    completedCount,
    advanceStage,
    resetRun,
    fallbackActive,
    toggleFallback,
    approvalBatches,
    setApprovalDecision,
    closeBatch,
    pendingApprovals,
    dbReady,
    refreshApprovals: refreshBatches,
  };
}

export type UseWorkflowReturn = ReturnType<typeof useWorkflow>;
