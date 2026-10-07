import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const hook = read('src/hooks/useAccountConnections.ts');
const connections = read('src/views/ConnectionsView.tsx');
const passwordGate = read('src/components/PasswordGate.tsx');
const authStart = read('supabase/functions/auth_start/index.ts');
const authCallback = read('supabase/functions/auth_callback/index.ts');
const oauthConfig = read('supabase/functions/_shared/config.ts');
const main = read('src/main.tsx');

assert.ok(
  existsSync('supabase/migrations/20261007090000_secure_oauth_credentials.sql'),
  'secure OAuth migration must exist'
);

assert.doesNotMatch(hook, /access_token|refresh_token|accessToken|refreshToken/,
  'browser hook must never read or write OAuth tokens');
assert.doesNotMatch(hook, /connectManual/,
  'manual credential connection path must be removed from browser hook');

assert.doesNotMatch(connections, /Access token \(optional\)|Paste token|Manual entry/,
  'connections UI must not accept manual OAuth tokens');

assert.doesNotMatch(passwordGate, /channel-studio-2026/,
  'client bundle must not contain a fallback application password');

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
  existsSync('supabase/migrations/20261007093000_owner_auth_rls.sql'),
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

console.log('security contract: PASS');
