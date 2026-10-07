import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getProviderConfig } from "./config.ts";

interface PinterestTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  refresh_token_expires_at?: number;
  error?: string;
  message?: string;
}

const REFRESH_SKEW_MS = 5 * 60 * 1000;

function refreshExpiryIso(data: PinterestTokenResponse): string | null {
  if (data.refresh_token_expires_at) {
    return new Date(data.refresh_token_expires_at * 1000).toISOString();
  }
  if (data.refresh_token_expires_in) {
    return new Date(Date.now() + data.refresh_token_expires_in * 1000).toISOString();
  }
  return null;
}

export async function getPinterestAccessToken(
  admin: SupabaseClient,
): Promise<string | null> {
  const { data: credential, error } = await admin
    .from("oauth_credentials")
    .select("access_token, refresh_token, expires_at, refresh_token_expires_at")
    .eq("provider", "pinterest")
    .maybeSingle();

  if (error || !credential?.access_token) return null;

  const accessExpiry = credential.expires_at
    ? new Date(credential.expires_at).getTime()
    : 0;

  if (!accessExpiry || accessExpiry - Date.now() > REFRESH_SKEW_MS) {
    return credential.access_token;
  }

  if (!credential.refresh_token) return null;

  const refreshExpiry = credential.refresh_token_expires_at
    ? new Date(credential.refresh_token_expires_at).getTime()
    : 0;
  if (refreshExpiry && refreshExpiry <= Date.now()) return null;

  const config = getProviderConfig("pinterest");
  if (!config) return null;

  const clientId = Deno.env.get(config.clientIdEnv);
  const clientSecret = Deno.env.get(config.clientSecretEnv);
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: credential.refresh_token,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data: PinterestTokenResponse = await response.json();
  if (!response.ok || !data.access_token) {
    console.error("Pinterest token refresh failed", {
      status: response.status,
      error: data.error || data.message || "unknown",
    });
    return null;
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;
  const refreshToken = data.refresh_token || credential.refresh_token;
  const refreshTokenExpiresAt =
    refreshExpiryIso(data) || credential.refresh_token_expires_at || null;

  const { error: updateError } = await admin
    .from("oauth_credentials")
    .update({
      access_token: data.access_token,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      refresh_token_expires_at: refreshTokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("provider", "pinterest");

  if (updateError) {
    console.error("Pinterest credential rotation persistence failed", updateError.message);
    return null;
  }

  return data.access_token;
}
