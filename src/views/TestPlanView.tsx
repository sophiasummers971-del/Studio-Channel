import { useState } from 'react';
import { TEST_SCENARIOS, CATEGORY_LABELS, CATEGORY_COLORS, WEIGHT_LABELS, WEIGHT_COLORS } from '@/data/testPlan';
import { getWorkflowStage } from '@/data/workflow';
import type { UseTestPlanReturn } from '@/hooks/useTestPlan';
import type { TestStatus } from '@/types';
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Circle,
  ChevronDown,
  ChevronRight,
  Play,
  Flag,
  Bug,
  ClipboardCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATUS_CONFIG: Record<TestStatus, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  'not-run': { icon: Circle, color: '#94A3B8', bg: '#F1F5F9', label: 'Not Run' },
  running: { icon: Loader2, color: '#F59E0B', bg: '#FFFBEB', label: 'Running' },
  passed: { icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5', label: 'Passed' },
  failed: { icon: XCircle, color: '#EF4444', bg: '#FEF2F2', label: 'Failed' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB', label: 'Warning' },
};

interface TestPlanViewProps {
  testPlan: UseTestPlanReturn;
  onNavigateToGate: () => void;
}

export function TestPlanView({ testPlan, onNavigateToGate }: TestPlanViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    results,
    running,
    runAllTests,
    runSingleTest,
    resetTests,
    passCount,
    failCount,
    warningCount,
    notRunCount,
    issues,
  } = testPlan;

  const getResult = (scenarioId: string) => results.find((r) => r.scenarioId === scenarioId);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Test Plan</h2>
        <p className="text-sm text-slate-500">
          Live diagnostics against persisted Studio evidence. A green result requires real backend data; missing evidence stays unverified or failed.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs text-slate-500">Passed</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{passCount}</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs text-slate-500">Unverified</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{warningCount}</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-rose-500" />
            <span className="text-xs text-slate-500">Failed</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{failCount}</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Circle size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">Not Run</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{notRunCount}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={runAllTests}
          disabled={running}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${
            running
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-sky-500 text-white hover:bg-sky-600 hover:shadow-md'
          }`}
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {running ? 'Running Diagnostics...' : 'Run Live Diagnostics'}
        </button>
        <button
          onClick={resetTests}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 bg-[#0b1118] border border-[#1b2935] rounded-lg hover:bg-[#070b10] transition-colors disabled:opacity-50"
        >
          <RotateCcw size={15} />
          Reset
        </button>
        <div className="ml-auto">
          <button
            onClick={onNavigateToGate}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-[#0b1118] border border-[#1b2935] rounded-lg hover:bg-[#070b10] transition-colors"
          >
            <Flag size={15} className="text-slate-500" />
            Go to Deployment Gate
          </button>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="space-y-3">
        {TEST_SCENARIOS.map((scenario) => {
          const result = getResult(scenario.id);
          const status = result?.status || 'not-run';
          const statusCfg = STATUS_CONFIG[status];
          const StatusIcon = statusCfg.icon;
          const isExpanded = expandedId === scenario.id;
          const scenarioIssues = issues.filter((i) => i.scenarioId === scenario.id);

          return (
            <div
              key={scenario.id}
              className={`bg-[#0b1118] border rounded-xl overflow-hidden transition-all ${
                status === 'running'
                  ? 'border-amber-300 shadow-md'
                  : status === 'failed'
                  ? 'border-rose-200'
                  : status === 'passed'
                  ? 'border-[#1b2935]'
                  : status === 'warning'
                  ? 'border-amber-400/15'
                  : 'border-[#1b2935]'
              }`}
            >
              {/* Header Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#070b10]/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: statusCfg.bg }}
                >
                  <StatusIcon size={18} style={{ color: statusCfg.color }} className={status === 'running' ? 'animate-spin' : ''} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-200">{scenario.name}</h3>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${CATEGORY_COLORS[scenario.category]}15`, color: CATEGORY_COLORS[scenario.category] }}
                    >
                      {CATEGORY_LABELS[scenario.category]}
                    </span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${WEIGHT_COLORS[scenario.weight]}15`, color: WEIGHT_COLORS[scenario.weight] }}
                    >
                      {WEIGHT_LABELS[scenario.weight]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{scenario.description}</p>
                </div>

                {result && status !== 'not-run' && status !== 'running' && (
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">
                      {result.checksPassed}/{result.checksTotal} checks
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{result.duration}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {status === 'not-run' && !running && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        runSingleTest(scenario.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-600 bg-cyan-400/[0.04] rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
                    >
                      <Play size={12} />
                      Run
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-[#14202a]">
                  <div className="grid grid-cols-2 gap-6 mt-4">
                    {/* Steps */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                        <ClipboardCheck size={12} />
                        Test Steps
                      </p>
                      <div className="space-y-1.5">
                        {scenario.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-[#101820] flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-xs text-slate-400 leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pass/Fail Criteria */}
                    <div>
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 size={12} />
                          Pass Criteria
                        </p>
                        <div className="space-y-1">
                          {scenario.passCriteria.map((c, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-slate-400 leading-relaxed">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-500 mb-2 flex items-center gap-1.5">
                          <XCircle size={12} />
                          Fail Criteria
                        </p>
                        <div className="space-y-1">
                          {scenario.failCriteria.map((c, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <XCircle size={12} className="text-rose-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-slate-400 leading-relaxed">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Stages */}
                  <div className="mt-4 pt-3 border-t border-[#14202a]">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Related Workflow Stages</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {scenario.relatedStages.map((stageId) => {
                        const stage = getWorkflowStage(stageId);
                        return stage ? (
                          <span
                            key={stageId}
                            className="text-[10px] font-medium px-2 py-1 rounded-md bg-[#101820] text-slate-400"
                          >
                            {stage.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Diagnostic Result */}
                  {result && status !== 'not-run' && (
                    <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: statusCfg.bg }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusIcon size={14} style={{ color: statusCfg.color }} className={status === 'running' ? 'animate-spin' : ''} />
                        <span className="text-xs font-semibold" style={{ color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                        {result.timestamp && (
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      {result.notes && (
                        <p className="text-xs text-slate-400 leading-relaxed">{result.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Issues Found */}
                  {scenarioIssues.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                        <Bug size={12} />
                        Issues Found ({scenarioIssues.length})
                      </p>
                      <div className="space-y-1.5">
                        {scenarioIssues.map((issue) => (
                          <div key={issue.id} className="flex items-start gap-2 p-2.5 bg-[#070b10] rounded-lg">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                              style={{
                                backgroundColor:
                                  issue.severity === 'blocker' ? '#FEE2E2' :
                                  issue.severity === 'major' ? '#FFFBEB' : '#F1F5F9',
                                color:
                                  issue.severity === 'blocker' ? '#EF4444' :
                                  issue.severity === 'major' ? '#F59E0B' : '#64748B',
                              }}
                            >
                              {issue.severity}
                            </span>
                            <div className="flex-1">
                              <p className="text-xs text-slate-400 leading-relaxed">{issue.description}</p>
                              {issue.mustFixBeforeDeploy && (
                                <p className="text-[10px] text-rose-500 font-medium mt-1">Must fix before deploy</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}