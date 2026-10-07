import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const hook = read('src/hooks/useAccountConnections.ts');
const connections = read('src/views/ConnectionsView.tsx');
const authStart = read('supabase/functions/auth_start/index.ts');
const authCallback = read('supabase/functions/auth_callback/index.ts');
const oauthConfig = read('supabase/functions/_shared/config.ts');
const main = read('src/main.tsx');

assert.ok(
  existsSync('supabase/migrations/20261007115132_secure_oauth_credentials.sql'),
  'secure OAuth migration must exist'
);

assert.doesNotMatch(hook, /access_token|refresh_token|accessToken|refreshToken/,
  'browser hook must never read or write OAuth tokens');
assert.doesNotMatch(hook, /connectManual/,
  'manual credential connection path must be removed from browser hook');

assert.doesNotMatch(connections, /Access token \(optional\)|Paste token|Manual entry/,
  'connections UI must not accept manual OAuth tokens');

assert.match(authStart, /oauth_states/,
  'auth_start must persist server-side OAuth state');
assert.match(authStart, /crypto\.randomUUID\(\)/,
  'auth_start must generate unpredictable OAuth state');

assert.match(authCallback, /oauth_states/,
  'auth_callback must validate OAuth state');
assert.match(authCallback, /oauth_credentials/,
  'auth_callback must store credentials outside account_connections');

const metadataMatch = authCallback.match(/const accountMetadata = \{([\s\S]*?)\n\s*\};/);
assert.ok(metadataMatch, 'auth_callback must define an explicit account metadata payload');
assert.doesNotMatch(metadataMatch[1], /access_token|refresh_token|accessToken|refreshToken/,
  'account_connections metadata payload must contain zero OAuth credential fields');

assert.match(oauthConfig, /OAUTH_CALLBACK_URL/,
  'OAuth config must use one server-side callback URL');
assert.match(oauthConfig, /boards:write/,
  'Pinterest OAuth scopes must include boards:write because publish-pin can create boards');

assert.ok(
  existsSync('supabase/migrations/20261007115140_owner_auth_rls.sql'),
  'owner-auth RLS migration must exist'
);
assert.ok(
  existsSync('src/components/AuthGate.tsx'),
  'Supabase AuthGate must exist'
);

const authGate = existsSync('src/components/AuthGate.tsx') ? read('src/components/AuthGate.tsx') : '';
assert.match(authGate, /signInWithOtp/,
  'AuthGate must use Supabase email OTP or magic-link authentication');
assert.match(authGate, /studio_operators/,
  'AuthGate must verify explicit Studio operator membership');
assert.match(main, /AuthGate/,
  'main entrypoint must use AuthGate');
assert.doesNotMatch(main, /PasswordGate/,
  'client-side password gate must not be the production trust boundary');
assert.ok(
  !existsSync('src/components/PasswordGate.tsx'),
  'obsolete client password gate must be removed'
);

const deployWorkflow = read('.github/workflows/deploy-cloudflare.yml');
const securityWorkflow = read('.github/workflows/security-foundation-ci.yml');
assert.doesNotMatch(deployWorkflow, /VITE_APP_PASSWORD/,
  'Cloudflare deployment must not inject an obsolete client password');
assert.doesNotMatch(securityWorkflow, /VITE_APP_PASSWORD/,
  'security CI must not inject an obsolete client password');
assert.ok(
  !existsSync('.github/workflows/deploy.yml'),
  'Studio must have a single production deployment path; GitHub Pages deploy must remain removed'
);

assert.ok(
  existsSync('supabase/functions/_shared/requireOperator.ts'),
  'shared Edge Function operator authorization helper must exist'
);
const operatorAuth = existsSync('supabase/functions/_shared/requireOperator.ts')
  ? read('supabase/functions/_shared/requireOperator.ts')
  : '';
assert.match(operatorAuth, /studio_operators/,
  'Edge Function authorization must verify Studio operator membership');

const publishPin = read('supabase/functions/publish-pin/index.ts');
const generateContent = read('supabase/functions/generate-content/index.ts');
assert.match(authStart, /requireOperator/,
  'auth_start must require an authorized Studio operator');
assert.match(publishPin, /requireOperator/,
  'publish-pin must require an authorized Studio operator');
assert.match(generateContent, /requireOperator/,
  'generate-content must require an authorized Studio operator');
assert.match(authCallback, /user_id/,
  'OAuth callback must bind state to the operator who started the flow');
