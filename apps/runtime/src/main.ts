import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

for (const candidate of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(candidate)) {
    loadEnvFile(candidate);
    break;
  }
}

/** Prefer real Wi‑Fi/LAN (192.168 / 10) over WSL/Docker (172.x). */
function lanIpv4(): string | null {
  const nets = networkInterfaces();
  const candidates: string[] = [];
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      // Node types vary: family may be 'IPv4' or (older) numeric 4.
      const family = String(net.family);
      if ((family !== 'IPv4' && family !== '4') || net.internal) continue;
      candidates.push(net.address);
    }
  }
  const preferred =
    candidates.find((a) => a.startsWith('192.168.')) ??
    candidates.find((a) => a.startsWith('10.')) ??
    candidates.find((a) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(a)) ??
    candidates[0];
  return preferred ?? null;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = Number(process.env.RUNTIME_PORT ?? 3000);
  // Reflect request origin so phone → LAN IP:4200 can call API (dev).
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const http = app.getHttpAdapter().getInstance();
  http.get('/dev/lan', (_req: unknown, res: { json: (b: unknown) => void }) => {
    res.json({ host: lanIpv4() });
  });

  await app.listen(port, '0.0.0.0');
  const lan = lanIpv4();
  console.log(`LEOS runtime listening on http://localhost:${port}`);
  if (lan) {
    console.log(`LEOS runtime on LAN     http://${lan}:${port}`);
    console.log(`Open Studio on LAN      http://${lan}:4200  (QR codes for phones)`);
  }
}

bootstrap();
