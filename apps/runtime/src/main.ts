import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import tls from 'node:tls';
import { json, urlencoded, static as expressStatic, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './http/domain-exception.filter';
import { assertRuntimeSecrets } from './leos/runtime-secrets';
import { resolveCorsOrigins } from './leos/cors-origins';
import { getAssetRoot } from './leos/assets/local-disk-asset-store';

for (const candidate of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(candidate)) {
    loadEnvFile(candidate);
    break;
  }
}

/**
 * Node's bundled Mozilla store often misses the Windows enterprise roots
 * (SSL inspection). PayFast validate then fails with UNABLE_TO_GET_ISSUER_CERT_LOCALLY.
 * Feature-detected — no-op on Node < 22.15.
 */
function trustOsCertificateAuthorities() {
  const tlsApi = tls as typeof tls & {
    getCACertificates?: (type?: string) => string[];
    setDefaultCACertificates?: (certs: readonly string[]) => void;
  };
  if (!tlsApi.getCACertificates || !tlsApi.setDefaultCACertificates) return;
  try {
    tlsApi.setDefaultCACertificates([
      ...tlsApi.getCACertificates(),
      ...tlsApi.getCACertificates('system'),
    ]);
  } catch {
    /* keep bundled CAs */
  }
}
trustOsCertificateAuthorities();

/** Prefer real Wi‑Fi/LAN (192.168 / 10) over WSL/Docker (172.x). */
function lanIpv4(): string | null {
  const nets = networkInterfaces();
  const candidates: string[] = [];
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
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
  assertRuntimeSecrets(process.env);
  const corsOrigins = resolveCorsOrigins(process.env);
  if (process.env.NODE_ENV !== 'production') {
    const lan = lanIpv4();
    if (lan) {
      const lanWeb = `http://${lan}:4200`;
      if (!corsOrigins.includes(lanWeb)) corsOrigins.push(lanWeb);
    }
    for (const extra of ['http://127.0.0.1:4200']) {
      if (!corsOrigins.includes(extra)) corsOrigins.push(extra);
    }
  }

  const app = await NestFactory.create(AppModule, { cors: false, bodyParser: false });
  const port = Number(process.env.RUNTIME_PORT ?? 3000);

  app.use(
    helmet({
      // Allow Angular ( :4200 ) to display runtime asset images.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(json({ limit: '256kb' }));
  app.use(urlencoded({ extended: true, limit: '256kb' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(30_000);
    res.setTimeout(30_000);
    next();
  });

  // No global API prefix — /assets sits beside routes, not under /api.
  const assetRoot = getAssetRoot();
  mkdirSync(assetRoot, { recursive: true });
  app.use(
    '/assets',
    expressStatic(assetRoot, {
      fallthrough: false,
      index: false,
      maxAge: '7d',
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const http = app.getHttpAdapter().getInstance();
    http.get('/dev/lan', (_req: unknown, res: { json: (b: unknown) => void }) => {
      res.json({ host: lanIpv4() });
    });
  }

  await app.listen(port, '0.0.0.0');
  const lan = lanIpv4();
  console.log(`LEOS runtime listening on http://localhost:${port}`);
  if (lan) {
    console.log(`LEOS runtime on LAN     http://${lan}:${port}`);
    console.log(`Open Studio on LAN      http://${lan}:4200  (QR codes for phones)`);
  }
}

process.on('unhandledRejection', (reason) => {
  const stack =
    reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  console.error(`[LEOS] unhandledRejection — ${stack}`);
});

bootstrap();