assert.match(hook, /functions\.invoke\(['"]auth_start['"]/,
  'browser must start OAuth through authenticated Edge Function invocation');

const functionConfig = read('supabase/config.toml');
assert.match(functionConfig, /\[functions\.auth_start\][\s\S]*verify_jwt\s*=\s*true/,
  'auth_start must require JWT verification');
assert.match(functionConfig, /\[functions\.auth_callback\][\s\S]*verify_jwt\s*=\s*false/,
  'auth_callback must remain callable by provider redirect and rely on one-time state');
assert.match(functionConfig, /\[functions\."?publish-pin"?\][\s\S]*verify_jwt\s*=\s*true/,
  'publish-pin must require JWT verification');
assert.match(functionConfig, /\[functions\."?generate-content"?\][\s\S]*verify_jwt\s*=\s*true/,
  'generate-content must require JWT verification');

const generateClient = read('src/lib/generateContent.ts');
const publishClient = read('src/hooks/usePublishPipeline.ts');

assert.doesNotMatch(generateClient, /VITE_SUPABASE_ANON_KEY/,
  'AI generation must not authenticate privileged functions with the public anon key');
assert.match(generateClient, /functions\.invoke\(['"]generate-content['"]/,
  'AI generation must use the authenticated Supabase function client');

assert.doesNotMatch(publishClient, /VITE_SUPABASE_ANON_KEY/,
  'publishing must not authenticate privileged functions with the public anon key');
assert.match(publishClient, /functions\.invoke\(['"]publish-pin['"]/,
  'publishing must use the authenticated Supabase function client');
assert.doesNotMatch(publishClient, /imageUrl:\s*output\.thumbnailConcept/,
  'Pinterest publishing must never use thumbnail concept text as media');
assert.match(publishClient, /output\.mediaUrl/,
  'Pinterest publishing must use a dedicated media URL field');
assert.match(publishPin, /Pinterest media URL must use HTTPS/,
  'publish-pin must enforce HTTPS media URLs server-side');

assert.match(oauthConfig, /https:\/\/www\.instagram\.com\/oauth\/authorize/,
  'Instagram must use current Instagram Business Login authorization endpoint');
assert.match(oauthConfig, /instagram_business_basic/,
  'Instagram must request current professional-account basic scope');
assert.match(oauthConfig, /instagram_business_content_publish/,
  'Instagram must request current content publishing scope');
assert.doesNotMatch(oauthConfig, /user_profile,user_media/,
  'legacy Instagram Basic Display-style scopes must be removed');

assert.match(oauthConfig, /openid profile email w_member_social/,
  'LinkedIn must use current OIDC identity scopes plus member publishing permission');
assert.match(authCallback, /api\.linkedin\.com\/v2\/userinfo/,
  'LinkedIn profile lookup must use the current OIDC userinfo endpoint');
assert.match(authCallback, /ig_exchange_token/,
  'Instagram short-lived token must be upgraded server-side before storage');

assert.match(generateContent, /studio-ai-gateway\.s-jade0131\.workers\.dev\/generate/,
  'AI generation must route through the dedicated Cloudflare AI gateway');
assert.doesNotMatch(generateContent, /api\.openai\.com|OPENAI_API_KEY|OPENAI_MODEL/,
  'Supabase generate-content must not call OpenAI directly');

assert.ok(
  existsSync('cloudflare/studio-ai-gateway/worker.js'),
  'Cloudflare AI gateway source must be tracked in the repository'
);
assert.ok(
  existsSync('cloudflare/studio-ai-gateway/wrangler.toml'),
  'Cloudflare AI gateway Wrangler config must be tracked in the repository'
);
const aiWorker = read('cloudflare/studio-ai-gateway/worker.js');
const aiWorkerConfig = read('cloudflare/studio-ai-gateway/wrangler.toml');
assert.match(aiWorker, /env\.AI\.run/,
  'Cloudflare AI gateway must use the Workers AI binding');
assert.match(aiWorker, /@cf\/meta\/llama-3\.3-70b-instruct-fp8-fast/,
  'Cloudflare AI gateway must use the verified JSON-capable model');
assert.match(aiWorker, /response_format:\{type:"json_schema"/,
  'Cloudflare AI gateway must request structured JSON output');
assert.match(aiWorker, /studio_operators/,
  'Cloudflare AI gateway must verify Studio operator membership');
assert.match(aiWorker, /items\.length!==count/,
  'Cloudflare AI gateway must reject incomplete generated content sets');
assert.match(aiWorkerConfig, /\[ai\][\s\S]*binding\s*=\s*"AI"/,
  'Wrangler config must bind Workers AI as AI');
assert.match(aiWorkerConfig, /\[observability\][\s\S]*enabled\s*=\s*true/,
  'Cloudflare AI gateway observability must remain enabled');

assert.ok(
  existsSync('supabase/functions/_shared/pinterestCredentials.ts'),
  'Pinterest credential lifecycle helper must exist'
);
const pinterestCredentials = existsSync('supabase/functions/_shared/pinterestCredentials.ts')
  ? read('supabase/functions/_shared/pinterestCredentials.ts')
  : '';
assert.match(authCallback, /Authorization:\s*`Basic/,
  'Pinterest authorization-code exchange must use HTTP Basic app authentication');
assert.match(authCallback, /refresh_token_expires_at/,
  'Pinterest refresh-token expiry must be persisted');
assert.match(pinterestCredentials, /grant_type.*refresh_token/s,
  'Pinterest helper must refresh access tokens server-side');
assert.match(pinterestCredentials, /Authorization:\s*`Basic/,
  'Pinterest refresh must use HTTP Basic app authentication');
assert.match(pinterestCredentials, /oauth_credentials/,
  'Pinterest refreshed credentials must stay in server-only storage');
assert.match(publishPin, /getPinterestAccessToken/,
  'Pinterest publishing must obtain a current access token through the lifecycle helper');

console.log('security contract: PASS');
