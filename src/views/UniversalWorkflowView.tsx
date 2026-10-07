import { WORKFLOW_STAGES, WORKFLOW_STAGE_ORDER, DAILY_STAGES, FALLBACK_ROUTE, MOCK_RUNS } from '@/data/workflow';
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
  RotateCcw,
  AlertTriangle,
  Shield,
  Clock,
  PlayCircle,
  CheckCircle2,
  Loader2,
  Circle,
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
  pending: { icon: Circle, color: '#94A3B8', label: 'Pending' },
  running: { icon: Loader2, color: '#F59E0B', label: 'Running' },
  complete: { icon: CheckCircle2, color: '#10B981', label: 'Complete' },
  failed: { icon: AlertTriangle, color: '#EF4444', label: 'Failed' },
};

interface UniversalWorkflowViewProps {
  workflow: UseWorkflowReturn;
  onNavigateToApproval: () => void;
}

export function UniversalWorkflowView({ workflow, onNavigateToApproval }: UniversalWorkflowViewProps) {
  const { runStates, advanceStage, resetRun, fallbackActive, toggleFallback, currentStage, completedCount } = workflow;

  const dailyStages = DAILY_STAGES.map((id) => WORKFLOW_STAGES.find((s) => s.id === id)!);
  const weeklyStages = WORKFLOW_STAGE_ORDER
    .filter((id) => WORKFLOW_STAGES.find((s) => s.id === id)?.cadence === 'weekly')
    .map((id) => WORKFLOW_STAGES.find((s) => s.id === id)!);

  const getRunStatus = (stageId: WorkflowStageId): RunStatus => {
    const state = runStates.find((r) => r.stageId === stageId);
    return state?.status ?? 'complete';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Universal Baseline Workflow</h2>
        <p className="text-sm text-slate-500">
          One repeatable daily flow that generates content across all channels. Runs automatically,
          requires only a weekly approval pass, and acts as the safety line if a channel-specific flow breaks.
        </p>
      </div>

      {/* Run Control Bar */}
      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/[0.04] flex items-center justify-center">
              <Zap size={20} className="text-sky-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Daily Run — Aug 16, 2026</h3>
              <p className="text-xs text-slate-400">
                {completedCount} of {runStates.length} daily stages complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetRun}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 bg-[#101820] rounded-lg hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            {currentStage && (
              <button
                onClick={() => advanceStage(currentStage.stageId)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-cyan-400/[0.04]0 rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
              >
                <PlayCircle size={15} />
                Advance {WORKFLOW_STAGES.find((s) => s.id === currentStage.stageId)?.label}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#101820] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / runStates.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Daily Stages */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Daily Sequence</h3>
          <span className="text-xs text-slate-400">— runs every day at 7:00 AM</span>
        </div>

        <div className="space-y-2">
          {dailyStages.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.icon] || Circle;
            const status = getRunStatus(stage.id);
            const statusCfg = STATUS_CONFIG[status];
            const StatusIcon = statusCfg.icon;
            const isRunning = status === 'running';

            return (
              <div
                key={stage.id}
                className={`bg-[#0b1118] border rounded-xl p-4 transition-all ${
                  isRunning
                    ? 'border-amber-300 shadow-md ring-2 ring-amber-100'
                    : status === 'complete'
                    ? 'border-[#1b2935]'
                    : 'border-[#1b2935] opacity-70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${statusCfg.color}15` }}
                    >
                      <Icon size={18} style={{ color: statusCfg.color }} />
                    </div>
                    {i < dailyStages.length - 1 && (
                      <div className="w-0.5 h-6 bg-slate-200 mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-200">{stage.label}</h4>
                      </div>
                      <span
                        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}
                      >
                        <StatusIcon size={11} className={isRunning ? 'animate-spin' : ''} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{stage.description}</p>
                    {stage.extensionPoint && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <ArrowRight size={10} />
                        <span className="italic">Extension point: {stage.extensionPoint}</span>
                      </div>
                    )}
                  </div>

                  {isRunning && (
                    <button
                      onClick={() => advanceStage(stage.id)}
                      className="px-3 py-1.5 text-xs font-medium text-sky-600 bg-cyan-400/[0.04] rounded-lg hover:bg-sky-100 transition-colors shrink-0"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ArrowRight size={14} className="rotate-90" />
          <span>Output feeds into weekly approval</span>
        </div>
      </div>

      {/* Weekly Stages */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Weekly Rhythm</h3>
          <span className="text-xs text-slate-400">— runs once per week</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {weeklyStages.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.icon] || Circle;
            return (
              <button
                key={stage.id}
                onClick={onNavigateToApproval}
                className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 text-left hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-400/[0.045] flex items-center justify-center">
                    <Icon size={17} className="text-violet-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {String(dailyStages.length + i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1 group-hover:text-sky-600 transition-colors">
                  {stage.label}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{stage.description}</p>
                {stage.extensionPoint && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <ArrowRight size={10} />
                    <span className="italic">Extension: {stage.extensionPoint}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Run Log */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Today's Run Log</h3>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
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
              {MOCK_RUNS.filter((r) => r.date === '2026-08-16').map((run) => {
                const stage = WORKFLOW_STAGES.find((s) => s.id === run.stage);
                const cfg = STATUS_CONFIG[run.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={run.id} className="border-b border-[#14202a] last:border-0 hover:bg-[#070b10]/50 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-slate-300">{stage?.label || run.stage}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
                        <StatusIcon size={12} className={run.status === 'running' ? 'animate-spin' : ''} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-slate-400">{run.itemsProcessed}</td>
                    <td className="px-4 py-2.5 text-right text-sm text-slate-400">{run.itemsGenerated}</td>
                    <td className="px-4 py-2.5 text-right text-sm text-slate-400 font-mono">{run.duration}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}