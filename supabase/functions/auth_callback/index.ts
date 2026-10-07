// Edge Function: auth_callback
// Validates single-use OAuth state, exchanges the code server-side, stores credentials
// in a server-only table, and returns only connection metadata to the browser.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { APP_URL, getProviderConfig, OAUTH_CALLBACK_URL } from "../_shared/config.ts";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

async function fetchInstagramProfile(accessToken: string): Promise<{ name: string; id: string } | null> {
  try {
    const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.username ?? '', id: data.id ?? '' };
  } catch { return null; }
}

async function fetchFacebookProfile(accessToken: string): Promise<{ name: string; id: string } | null> {
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.name ?? '', id: data.id ?? '' };
  } catch { return null; }
}

async function fetchTikTokProfile(accessToken: string): Promise<{ name: string; id: string } | null> {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,open_id', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.data?.user;
    return { name: user?.display_name ?? '', id: user?.open_id ?? '' };
  } catch { return null; }
}

async function fetchPinterestProfile(accessToken: string): Promise<{ name: string; id: string } | null> {
  try {
    const res = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.username ?? data.full_name ?? '', id: data.id ?? '' };
  } catch { return null; }
}

async function fetchLinkedInProfile(accessToken: string): Promise<{ name: string; id: string } | null> {
  try {
    const res = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const name = `${data.localizedFirstName ?? ''} ${data.localizedLastName ?? ''}`.trim();
    return { name, id: data.id ?? '' };
  } catch { return null; }
}

const PROFILE_FETCHERS: Record<string, (token: string) => Promise<{ name: string; id: string } | null>> = {
  instagram: fetchInstagramProfile,
  facebook: fetchFacebookProfile,
  tiktok: fetchTikTokProfile,
  pinterest: fetchPinterestProfile,
  linkedin: fetchLinkedInProfile,
};

async function exchangeCode(
  config: NonNullable<ReturnType<typeof getProviderConfig>>,
  code: string,
): Promise<TokenResponse> {
  const clientId = Deno.env.get(config.clientIdEnv) ?? '';
  const clientSecret = Deno.env.get(config.clientSecretEnv);
  if (!clientId || !clientSecret) throw new Error(`Missing OAuth credentials for ${config.provider}`);

  if (config.provider === 'tiktok') {
    const body = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: OAUTH_CALLBACK_URL,
    });
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) throw new Error(`TikTok token exchange failed: ${res.status}`);
    const data = await res.json();
    return {
      access_token: data.access_token ?? data.data?.access_token,
      expires_in: data.expires_in ?? data.data?.expires_in,
      refresh_token: data.refresh_token ?? data.data?.refresh_token,
    };
  }

  if (config.provider === 'linkedin') {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH_CALLBACK_URL,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${res.status}`);
    return await res.json();
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: OAUTH_CALLBACK_URL,
    grant_type: 'authorization_code',
  });

  if (config.provider === 'instagram') {
    body.delete('grant_type');
  }

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data: TokenResponse = await res.json();
  if (!res.ok) throw new Error(data.error_description || `Token exchange failed: ${res.status}`);
  return data;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let provider = 'unknown';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey || !OAUTH_CALLBACK_URL) {
      throw new Error('OAuth server configuration is incomplete');
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const providerError = url.searchParams.get('error');

    if (!state) throw new Error('Missing OAuth state');

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: stateRow, error: stateError } = await supabase
      .from('oauth_states')
      .select('provider, expires_at, user_id')
      .eq('state', state)
      .maybeSingle();

    if (stateError || !stateRow) throw new Error('Invalid or already-used OAuth state');

    provider = stateRow.provider;

    if (!stateRow.user_id) throw new Error('OAuth state is not bound to an operator');

    const { data: operator, error: operatorError } = await supabase
      .from('studio_operators')
      .select('user_id')
      .eq('user_id', stateRow.user_id)
      .maybeSingle();

    if (operatorError || !operator) throw new Error('OAuth operator is no longer authorized');

    const expired = new Date(stateRow.expires_at).getTime() <= Date.now();

    const { error: consumeError } = await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);
    if (consumeError) throw new Error('Could not consume OAuth state');
    if (expired) throw new Error('OAuth state expired');

    if (providerError) throw new Error(`Provider authorization failed: ${providerError}`);
    if (!code) throw new Error('No authorization code provided');

    const config = getProviderConfig(provider);
    if (!config) throw new Error('Unknown OAuth provider');

    const tokenData = await exchangeCode(config, code);
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'No access token returned');
    }

    const fetcher = PROFILE_FETCHERS[provider];
    const profile = fetcher ? await fetcher(tokenData.access_token) : null;
    const accountName = profile?.name ?? 'Connected';
    const externalId = profile?.id ?? null;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: credentialError } = await supabase
      .from('oauth_credentials')
      .upsert({
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at: expiresAt,
        external_id: externalId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider' });
    if (credentialError) throw new Error('Could not store OAuth credentials');

    const accountMetadata = {
      provider,
      label: config.provider,
      connected: true,
      verified: true,
      account_name: accountName,
      expires_at: expiresAt,
      external_id: externalId,
      profile_raw: profile ? JSON.stringify(profile) : null,
      updated_at: new Date().toISOString(),
    };

    const { error: metadataError } = await supabase
      .from('account_connections')
      .upsert(accountMetadata, { onConflict: 'provider' });
    if (metadataError) throw new Error('Could not store connection metadata');

    const redirectUrl = `${APP_URL}#/connected/${provider}?status=ok&name=${encodeURIComponent(accountName)}`;
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: redirectUrl },
    });
  } catch (err) {
    console.error('auth_callback error:', err);
    const errorRedirect = `${APP_URL}#/connected/${provider}?status=error&error=authorization_failed`;
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: errorRedirect },
    });
  }
});
