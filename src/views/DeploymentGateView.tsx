import { DEPLOYMENT_CHECKLIST } from '@/data/testPlan';
import { getWorkflowStage } from '@/data/workflow';
import type { UseTestPlanReturn } from '@/hooks/useTestPlan';
import type { DeploymentChecklistItem } from '@/types';
import {
  CheckCircle2,
  Circle,
  ShieldCheck,
  ShieldAlert,
  Rocket,
  Wrench,
  Bug,
  AlertTriangle,
  Lock,
  Unlock,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  'core-tests': { label: 'Core Tests', icon: CheckCircle2, color: '#0EA5E9' },
  'quality': { label: 'Quality', icon: Bug, color: '#F59E0B' },
  'process': { label: 'Process', icon: AlertTriangle, color: '#8B5CF6' },
  'readiness': { label: 'Readiness', icon: ShieldCheck, color: '#10B981' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  blocker: { color: '#EF4444', bg: '#FEE2E2', label: 'Blocker' },
  major: { color: '#F59E0B', bg: '#FFFBEB', label: 'Major' },
  minor: { color: '#64748B', bg: '#F1F5F9', label: 'Minor' },
};

const STATUS_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: '#EF4444', bg: '#FEE2E2', label: 'Open' },
  fixing: { color: '#F59E0B', bg: '#FFFBEB', label: 'Fixing' },
  resolved: { color: '#10B981', bg: '#ECFDF5', label: 'Resolved' },
};

interface DeploymentGateViewProps {
  testPlan: UseTestPlanReturn;
}

