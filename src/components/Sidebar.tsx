import { useState } from 'react';
import { PLATFORMS } from '@/data/platforms';
import type { PlatformId, ViewId } from '@/types';
import {
  LayoutDashboard,
  Workflow,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Instagram,
  Facebook,
  Music2,
  Image,
  Linkedin,
  ChevronDown,
  ChevronRight,
  Zap,
  CheckSquare,
  Boxes,
  FlaskConical,
  ShieldCheck,
  Cable,
  Rocket,
  Shield,
  Sparkles,
  WandSparkles,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Instagram,
  Facebook,
  Music2,
  Image,
  Linkedin,
};

interface SidebarProps {
  activeView: ViewId;
  activePlatform: PlatformId | null;
  onNavigate: (view: ViewId) => void;
  onPlatformSelect: (platformId: PlatformId) => void;
}

const PRIMARY_NAV = [
  { id: 'home', label: 'Home', icon: LayoutDashboard, view: 'dashboard' as ViewId },
  { id: 'create', label: 'Create', icon: WandSparkles, view: 'content-generator' as ViewId },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare, view: 'approval' as ViewId },
  { id: 'publish', label: 'Publish', icon: Rocket, view: 'publish-handoff' as ViewId },
  { id: 'accounts', label: 'Accounts', icon: Cable, view: 'connections' as ViewId },
];

const SYSTEM_NAV = [
  { id: 'pipeline', label: 'Content Pipeline', icon: Workflow, view: 'pipeline' as ViewId },
  { id: 'workflow', label: 'Baseline Workflow', icon: Zap, view: 'workflow' as ViewId },
  { id: 'handoff', label: 'Handoff Flow', icon: ArrowRightLeft, view: 'content' as ViewId },
  { id: 'inputs', label: 'Standard Inputs', icon: ArrowDownToLine, view: 'inputs' as ViewId },
  { id: 'outputs', label: 'Standard Outputs', icon: ArrowUpFromLine, view: 'outputs' as ViewId },
  { id: 'extensions', label: 'Extension Points', icon: Boxes, view: 'extensions' as ViewId },
  { id: 'test-plan', label: 'Test Plan', icon: FlaskConical, view: 'test-plan' as ViewId },
  { id: 'deployment-gate', label: 'Deployment Gate', icon: ShieldCheck, view: 'deployment-gate' as ViewId },
  { id: 'channel-rollout', label: 'Channel Rollout', icon: Rocket, view: 'channel-rollout' as ViewId },
  { id: 'fallback-path', label: 'Fallback / Recovery', icon: Shield, view: 'fallback-path' as ViewId },
  { id: 'instagram-pilot', label: 'Instagram Pilot', icon: Sparkles, view: 'instagram-pilot' as ViewId },
  { id: 'tiktok-setup', label: 'TikTok Setup', icon: Music2, view: 'tiktok-setup' as ViewId },
  { id: 'pinterest-setup', label: 'Pinterest Setup', icon: Image, view: 'pinterest-setup' as ViewId },
  { id: 'linkedin-setup', label: 'LinkedIn Setup', icon: Linkedin, view: 'linkedin-setup' as ViewId },
];

export function Sidebar({ activeView, activePlatform, onNavigate, onPlatformSelect }: SidebarProps) {
  const [systemOpen, setSystemOpen] = useState(false);

  const renderNavButton = (item: (typeof PRIMARY_NAV)[number] | (typeof SYSTEM_NAV)[number]) => {
    const Icon = item.icon;
    const isActive = activeView === item.view;

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.view)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
          isActive
            ? 'bg-cyan-400/[0.08] text-cyan-300 font-medium border border-cyan-400/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.025]'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-cyan-300' : 'text-slate-500'} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 shrink-0 bg-[#070b10] border-r border-[#16222d] flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-[#16222d]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Workflow size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">Channel Studio</h1>
            <p className="text-slate-500 text-xs">Create · approve · publish</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <section>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>
          <div className="space-y-1">
            {PRIMARY_NAV.map(renderNavButton)}
          </div>
        </section>

        <section>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Channels
          </p>
          <div className="space-y-1">
            {PLATFORMS.map((platform) => {
              const Icon = ICON_MAP[platform.icon] || Image;
              const isActive = activeView === 'platform' && activePlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => onPlatformSelect(platform.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.025]'
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <Icon size={15} style={{ color: platform.color }} />
                  </span>
                  <span className="flex-1 text-left">{platform.label}</span>
                  <ChevronRight size={14} className={isActive ? 'text-slate-400' : 'text-slate-600'} />
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <button
            type="button"
            onClick={() => setSystemOpen((open) => !open)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.025]"
            aria-expanded={systemOpen}
          >
            <Settings2 size={18} className="text-slate-500" />
            <span className="flex-1 text-left font-medium">System</span>
            {systemOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {systemOpen && (
            <div className="mt-2 ml-2 pl-2 border-l border-[#16222d] space-y-1">
              {SYSTEM_NAV.map(renderNavButton)}
            </div>
          )}
        </section>
      </nav>

      <div className="px-4 py-4 border-t border-[#16222d]">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>OPERATOR SESSION SECURE</span>
        </div>
      </div>
    </aside>
  );
}
