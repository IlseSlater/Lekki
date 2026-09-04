import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB_DIST = path.join(ROOT, 'apps', 'web', 'dist', 'web', 'browser');

const children = [];

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, ...opts.env },
    shell: true,
    stdio: opts.stdio ?? ['ignore', 'pipe', 'pipe'],
  });
  if (opts.stdio !== 'inherit') {
    child.stdout?.on('data', (d) => process.stdout.write(`[${opts.label ?? cmd}] ${d}`));
    child.stderr?.on('data', (d) => process.stderr.write(`[${opts.label ?? cmd}] ${d}`));
  }
  children.push(child);
  return child;
}

async function waitHttp(url, ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 304) return;
    } catch {
      // retry
    }
    await delay(1000);
  }
  throw new Error(`Timeout: ${url}`);
}

async function runToCompletion(label, cmd, args) {
  const child = run(cmd, args, { label, stdio: 'inherit' });
  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0) throw new Error(`${label} exited ${code}`);
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      // ignore
    }
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = new Set(
        out
          .split('\n')
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid) && pid !== '0'),
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // port free
  }
}

try {
  killPort(3000);
  killPort(4200);
  console.log('Building runtime + web for evidence…');
  const tsbuildinfo = path.join(ROOT, 'apps', 'runtime', 'tsconfig.tsbuildinfo');
  if (fs.existsSync(tsbuildinfo)) fs.unlinkSync(tsbuildinfo);
  await runToCompletion('runtime-build', 'pnpm', ['--filter', '@lekki/runtime-app', 'build']);
  await runToCompletion('web-build', 'pnpm', ['--filter', '@lekki/web', 'build']);

  const runtime = run('pnpm', ['--filter', '@lekki/runtime-app', 'start'], { label: 'runtime' });
  const web = run(
    'npx',
    ['-y', 'serve', WEB_DIST, '-l', '4200', '-s'],
    { label: 'web' },
  );

  await waitHttp('http://localhost:3000/profiles');
  await waitHttp('http://localhost:4200/');

  const evidence = spawn('node', ['scripts/teardown-evidence.mjs'], {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env },
  });
  const code = await new Promise((resolve) => evidence.on('close', resolve));
  shutdown();
  process.exit(code ?? 1);
} catch (err) {
  console.error(err);
  shutdown();
  process.exit(1);
}
