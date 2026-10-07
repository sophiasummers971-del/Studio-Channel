import { WORKFLOW_STAGES, WORKFLOW_STAGE_ORDER, DAILY_STAGES } from '@/data/workflow';
import type { WorkflowStageId, RunStatus } from '@/types';
import type { UseWorkflowReturn } from '@/hooks/useWorkflow';
import {
  Zap,
  Compass,
  ClipboardList,
  PenLine,
  Image,
  Type,
  CheckSquare,
  CalendarClock,
  Send,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  Circle,
  RefreshCw,
  Database,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STAGE_ICONS: Record<string, LucideIcon> = {
  Zap,
  Compass,
  ClipboardList,
  PenLine,
  Image,
  Type,
  CheckSquare,
  CalendarClock,
  Send,
};

const STATUS_CONFIG: Record<RunStatus, { icon: LucideIcon; color: string; label: string }> = {
  pending: { icon: Circle, color: '#94A3B8', label: 'No evidence' },
  running: { icon: Loader2, color: '#F59E0B', label: 'Running' },
  complete: { icon: CheckCircle2, color: '#10B981', label: 'Recorded complete' },
  failed: { icon: AlertTriangle, color: '#EF4444', label: 'Recorded failed' },
};

interface UniversalWorkflowViewProps {
  workflow: UseWorkflowReturn;
  onNavigateToApproval: () => void;
}

export function UniversalWorkflowView({ workflow, onNavigateToApproval }: UniversalWorkflowViewProps) {
  const {
    runStates,
    todayRuns,
    latestRunDate,
    completedCount,
    workflowEvidenceLoading,
    workflowEvidenceError,
    refreshWorkflowRuns,
  } = workflow;

  const dailyStages = DAILY_STAGES.map((id) => WORKFLOW_STAGES.find((s) => s.id === id)!);
  const weeklyStages = WORKFLOW_STAGE_ORDER
    .filter((id) => WORKFLOW_STAGES.find((s) => s.id === id)?.cadence === 'weekly')
    .map((id) => WORKFLOW_STAGES.find((s) => s.id === id)!);

  const getRunStatus = (stageId: WorkflowStageId): RunStatus =>
    runStates.find((r) => r.stageId === stageId)?.status ?? 'pending';

  const evidenceCount = runStates.length;
  const progress = evidenceCount ? (completedCount / dailyStages.length) * 100 : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Workflow Evidence</h2>
        <p className="text-sm text-slate-500">
          Persisted workflow-run evidence only. This panel does not simulate stage progress and does not claim a scheduler exists without recorded runs.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={17} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Automatic daily execution is not currently verified</p>
            <p className="text-xs text-amber-200/70 mt-1">
              The previous screen claimed a 7:00 AM automatic run using local mock state. Until a real scheduler writes workflow_runs, this remains unverified.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/[0.04] flex items-center justify-center">
              <Database size={20} className="text-cyan-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {latestRunDate ? `Latest recorded run · ${latestRunDate}` : 'No recorded workflow run'}
              </h3>
              <p className="text-xs text-slate-400">
                {completedCount} of {dailyStages.length} daily stages have persisted completion evidence
              </p>
            </div>
          </div>
          <button
            onClick={() => void refreshWorkflowRuns()}
            disabled={workflowEvidenceLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 bg-[#101820] rounded-lg hover:bg-[#13202a] disabled:opacity-50"
          >
            <RefreshCw size={14} className={workflowEvidenceLoading ? 'animate-spin' : ''} />
            Refresh evidence
          </button>
        </div>

        {workflowEvidenceError && (
          <div className="mb-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] px-3 py-2 text-xs text-rose-300">
            Workflow evidence error: {workflowEvidenceError}
          </div>
        )}

        <div className="w-full h-2 bg-[#101820] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Daily Sequence</h3>
          <span className="text-xs text-slate-500">planned cadence: 7:00 AM · scheduler unverified</span>
        </div>

        <div className="space-y-2">
          {dailyStages.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.icon] || Circle;
            const status = getRunStatus(stage.id);
            const statusCfg = STATUS_CONFIG[status];
            const StatusIcon = statusCfg.icon;
            return (
              <div key={stage.id} className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${statusCfg.color}15` }}
                    >
                      <Icon size={18} style={{ color: statusCfg.color }} />
                    </div>
                    {i < dailyStages.length - 1 && <div className="w-0.5 h-6 bg-slate-800 mt-1" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                        <h4 className="text-sm font-semibold text-slate-200">{stage.label}</h4>
                      </div>
                      <span
                        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}
                      >
                        <StatusIcon size={11} className={status === 'running' ? 'animate-spin' : ''} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{stage.description}</p>
                    {stage.extensionPoint && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <ArrowRight size={10} />
                        <span>Planned extension point: {stage.extensionPoint}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Weekly Workflow Definitions</h3>
          <span className="text-xs text-slate-500">definitions, not execution evidence</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {weeklyStages.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.icon] || Circle;
            return (
              <button
                key={stage.id}
                onClick={onNavigateToApproval}
                className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 text-left hover:border-slate-600 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-400/[0.045] flex items-center justify-center">
                    <Icon size={17} className="text-violet-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {String(dailyStages.length + i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">{stage.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{stage.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Latest Persisted Run Log</h3>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
          {todayRuns.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No workflow run records exist yet.</p>
              <p className="text-xs text-slate-600 mt-1">Nothing is substituted with demo rows.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#070b10] border-b border-[#1b2935]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Stage</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Status</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Processed</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Generated</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 py-2.5">Duration</th>
                </tr>
              </thead>
              <tbody>
                {todayRuns.map((run) => {
                  const stage = WORKFLOW_STAGES.find((s) => s.id === run.stage);
                  const cfg = STATUS_CONFIG[run.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={run.id} className="border-b border-[#14202a] last:border-0">
                      <td className="px-4 py-2.5 text-sm text-slate-300">{stage?.label || run.stage}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
                          <StatusIcon size={12} className={run.status === 'running' ? 'animate-spin' : ''} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-slate-400">{run.itemsProcessed}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-slate-400">{run.itemsGenerated}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-slate-400 font-mono">{run.duration || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