export function DeploymentGateView({ testPlan }: DeploymentGateViewProps) {
  const {
    checklist,
    toggleChecklistItem,
    issues,
    updateIssueStatus,
    allTestsRun,
    criticalTestsPassed,
    importantTestsPassed,
    openBlockers,
    requiredChecklistComplete,
    canDeploy,
    decision,
    makeDecision,
    passCount,
    warningCount,
    failCount,
  } = testPlan;

  const groupedChecklist = DEPLOYMENT_CHECKLIST.reduce(
    (acc, item) => {
      const liveItem = checklist.find((c) => c.id === item.id) || item;
      if (!acc[liveItem.category]) acc[liveItem.category] = [];
      acc[liveItem.category].push(liveItem);
      return acc;
    },
    {} as Record<string, DeploymentChecklistItem[]>
  );

  const requiredCount = checklist.filter((c) => c.required).length;
  const requiredChecked = checklist.filter((c) => c.required && c.checked).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Deployment Gate</h2>
        <p className="text-sm text-slate-500">
          Confirm deployment readiness. The gate opens only when all critical tests pass, blockers
          are resolved, and the required checklist is complete.
        </p>
      </div>

      {/* Readiness Banner */}
      <div
        className={`rounded-xl border p-5 mb-6 transition-all ${
          canDeploy
            ? 'bg-emerald-400/[0.045] border-emerald-300'
            : 'bg-amber-400/[0.05] border-amber-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              canDeploy ? 'bg-emerald-100' : 'bg-amber-100'
            }`}
          >
            {canDeploy ? (
              <ShieldCheck size={24} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={24} className="text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${canDeploy ? 'text-emerald-800' : 'text-amber-200/80'}`}>
              {canDeploy
                ? 'Deployment Ready — All gates passed'
                : 'Not Ready — Complete remaining requirements'}
            </h3>
            <p className={`text-xs mt-0.5 ${canDeploy ? 'text-emerald-400' : 'text-amber-600'}`}>
              {canDeploy
                ? 'The universal baseline workflow has passed validation and is cleared for deployment.'
                : `${requiredCount - requiredChecked} required checklist items pending, ${openBlockers.length} blocker(s) to resolve before deployment.`}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
        <div className="bg-[#070b10] px-5 py-3 border-b border-[#1b2935]">
          <h3 className="text-sm font-semibold text-slate-300">Deployment Checklist</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {requiredChecked} of {requiredCount} required items complete
          </p>
        </div>
        <div className="p-5 space-y-2">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all ${
                item.checked
                  ? 'bg-emerald-400/[0.045]/50 border border-emerald-400/10'
                  : 'bg-[#070b10] border border-[#14202a] hover:bg-[#101820]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  item.checked ? 'bg-emerald-400/[0.045]0' : 'bg-[#0b1118] border border-slate-300'
                }`}
              >
                {item.checked ? (
                  <CheckCircle2 size={12} className="text-white" />
                ) : (
                  <Circle size={12} className="text-transparent" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${item.checked ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.label}
                  </p>
                  {item.required ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                      <Lock size={8} />
                      Required
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium text-slate-400 bg-[#101820] px-1.5 py-0.5 rounded-full">
                      <Unlock size={8} />
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Issues Found */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Issues Found During Validation</h3>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden">
          {issues.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400">
              <CheckCircle2 size={18} className="mr-2 text-emerald-400" />
              No issues found
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {issues.map((issue) => {
                const sevCfg = SEVERITY_CONFIG[issue.severity];
                const statusCfg = STATUS_BADGE[issue.status];
                const stage = getWorkflowStage(issue.affectedStage);
                return (
                  <div key={issue.id} className="px-5 py-4 hover:bg-[#070b10]/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: sevCfg.bg }}
                      >
                        <Bug size={15} style={{ color: sevCfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: sevCfg.bg, color: sevCfg.color }}
                          >
                            {sevCfg.label}
                          </span>
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                          >
                            {statusCfg.label}
                          </span>
                          {stage && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#101820] text-slate-400">
                              {stage.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 text-center">
          <span className="text-2xl font-bold text-sky-600">{passCount}</span>
          <p className="text-xs text-slate-500 mt-1">Passed</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 text-center">
          <span className="text-2xl font-bold text-amber-600">{warningCount}</span>
          <p className="text-xs text-slate-500 mt-1">Warnings</p>
        </div>
        <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-4 text-center">
          <span className="text-2xl font-bold text-red-600">{failCount}</span>
          <p className="text-xs text-slate-500 mt-1">Failed</p>
        </div>
      </div>

      {/* Gate Conditions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Gate Conditions</h3>
        <div className="grid grid-cols-2 gap-3">
          <GateCondition label="All tests run" passed={allTestsRun} detail="Every test scenario must be executed at least once." />
          <GateCondition label="Critical tests passed" passed={criticalTestsPassed} detail="All critical-weight tests must show 'passed' status." />
          <GateCondition label="Important tests passed" passed={importantTestsPassed} detail="All important-weight tests must show 'passed' or 'warning' status." />
          <GateCondition label="No open blockers" passed={openBlockers.length === 0} detail={`${openBlockers.length} blocker(s) still open.`} />
          <GateCondition label="Required checklist complete" passed={requiredChecklistComplete} detail="All required deployment checklist items must be checked." />
          <GateCondition label="Decision made" passed={decision !== 'pending'} detail={decision === 'pending' ? 'Awaiting your deployment decision.' : `Decision: ${decision}`} />
        </div>
      </div>

      {/* Deploy Button */}
      <div className="flex justify-end">
        <button
          onClick={() => makeDecision(canDeploy ? 'ready' : 'rework')}
          disabled={!canDeploy}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all ${
            canDeploy
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canDeploy ? <Rocket size={16} /> : <Lock size={16} />}
          {canDeploy ? 'Deploy Now' : 'Gate Locked'}
        </button>
      </div>
    </div>
  );
}

function GateCondition({ label, passed, detail }: { label: string; passed: boolean; detail: string }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
        passed
          ? 'bg-emerald-400/[0.045]/50 border-emerald-400/10'
          : 'bg-amber-400/[0.05]/50 border-amber-400/10'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          passed ? 'bg-emerald-100' : 'bg-amber-100'
        }`}
      >
        {passed ? (
          <CheckCircle2 size={15} className="text-emerald-400" />
        ) : (
          <Circle size={15} className="text-amber-500" />
        )}
      </div>
      <div>
        <p className={`text-xs font-semibold ${passed ? 'text-emerald-800' : 'text-amber-200/80'}`}>
          {label}
        </p>
        <p className={`text-[11px] mt-0.5 ${passed ? 'text-emerald-400' : 'text-amber-600'}`}>
          {detail}
        </p>
      </div>
    </div>
  );
}
