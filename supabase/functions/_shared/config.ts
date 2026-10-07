// Platform OAuth configuration.
// Secrets stay in Supabase Edge Function environment variables.

export interface OAuthConfig {
  provider: string;
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string;
}

export const APP_URL = Deno.env.get('APP_URL') ?? 'https://channel-studio.pages.dev';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
export const OAUTH_CALLBACK_URL =
  Deno.env.get('OAUTH_CALLBACK_URL') ||
  (supabaseUrl ? `${supabaseUrl}/functions/v1/auth_callback` : '');

export const OAUTH_PROVIDERS: Record<string, OAuthConfig> = {
  instagram: {
    provider: 'instagram',
    authorizeUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    clientIdEnv: 'INSTAGRAM_CLIENT_ID',
    clientSecretEnv: 'INSTAGRAM_CLIENT_SECRET',
    scopes: 'user_profile,user_media',
  },
  facebook: {
    provider: 'facebook',
    authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
    scopes: 'pages_show_list,pages_read_engagement,pages_manage_posts',
  },
  tiktok: {
    provider: 'tiktok',
    authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientIdEnv: 'TIKTOK_CLIENT_ID',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    scopes: 'user.info.basic,video.upload,video.publish',
  },
  pinterest: {
    provider: 'pinterest',
    authorizeUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    clientIdEnv: 'PINTEREST_CLIENT_ID',
    clientSecretEnv: 'PINTEREST_CLIENT_SECRET',
    scopes: 'boards:read,boards:write,pins:read,pins:write',
  },
  linkedin: {
    provider: 'linkedin',
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    scopes: 'w_member_social,r_liteprofile,r_emailaddress',
  },
};

export function getProviderConfig(provider: string): OAuthConfig | null {
  return OAUTH_PROVIDERS[provider] ?? null;
}
