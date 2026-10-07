import { useEffect, useState } from 'react';
import { useAccountConnections } from '@/hooks/useAccountConnections';
import {
  Instagram,
  Facebook,
  Music2,
  Image,
  Linkedin,
  CheckCircle2,
  Circle,
  Info,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

interface ConnectorDef {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
  powers: string;
  note: string;
}

const CONNECTORS: ConnectorDef[] = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: Instagram, powers: 'Reels, stories, posts', note: 'Authorize through Instagram/Meta OAuth.' },
  { id: 'facebook', label: 'Facebook / Meta', color: '#1877F2', icon: Facebook, powers: 'Pages and Meta publishing permissions', note: 'Authorize through Meta OAuth.' },
  { id: 'tiktok', label: 'TikTok', color: '#69C9D0', icon: Music2, powers: 'Short-form video publishing', note: 'Authorize through TikTok OAuth.' },
  { id: 'pinterest', label: 'Pinterest', color: '#E60023', icon: Image, powers: 'Pins and boards', note: 'Authorize through Pinterest OAuth.' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: Linkedin, powers: 'Professional publishing', note: 'Authorize through LinkedIn OAuth.' },
];

export function ConnectionsView() {
  const { connections, startOAuth, handleCallback, dbReady, loaded } = useAccountConnections();
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState('');

  const beginOAuth = async (provider: string) => {
    setOauthError('');
    setOauthProvider(provider);
    try {
      await startOAuth(provider);
    } catch (error) {
      setOauthProvider(null);
      setOauthError(error instanceof Error ? error.message : 'Could not start provider authorization.');
    }
  };

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  const connectedCount = CONNECTORS.filter((connector) => connections[connector.id]?.connected).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Account Connections</h1>
          <p className="text-sm text-slate-500 mt-1">
            OAuth credentials stay in server-only storage. This screen receives connection metadata only.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#101820] text-slate-400">
          {connectedCount} / {CONNECTORS.length} connected
        </div>
      </div>

      <div className="flex items-start gap-3 bg-amber-400/[0.05] border border-amber-400/15 rounded-xl px-4 py-3 mb-6">
        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200/80 leading-relaxed">
          Direct token entry has been disabled. New connections must complete the provider OAuth flow so credentials never pass through the browser UI.
          {dbReady ? ' Connection status is synced from Supabase.' : ' Backend connection status is currently unavailable.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CONNECTORS.map((connector) => {
          const Icon = connector.icon;
          const conn = connections[connector.id];
          const connected = !!conn?.connected;

          return (
            <div
              key={connector.id}
              className={`bg-[#0b1118] border rounded-xl p-5 transition-all flex flex-col ${
                connected ? 'border-emerald-400/20 shadow-sm' : 'border-[#1b2935]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${connector.color}1a` }}
                >
                  <Icon size={20} style={{ color: connector.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-100">{connector.label}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{connector.powers}</p>
                </div>
                {connected ? (
                  <CheckCircle2 size={18} className="text-emerald-500 ml-auto shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 ml-auto shrink-0" />
                )}
              </div>

              {connected ? (
                <div className="space-y-3 mt-1 flex-1">
                  <div className="rounded-lg bg-emerald-400/[0.045] border border-emerald-400/10 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Connected account</p>
                    <p className="text-sm font-semibold text-slate-200 break-all">{conn?.accountName || 'Connected'}</p>
                    <p className="text-[11px] text-emerald-400 mt-1">
                      {conn?.verified ? '✓ Provider authorization verified' : 'Connection recorded'}
                    </p>
                    {conn?.expiresAt && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Authorization expiry: {new Date(conn.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => void beginOAuth(connector.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#101820] text-slate-300 hover:bg-slate-200 transition-all"
                  >
                    <RefreshCw size={14} />
                    {oauthProvider === connector.id ? 'Starting authorization…' : 'Reauthorize securely'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 flex-1 flex flex-col">
                  <p className="text-xs text-slate-500 leading-relaxed">{connector.note}</p>
                  <button
                    onClick={() => void beginOAuth(connector.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-all"
                    style={{ backgroundColor: connector.color }}
                  >
                    <KeyRound size={14} />
                    {oauthProvider === connector.id ? 'Starting authorization…' : `Authorize ${connector.label}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {oauthError && (
        <div className="mt-6 flex items-start gap-3 bg-rose-400/[0.05] border border-rose-400/15 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-200 leading-relaxed">{oauthError}</p>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 bg-cyan-400/[0.04] border border-cyan-400/10 rounded-xl px-4 py-3">
        <Info size={18} className="text-sky-500 mt-0.5 shrink-0" />
        <p className="text-xs text-cyan-200/75 leading-relaxed">
          {!loaded
            ? 'Loading connection status…'
            : 'Studio only displays provider status and profile metadata here. OAuth credentials remain server-side.'}
        </p>
      </div>
    </div>
  );
}
