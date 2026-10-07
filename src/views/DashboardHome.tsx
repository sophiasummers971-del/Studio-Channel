import { PLATFORMS, CONTENT_STAGES } from '@/data/platforms';
import { useAccountConnections } from '@/hooks/useAccountConnections';
import { useContentData } from '@/hooks/useContentData';
import type { PlatformId, ViewId } from '@/types';
import {
  ArrowRight,
  Cable,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Rocket,
  WandSparkles,
} from 'lucide-react';

interface DashboardHomeProps {
  onPlatformSelect: (platformId: PlatformId) => void;
  onNavigate: (view: ViewId) => void;
}

export function DashboardHome({ onPlatformSelect, onNavigate }: DashboardHomeProps) {
  const { content, loading: contentLoading, dbLive } = useContentData();
  const { connections, loaded: connectionsLoaded } = useAccountConnections();

  const connectedCount = PLATFORMS.filter((platform) => connections[platform.id]?.connected).length;
  const pendingApproval = content.filter((item) => item.stage === 'review').length;
  const readyToPublish = content.filter((item) => item.stage === 'scheduled').length;
  const published = content.filter((item) => item.stage === 'published').length;

  const stats = [
    { label: 'Connected accounts', value: connectionsLoaded ? `${connectedCount}/${PLATFORMS.length}` : '…', icon: Cable },
    { label: 'Waiting approval', value: contentLoading ? '…' : String(pendingApproval), icon: CheckCircle2 },
    { label: 'Ready to publish', value: contentLoading ? '…' : String(readyToPublish), icon: Rocket },
    { label: 'Published', value: contentLoading ? '…' : String(published), icon: LayoutDashboard },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={19} className="text-sky-500" />
          <h2 className="text-2xl font-bold text-slate-100">Home</h2>
        </div>
        <p className="text-sm text-slate-500">
          One view of what needs attention now. Detailed engineering controls live under System.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <Icon size={17} className="text-slate-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <button
          onClick={() => onNavigate('content-generator')}
          className="text-left bg-slate-900 text-white rounded-xl p-5 hover:bg-slate-800 transition-colors"
        >
          <WandSparkles size={20} className="text-sky-300 mb-4" />
          <h3 className="font-semibold">Create content</h3>
          <p className="text-xs text-slate-300 mt-1">Generate platform-ready drafts and move them into the workflow.</p>
        </button>

        <button
          onClick={() => onNavigate('approval')}
          className="text-left bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <CheckCircle2 size={20} className="text-emerald-500 mb-4" />
          <h3 className="font-semibold text-slate-100">Review approvals</h3>
          <p className="text-xs text-slate-500 mt-1">{pendingApproval} item{pendingApproval === 1 ? '' : 's'} currently waiting for review.</p>
        </button>

        <button
          onClick={() => onNavigate('publish-handoff')}
          className="text-left bg-[#0b1118] border border-[#1b2935] rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <Rocket size={20} className="text-violet-500 mb-4" />
          <h3 className="font-semibold text-slate-100">Publish queue</h3>
          <p className="text-xs text-slate-500 mt-1">{readyToPublish} item{readyToPublish === 1 ? '' : 's'} ready for publishing.</p>
        </button>
      </div>

      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-[#14202a] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-100">Accounts</h3>
            <p className="text-xs text-slate-500 mt-1">Provider status only. Credentials remain server-side.</p>
          </div>
          <button
            onClick={() => onNavigate('connections')}
            className="text-xs font-semibold text-sky-600 hover:text-cyan-200/75"
          >
            Manage accounts
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {PLATFORMS.map((platform) => {
            const connection = connections[platform.id];
            const connected = !!connection?.connected;
            return (
              <button
                key={platform.id}
                onClick={() => onPlatformSelect(platform.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[#070b10] transition-colors"
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
                >
                  {platform.label[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100">{platform.label}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {connected ? connection.accountName || 'Connected' : 'Not connected'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {connected ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      <span className="text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <Circle size={15} className="text-slate-300" />
                      <span className="text-slate-400">Offline</span>
                    </>
                  )}
                  <ArrowRight size={15} className="text-slate-300 ml-2" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#0b1118] border border-[#1b2935] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-slate-100">Content flow</h3>
            <p className="text-xs text-slate-500 mt-1">
              {dbLive ? 'Live Supabase data' : 'No live content rows loaded yet'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('pipeline')}
            className="text-xs font-semibold text-sky-600 hover:text-cyan-200/75"
          >
            Open pipeline
          </button>
        </div>

        <div className="flex items-center gap-2">
          {CONTENT_STAGES.map((stage, index) => {
            const count = content.filter((item) => item.stage === stage.id).length;
            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-0">
                <div className="flex-1 text-center min-w-0">
                  <div
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2"
                    style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                  >
                    {contentLoading ? '…' : count}
                  </div>
                  <p className="text-xs font-medium text-slate-400 truncate">{stage.label}</p>
                </div>
                {index < CONTENT_STAGES.length - 1 && (
                  <div className="h-0.5 flex-1 bg-slate-200 -mt-6" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
