// Edge Function: auth_start
// Starts OAuth with server-generated, single-use state stored outside browser access.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getProviderConfig, OAUTH_CALLBACK_URL } from "../_shared/config.ts";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Missing provider parameter' }), {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId) {
      return new Response(JSON.stringify({ error: `Missing ${config.clientIdEnv} secret in Supabase` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!supabaseUrl || !serviceRoleKey || !OAUTH_CALLBACK_URL) {
      return new Response(JSON.stringify({ error: 'OAuth server configuration is incomplete' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({ state, provider, expires_at: expiresAt });

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

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: authUrl.toString() },
    });
  } catch (err) {
    console.error('auth_start error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
