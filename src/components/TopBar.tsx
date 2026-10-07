import { Search, Bell, Plus } from 'lucide-react';
import type { ViewId, PlatformId } from '@/types';
import { getPlatform } from '@/data/platforms';

interface TopBarProps {
  activeView: ViewId;
  activePlatform: PlatformId | null;
  onSearch: (query: string) => void;
  searchQuery: string;
  onNewContent: () => void;
}

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  connections: 'Account Connections',
  platform: 'Channel',
  pipeline: 'Content Pipeline',
  content: 'Handoff Flow',
  inputs: 'Standard Inputs',
  outputs: 'Standard Outputs',
  workflow: 'Baseline Workflow',
  approval: 'Weekly Approval',
  extensions: 'Extension Points',
  'test-plan': 'Test Plan',
  'deployment-gate': 'Deployment Gate',
  'channel-rollout': 'Channel Rollout',
  'fallback-path': 'Fallback Path',
  'instagram-pilot': 'Instagram Pilot',
  'tiktok-setup': 'TikTok Setup',
  'pinterest-setup': 'Pinterest Setup',
  'linkedin-setup': 'LinkedIn Setup',
  'content-generator': 'Content Generator',
  'publish-handoff': 'Publish Handoff',
};

export function TopBar({ activeView, activePlatform, onSearch, searchQuery, onNewContent }: TopBarProps) {
  const platform = activePlatform ? getPlatform(activePlatform) : null;
  const breadcrumb = platform
    ? [VIEW_LABELS[activeView], platform.label]
    : [VIEW_LABELS[activeView]];

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3.5">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-300">/</span>}
              <span
                className={i === breadcrumb.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500'}
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search content..."
              className="w-64 pl-9 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-lg outline-none transition-all focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
            />
          </div>
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={18} className="text-slate-600" />
          </button>
          <button onClick={onNewContent} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
            <Plus size={16} />
            New Content
          </button>
        </div>
      </div>
    </header>
  );
}
