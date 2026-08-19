import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const runtime = spawn(
  'pnpm',
  ['--filter', '@lekki/runtime-app', 'start'],
  {
    cwd: process.cwd(),
    env: { ...process.env },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

runtime.stdout.on('data', (d) => process.stdout.write(`[runtime] ${d}`));
runtime.stderr.on('data', (d) => process.stderr.write(`[runtime] ${d}`));

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://localhost:3000/profiles');
      if (res.ok) return;
    } catch {
      // wait
    }
    await delay(1000);
  }
  throw new Error('Runtime did not become ready');
}

try {
  await waitReady();
  const e2e = spawn('node', ['scripts/e2e-heartbeat.mjs'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit',
  });
  const code = await new Promise((resolve) => e2e.on('close', resolve));
  runtime.kill();
  process.exit(code ?? 1);
} catch (err) {
  console.error(err);
  runtime.kill();
  process.exit(1);
}
