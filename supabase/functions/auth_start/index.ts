// Edge Function: auth_start
// Authenticated operators request an authorization URL. The browser never supplies OAuth state.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getProviderConfig, OAUTH_CALLBACK_URL } from "../_shared/config.ts";
import { OperatorAuthError, operatorErrorResponse, requireOperator } from "../_shared/requireOperator.ts";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { user, admin } = await requireOperator(req);
    const body = await req.json().catch(() => ({}));
    const provider = typeof body?.provider === 'string' ? body.provider : '';

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Missing provider' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = getProviderConfig(provider);
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get(config.clientIdEnv);
    if (!clientId || !OAUTH_CALLBACK_URL) {
      return new Response(JSON.stringify({ error: 'Provider authorization is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: stateError } = await admin
      .from('oauth_states')
      .insert({ state, provider, user_id: user.id, expires_at: expiresAt });

    if (stateError) {
      console.error('OAuth state insert failed:', stateError.message);
      return new Response(JSON.stringify({ error: 'Could not start authorization safely' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authUrl = new URL(config.authorizeUrl);
    authUrl.searchParams.set(provider === 'tiktok' ? 'client_key' : 'client_id', clientId);
    authUrl.searchParams.set('scope', config.scopes);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', OAUTH_CALLBACK_URL);
    authUrl.searchParams.set('state', state);

    return new Response(JSON.stringify({ authorizeUrl: authUrl.toString() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error('auth_start error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
