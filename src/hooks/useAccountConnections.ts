import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AccountConnection {
  provider: string;
  label: string;
  connected: boolean;
  verified: boolean;
  accountName: string;
  externalId: string;
  expiresAt: string;
  profileRaw: Record<string, string>;
}

const LOCAL_KEY = 'channel-studio-connections';

const PROVIDER_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook / Meta',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
};

function emptyConnections(): Record<string, AccountConnection> {
  const out: Record<string, AccountConnection> = {};
  for (const [provider, label] of Object.entries(PROVIDER_LABELS)) {
    out[provider] = {
      provider,
      label,
      connected: false,
      verified: false,
      accountName: '',
      externalId: '',
      expiresAt: '',
      profileRaw: {},
    };
  }
  return out;
}

export function useAccountConnections() {
  const [connections, setConnections] = useState<Record<string, AccountConnection>>(emptyConnections());
  const [dbReady, setDbReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const persistLocal = useCallback((next: Record<string, AccountConnection>) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    } catch {
      // Browser storage is only a display cache; Supabase remains authoritative.
    }
  }, []);

  const refreshConnections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('account_connections')
        .select('provider, label, connected, verified, account_name, external_id, expires_at, profile_raw');

      if (error) throw error;

      const map = emptyConnections();
      for (const row of data || []) {
        let profileRaw: Record<string, string> = {};
        try {
          if (row.profile_raw) {
            profileRaw = typeof row.profile_raw === 'string' ? JSON.parse(row.profile_raw) : row.profile_raw;
          }
        } catch {
          profileRaw = {};
        }

        map[row.provider] = {
          provider: row.provider,
          label: row.label || PROVIDER_LABELS[row.provider] || row.provider,
          connected: !!row.connected,
          verified: !!row.verified,
          accountName: row.account_name || '',
          externalId: row.external_id || '',
          expiresAt: row.expires_at || '',
          profileRaw,
        };
      }

      setConnections(map);
      persistLocal(map);
      setDbReady(true);
    } catch {
      setDbReady(false);
    } finally {
      setLoaded(true);
    }
  }, [persistLocal]);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
      setConnections({ ...emptyConnections(), ...cached });
    } catch {
      setConnections(emptyConnections());
    }

    void refreshConnections();
  }, [refreshConnections]);

  const startOAuth = useCallback((provider: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      throw new Error('Supabase URL is not configured.');
    }

    window.location.href =
      `${supabaseUrl}/functions/v1/auth_start?provider=${encodeURIComponent(provider)}`;
  }, []);

  const handleCallback = useCallback(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/#\/connected\/(\w+)\?status=(\w+)/);
    if (!match) return null;

    const [, provider, status] = match;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const name = params.get('name') || '';
    const error = params.get('error') || '';

    window.history.replaceState(null, '', window.location.pathname);
    void refreshConnections();

    if (status === 'ok') {
      return { provider, status: 'ok', name };
    }

    return { provider, status: 'error', error };
  }, [refreshConnections]);

  return {
    connections,
    startOAuth,
    handleCallback,
    refreshConnections,
    dbReady,
    loaded,
  };
}
