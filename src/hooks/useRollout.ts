import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChannelRolloutStep, PlatformId, RolloutPhaseId, ChannelRolloutStatus } from '@/types';

interface DbStep {
  id: string;
  platform_id: string;
  phase: string;
  step_order: number;
  label: string;
  status: string;
  notes: string;
}

export function useRollout() {
  const [steps, setSteps] = useState<ChannelRolloutStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stepRes, criteriaRes, checkpointRes] = await Promise.all([
        supabase.from('rollout_steps').select('*').order('step_order', { ascending: true }),
        supabase.from('rollout_entry_criteria').select('*'),
        supabase.from('rollout_checkpoints').select('*'),
      ]);

      for (const response of [stepRes, criteriaRes, checkpointRes]) {
        if (response.error) throw new Error(response.error.message);
      }

      const mapped: ChannelRolloutStep[] = ((stepRes.data || []) as DbStep[]).map((step) => ({
        id: step.id,
        platformId: step.platform_id as PlatformId,
        phase: step.phase as RolloutPhaseId,
        order: step.step_order,
        label: step.label,
        status: step.status as ChannelRolloutStatus,
        notes: step.notes,
        dependencies: [],
        entryCriteria: (criteriaRes.data || [])
          .filter((item: any) => item.step_id === step.id)
          .map((item: any) => ({
            id: item.criterion_id,
            label: item.label,
            description: item.description,
            met: item.met,
          })),
        checkpoints: (checkpointRes.data || [])
          .filter((item: any) => item.step_id === step.id)
          .map((item: any) => ({
            id: item.checkpoint_id,
            label: item.label,
            description: item.description,
            passed: item.passed,
          })),
      }));

      setSteps(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load rollout evidence.');
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { steps, loading, error, refresh };
}

export type UseRolloutReturn = ReturnType<typeof useRollout>;
