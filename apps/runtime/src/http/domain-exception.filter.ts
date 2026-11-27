import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { mapDomainError } from '../leos/error-mapping';

/**
 * The single place a thrown value becomes an HTTP response.
 *
 * Nest's own HttpException subclasses pass through with their status intact —
 * SessionAccessService already returns a correct 401 and this filter must not
 * second-guess it. Everything else goes through the pure mapDomainError, so the
 * mapping stays unit-testable without Nest or a database.
 *
 * Every error body carries a correlationId. It is echoed from the request when
 * the caller supplied one, so a guest report can be traced to a log line.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(DomainExceptionFilter.name);

  catch(err: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const header = req?.headers?.['x-correlation-id'];
    const correlationId =
      (typeof header === 'string' && header.trim()) || randomUUID();

    if (err instanceof HttpException) {
      const status = err.getStatus();
      const body = err.getResponse();
      res.status(status).json(
        typeof body === 'string'
          ? { status, code: 'http_error', message: body, correlationId }
          : { status, ...(body as Record<string, unknown>), correlationId },
      );
      return;
    }

    const mapped = mapDomainError(err);
    if (mapped.status >= 500) {
      // The wire text is fixed on purpose; the cause stays in our log, tied to the correlationId.
      this.log.error(
        `${req?.method} ${req?.url} correlationId=${correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    res.status(mapped.status).json({ ...mapped, correlationId });
  }
}
