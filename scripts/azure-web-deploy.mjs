/**
 * Create the Free Azure Static Web App for https://lekki.co.za and upload the
 * built public site. Requires `az login` as islater88@outlook.com first.
 *
 * Does not change GoDaddy. Prints the Azure DNS nameservers to paste there.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const RG = 'rg-lekki-web';
const APP = 'lekki-co-za';
const LOCATION = 'westeurope';
const DOMAIN = 'lekki.co.za';
const OUTPUT = 'apps/web/dist/web/browser';

function az(args) {
  return execFileSync('az', args, { encoding: 'utf8' }).trim();
}

function azJson(args) {
  const raw = az([...args, '-o', 'json']);
  return raw ? JSON.parse(raw) : null;
}

const account = azJson(['account', 'show']);
if (!account?.id) {
  console.error('Azure CLI is not signed in. Run: az login');
  process.exit(1);
}

const user = account.user?.name ?? '';
console.log(`Subscription: ${account.name} (${account.id})`);
console.log(`Signed in as: ${user}`);
if (user.toLowerCase() !== 'islater88@outlook.com') {
  console.error('Sign in as islater88@outlook.com before creating Lekki resources.');
  console.error('Run: az logout && az login');
  process.exit(1);
}

if (!existsSync(`${OUTPUT}/index.html`) || !existsSync(`${OUTPUT}/staticwebapp.config.json`)) {
  console.error(`Missing build output in ${OUTPUT}. Run: pnpm --filter @lekki/web run build`);
  process.exit(1);
}

az(['group', 'create', '--name', RG, '--location', LOCATION, '--output', 'none']);

const existing = azJson([
  'staticwebapp',
  'list',
  '--query',
  `[?name=='${APP}'] | [0]`,
]);

if (!existing?.name) {
  az([
    'staticwebapp',
    'create',
    '--name',
    APP,
    '--resource-group',
    RG,
    '--location',
    LOCATION,
    '--sku',
    'Free',
    '--output',
    'none',
  ]);
}

const token = az([
  'staticwebapp',
  'secrets',
  'list',
  '--name',
  APP,
  '--resource-group',
  RG,
  '--query',
  'properties.apiKey',
  '-o',
  'tsv',
]);

execFileSync(
  'npx',
  ['--yes', '@azure/static-web-apps-cli', 'deploy', OUTPUT, '--deployment-token', token, '--env', 'production'],
  { stdio: 'inherit' },
);

az([
  'network',
  'dns',
  'zone',
  'create',
  '--resource-group',
  RG,
  '--name',
  DOMAIN,
  '--output',
  'none',
]);

const nameservers = azJson([
  'network',
  'dns',
  'zone',
  'show',
  '--resource-group',
  RG,
  '--name',
  DOMAIN,
  '--query',
  'nameServers',
]);

const host = azJson([
  'staticwebapp',
  'show',
  '--name',
  APP,
  '--resource-group',
  RG,
  '--query',
  'defaultHostname',
]);

console.log('');
console.log(`Site: https://${host}`);
console.log('');
console.log('In GoDaddy, open lekki.co.za → Nameservers → Change, and enter:');
for (const ns of nameservers) console.log(`  ${ns}`);
console.log('');
console.log('After those nameservers answer for lekki.co.za, bind the custom domains from Azure.');
