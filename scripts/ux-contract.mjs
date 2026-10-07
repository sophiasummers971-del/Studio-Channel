import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const sidebar = read('src/components/Sidebar.tsx');
const dashboard = read('src/views/DashboardHome.tsx');
const contentHook = read('src/hooks/useContentData.ts');
const topbar = read('src/components/TopBar.tsx');
const app = read('src/App.tsx');
const styles = read('src/index.css');

for (const label of ['Home', 'Create', 'Approvals', 'Publish', 'Accounts']) {
  assert.match(sidebar, new RegExp(`label: ['"]${label}['"]`),
    `primary navigation must include ${label}`);
}

assert.match(sidebar, /System/,
  'engineering and deployment tools must live under a System section');
assert.match(sidebar, /systemOpen/,
  'System navigation must be collapsible by default');

assert.doesNotMatch(dashboard, /MOCK_CONTENT/,
  'Home dashboard must not present mock content as live workflow state');
assert.match(dashboard, /useContentData/,
  'Home dashboard must use the real content data hook');
assert.match(dashboard, /useAccountConnections/,
  'Home dashboard must expose actual account connection status');
assert.doesNotMatch(contentHook, /MOCK_CONTENT/,
  'live content hook must never substitute mock rows for an empty or unavailable production database');
assert.match(contentHook, /useState<ContentItem\[\]>\(\[\]\)/,
  'live content state must start empty rather than with demo rows');

assert.match(topbar, /onNewContent/,
  'top bar must accept a working new-content action');
assert.match(app, /onNewContent=\{\(\) => handleNavigate\('content-generator'\)\}/,
  'App must wire New Content to the real generator');

const authGate = read('src/components/AuthGate.tsx');
assert.match(authGate, /shouldCreateUser:\s*true/,
  'AuthGate must allow first owner identity bootstrap while RLS/operator membership remains the authorization boundary');

assert.match(app, /bg-\[#05070b\]/,
  'Studio application shell must use the full dark theme');
assert.match(styles, /--studio-bg:/,
  'Studio theme tokens must exist');
assert.match(styles, /--studio-cyan:/,
  'Studio cyber accent token must exist');
assert.doesNotMatch(app, /bg-slate-50/,
  'application shell must not use the light background');
assert.match(authGate, /SECURE OPERATOR ACCESS/,
  'AuthGate must use the unified Studio operator presentation');

console.log('ux contract: PASS');
