import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const RUNTIME_PORT = Number(process.env.RUNTIME_PORT ?? 3000);

function run(label, command, args, { colorFn } = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefix = colorFn ? colorFn(`[${label}]`) : `[${label}]`;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) out.write(`${prefix} ${line}\n`);
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  return child;
}

const color = (code) => (text) => `\x1b[${code}m${text}\x1b[0m`;
const cyan = color(36);
const magenta = color(35);
const yellow = color(33);

async function runToCompletion(label, command, args) {
  const child = run(label, command, args, { colorFn: yellow });
  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0) {
    throw new Error(`${label} exited with code ${code}`);
  }
}

async function waitForPostgres() {
  for (let i = 0; i < 60; i++) {
    const check = spawn(
      'docker',
      ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'lekki'],
      { cwd: process.cwd(), shell: true, stdio: 'ignore' },
    );
    const code = await new Promise((resolve) => check.on('close', resolve));
    if (code === 0) return;
    await delay(1000);
  }
  throw new Error('Postgres did not become ready');
}

const children = [];
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
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

try {
  console.log(yellow('[dev]'), 'Starting Postgres...');
  await runToCompletion('db:up', 'docker', ['compose', 'up', '-d', 'postgres']);
  await waitForPostgres();

  console.log(yellow('[dev]'), 'Generating Prisma client + pushing schema...');
  await runToCompletion('db:generate', 'pnpm', ['run', 'db:generate']);
  await runToCompletion('db:push', 'pnpm', ['run', 'db:push']);

  // Workspace packages resolve via their built dist output, so build them once
  // before starting the runtime/web watchers.
  console.log(yellow('[dev]'), 'Building workspace packages...');
  await runToCompletion('build:packages', 'pnpm', ['run', 'build:packages']);

  console.log(yellow('[dev]'), 'Starting runtime + web (Ctrl+C to stop)...');
  const runtime = run('runtime', 'pnpm', ['run', 'dev:runtime'], { colorFn: cyan });
  const web = run('web', 'pnpm', ['run', 'dev:web'], { colorFn: magenta });
  children.push(runtime, web);

  const onExit = (label) => (code) => {
    console.log(yellow('[dev]'), `${label} exited (${code}); shutting down.`);
    shutdown();
    process.exit(code ?? 0);
  };
  runtime.on('close', onExit('runtime'));
  web.on('close', onExit('web'));

  console.log(
    yellow('[dev]'),
    `Runtime: http://localhost:${RUNTIME_PORT}  |  Web: http://localhost:4200`,
  );
} catch (err) {
  console.error(yellow('[dev]'), err.message);
  shutdown();
  process.exit(1);
}
