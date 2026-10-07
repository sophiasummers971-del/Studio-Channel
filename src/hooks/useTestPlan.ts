import { useState, useCallback, useMemo, useEffect } from 'react';
import { TEST_SCENARIOS, DEPLOYMENT_CHECKLIST } from '@/data/testPlan';
import { supabase } from '@/lib/supabase';
import type { TestStatus, TestResult, TestIssue, DeploymentChecklistItem, ReadinessDecision } from '@/types';

const INITIAL_RESULTS: TestResult[] = TEST_SCENARIOS.map((s) => ({
  scenarioId: s.id,
  status: 'not-run' as TestStatus,
  duration: '—',
  notes: '',
  checksPassed: 0,
  checksTotal: s.passCriteria.length,
  timestamp: null,
}));

const DAILY_STAGE_IDS = [
  'trigger',
  'topic-selection',
  'brief-creation',
  'draft-generation',
  'asset-production',
  'caption-variants',
];

type DiagnosticSnapshot = {
  workflowRuns: any[];
  contentItems: any[];
  approvalBatches: any[];
  approvalItems: any[];
  publishJobs: any[];
};

function durationLabel(start: number) {
  return `${Math.max(1, Math.round(performance.now() - start))} ms`;
}

export function useTestPlan() {
  const [results, setResults] = useState<TestResult[]>(INITIAL_RESULTS);
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState<TestIssue[]>([]);
  const [checklist, setChecklist] = useState<DeploymentChecklistItem[]>(
    DEPLOYMENT_CHECKLIST.map((item) => ({ ...item, checked: false }))
  );
  const [decision, setDecision] = useState<ReadinessDecision>('pending');

  const loadRecordedEvidence = useCallback(async () => {
    const [{ data: testRows }, { data: issueRows }] = await Promise.all([
      supabase.from('test_results').select('*').order('timestamp', { ascending: false }).limit(100),
      supabase.from('test_issues').select('*').order('created_at', { ascending: false }),
    ]);

    if (testRows?.length) {
      const latest = new Map<string, any>();
      for (const row of testRows) {
        if (!latest.has(row.scenario_id)) latest.set(row.scenario_id, row);
      }
      setResults(
        TEST_SCENARIOS.map((scenario) => {
          const row = latest.get(scenario.id);
          return row
            ? {
                scenarioId: scenario.id,
                status: row.status as TestStatus,
                duration: row.duration || '—',
                notes: row.notes || '',
                checksPassed: row.checks_passed || 0,
                checksTotal: row.checks_total || scenario.passCriteria.length,
                timestamp: row.timestamp || null,
              }
            : INITIAL_RESULTS.find((r) => r.scenarioId === scenario.id)!;
        })
      );
    }

    setIssues(
      (issueRows || []).map((row: any) => ({
        id: row.id,
        scenarioId: row.scenario_id,
        severity: row.severity,
        description: row.description,
        affectedStage: row.affected_stage,
        status: row.status,
        mustFixBeforeDeploy: row.must_fix_before_deploy,
      }))
    );
  }, []);

  useEffect(() => {
    void loadRecordedEvidence();
  }, [loadRecordedEvidence]);

  const getSnapshot = useCallback(async (): Promise<DiagnosticSnapshot> => {
    const [workflowRuns, contentItems, approvalBatches, approvalItems, publishJobs] = await Promise.all([
      supabase.from('workflow_runs').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(200),
      supabase.from('content_items').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('approval_batches').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('approval_items').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('publish_jobs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    for (const response of [workflowRuns, contentItems, approvalBatches, approvalItems, publishJobs]) {
      if (response.error) throw new Error(response.error.message);
    }

    return {
      workflowRuns: workflowRuns.data || [],
      contentItems: contentItems.data || [],
      approvalBatches: approvalBatches.data || [],
      approvalItems: approvalItems.data || [],
      publishJobs: publishJobs.data || [],
    };
  }, []);

  const evaluateScenario = useCallback(async (scenarioId: string): Promise<TestResult> => {
    const started = performance.now();
    const snapshot = await getSnapshot();
    let status: TestStatus = 'warning';
    let notes = '';
    let checksPassed = 0;
    const scenario = TEST_SCENARIOS.find((item) => item.id === scenarioId)!;
    const checksTotal = scenario.passCriteria.length;

    if (scenarioId === 'test-trigger') {
      const trigger = snapshot.workflowRuns.find((row) => row.stage === 'trigger');
      if (trigger?.status === 'complete') {
        status = 'passed';
        checksPassed = checksTotal;
        notes = `Recorded trigger evidence exists for ${trigger.date}. This verifies a persisted trigger run, not the scheduler itself.`;
      } else {
        status = 'failed';
        notes = 'No completed trigger run is recorded. Automatic 7:00 AM scheduling is not proven.';
      }
    } else if (scenarioId === 'test-continuity') {
      const latestDate = snapshot.workflowRuns[0]?.date;
      const rows = latestDate ? snapshot.workflowRuns.filter((row) => row.date === latestDate) : [];
      const completed = new Set(rows.filter((row) => row.status === 'complete').map((row) => row.stage));
      checksPassed = DAILY_STAGE_IDS.filter((stage) => completed.has(stage)).length;
      if (DAILY_STAGE_IDS.every((stage) => completed.has(stage))) {
        status = 'passed';
        notes = `All six daily stages are recorded complete for ${latestDate}.`;
      } else {
        status = snapshot.workflowRuns.length ? 'failed' : 'warning';
        notes = snapshot.workflowRuns.length
          ? `Latest recorded run is incomplete: ${checksPassed}/6 daily stages complete.`
          : 'No workflow-run evidence exists yet. Continuity is unverified.';
      }
    } else if (scenarioId === 'test-output') {
      const usable = snapshot.contentItems.filter((row) => {
        const output = row.output || {};
        return Boolean(output.caption && Array.isArray(output.hashtags) && output.visualDirection);
      });
      checksPassed = usable.length ? Math.min(checksTotal, 3) : 0;
      status = usable.length ? 'passed' : 'warning';
      notes = usable.length
        ? `${usable.length} stored content item(s) contain real structured output fields.`
        : 'No stored content output exists yet, so output quality cannot be verified.';
    } else if (scenarioId === 'test-repeatability') {
      const byDate = new Map<string, Set<string>>();
      for (const row of snapshot.workflowRuns) {
        if (row.status !== 'complete') continue;
        if (!byDate.has(row.date)) byDate.set(row.date, new Set());
        byDate.get(row.date)!.add(row.stage);
      }
      const completeDates = [...byDate.values()].filter((stages) =>
        DAILY_STAGE_IDS.every((stage) => stages.has(stage))
      ).length;
      checksPassed = Math.min(checksTotal, completeDates);
      status = completeDates >= 3 ? 'passed' : 'warning';
      notes = completeDates >= 3
        ? `${completeDates} complete daily runs are recorded.`
        : `Only ${completeDates} complete daily run(s) are recorded. Three are required for repeatability evidence.`;
    } else if (scenarioId === 'test-approval') {
      const approved = snapshot.approvalItems.filter((row) => row.decision === 'approved');
      const scheduledIds = new Set(
        snapshot.contentItems.filter((row) => row.stage === 'scheduled' || row.stage === 'published').map((row) => row.id)
      );
      const promoted = approved.filter((row) => scheduledIds.has(row.content_id));
      checksPassed = promoted.length ? checksTotal : 0;
      status = promoted.length ? 'passed' : 'warning';
      notes = promoted.length
        ? `${promoted.length} approved item(s) have persisted into scheduled/published content.`
        : 'No approved-to-scheduled transition is recorded yet. Approval flow remains unverified.';
    } else if (scenarioId === 'test-fallback') {
      status = 'failed';
      notes = 'NOT IMPLEMENTED: the current fallback/recovery screen is a local simulator and is not an operational safety mechanism.';
    } else if (scenarioId === 'test-adaptation') {
      const adaptable = snapshot.contentItems.filter((row) => {
        const output = row.output || {};
        return Boolean(output.caption && output.visualDirection && output.postingTime);
      });
      checksPassed = adaptable.length ? checksTotal : 0;
      status = adaptable.length ? 'passed' : 'warning';
      notes = adaptable.length
        ? `${adaptable.length} stored output(s) contain reusable caption, visual-direction and posting-time fields.`
        : 'No stored outputs exist to verify adaptation.';
    }

    return {
      scenarioId,
      status,
      duration: durationLabel(started),
      notes,
      checksPassed,
      checksTotal,
      timestamp: new Date().toISOString(),
    };
  }, [getSnapshot]);

  const recordResult = useCallback(async (result: TestResult) => {
    const { error } = await supabase.from('test_results').insert({
      scenario_id: result.scenarioId,
      status: result.status,
      duration: result.duration,
      notes: result.notes,
      checks_passed: result.checksPassed,
      checks_total: result.checksTotal,
      timestamp: result.timestamp,
    });
    if (error) throw new Error(error.message);
  }, []);

  const runSingleTest = useCallback(async (scenarioId: string) => {
    setResults((prev) =>
      prev.map((r) => (r.scenarioId === scenarioId ? { ...r, status: 'running' as TestStatus } : r))
    );
    try {
      const result = await evaluateScenario(scenarioId);
      await recordResult(result);
      setResults((prev) => prev.map((r) => (r.scenarioId === scenarioId ? result : r)));
    } catch (error) {
      const scenario = TEST_SCENARIOS.find((item) => item.id === scenarioId)!;
      const failed: TestResult = {
        scenarioId,
        status: 'failed',
        duration: '—',
        notes: error instanceof Error ? error.message : 'Diagnostic query failed.',
        checksPassed: 0,
        checksTotal: scenario.passCriteria.length,
        timestamp: new Date().toISOString(),
      };
      setResults((prev) => prev.map((r) => (r.scenarioId === scenarioId ? failed : r)));
    }
  }, [evaluateScenario, recordResult]);

  const runAllTests = useCallback(async () => {
    setRunning(true);
    try {
      for (const scenario of TEST_SCENARIOS) {
        await runSingleTest(scenario.id);
      }
    } finally {
      setRunning(false);
    }
  }, [runSingleTest]);

  const resetTests = useCallback(() => {
    setResults(INITIAL_RESULTS);
    setRunning(false);
    setDecision('pending');
  }, []);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id !== itemId ? item : { ...item, checked: !item.checked }))
    );
  }, []);

  const updateIssueStatus = useCallback(async (issueId: string, status: TestIssue['status']) => {
    const { error } = await supabase.from('test_issues').update({ status }).eq('id', issueId);
    if (error) throw new Error(error.message);
    setIssues((prev) => prev.map((issue) => (issue.id === issueId ? { ...issue, status } : issue)));
  }, []);

  const passCount = useMemo(() => results.filter((r) => r.status === 'passed').length, [results]);
  const failCount = useMemo(() => results.filter((r) => r.status === 'failed').length, [results]);
  const warningCount = useMemo(() => results.filter((r) => r.status === 'warning').length, [results]);
  const notRunCount = useMemo(
    () => results.filter((r) => r.status === 'not-run' || r.status === 'running').length,
    [results]
  );

  const allTestsRun = useMemo(
    () => results.every((r) => r.status === 'passed' || r.status === 'failed' || r.status === 'warning'),
    [results]
  );

  const criticalTestsPassed = useMemo(() => {
    const criticalScenarios = TEST_SCENARIOS.filter((s) => s.weight === 'critical');
    return criticalScenarios.every((cs) => results.find((r) => r.scenarioId === cs.id)?.status === 'passed');
  }, [results]);

  const importantTestsPassed = useMemo(() => {
    const importantScenarios = TEST_SCENARIOS.filter((s) => s.weight === 'important');
    return importantScenarios.every((cs) => results.find((r) => r.scenarioId === cs.id)?.status === 'passed');
  }, [results]);

  const openBlockers = useMemo(
    () => issues.filter((i) => i.severity === 'blocker' && i.status !== 'resolved'),
    [issues]
  );

  const requiredChecklistComplete = useMemo(
    () => checklist.filter((item) => item.required).every((item) => item.checked),
    [checklist]
  );

  const canDeploy = useMemo(
    () => allTestsRun && criticalTestsPassed && importantTestsPassed && openBlockers.length === 0 && requiredChecklistComplete,
    [allTestsRun, criticalTestsPassed, importantTestsPassed, openBlockers, requiredChecklistComplete]
  );

  const makeDecision = useCallback((d: ReadinessDecision) => setDecision(d), []);

  return {
    results,
    running,
    issues,
    checklist,
    decision,
    runAllTests,
    runSingleTest,
    resetTests,
    toggleChecklistItem,
    updateIssueStatus,
    makeDecision,
    passCount,
    failCount,
    warningCount,
    notRunCount,
    allTestsRun,
    criticalTestsPassed,
    importantTestsPassed,
    openBlockers,
    requiredChecklistComplete,
    canDeploy,
  };
}

export type UseTestPlanReturn = ReturnType<typeof useTestPlan>;
