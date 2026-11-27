import { HttpErrorResponse, HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { answerPreviewRequest } from './preview-routes';
import { guestPreviewActive } from './preview-storage';
import { currentPreviewTable } from './preview-store';

/**
 * In Studio's preview phone, the guest app talks to a sample table instead of a
 * real one. Reads of the venue and menu still reach the API; writes never do.
 */
export const guestPreviewInterceptor: HttpInterceptorFn = (req, next) => {
  if (!guestPreviewActive()) return next(req);
  const answer = answerPreviewRequest(currentPreviewTable(), req.method, req.urlWithParams, req.body);
  if (!answer.handled) return next(req);
  const body = JSON.parse(JSON.stringify(answer.body ?? null));
  if (answer.status >= 400) {
    return throwError(() => new HttpErrorResponse({ status: answer.status, error: body, url: req.url }));
  }
  return of(new HttpResponse({ status: answer.status, body, url: req.url }));
};
