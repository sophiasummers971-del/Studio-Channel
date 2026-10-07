import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const hook = read('src/hooks/useAccountConnections.ts');
const connections = read('src/views/ConnectionsView.tsx');
const passwordGate = read('src/components/PasswordGate.tsx');
const authStart = read('supabase/functions/auth_start/index.ts');
const authCallback = read('supabase/functions/auth_callback/index.ts');
const oauthConfig = read('supabase/functions/_shared/config.ts');

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
assert.doesNotMatch(authCallback, /access_token:\s*tokenData\.access_token[\s\S]*account_connections/,
  'auth_callback must not place OAuth credentials in account_connections');

assert.match(oauthConfig, /OAUTH_CALLBACK_URL/,
  'OAuth config must use one server-side callback URL');
assert.match(oauthConfig, /boards:write/,
  'Pinterest OAuth scopes must include boards:write because publish-pin can create boards');

console.log('security contract: PASS');
