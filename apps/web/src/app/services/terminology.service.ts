import { Injectable, inject } from '@angular/core';
import { SessionStateService } from './leos-api.service';

/** Profile-driven labels — Experience Grammar uses pack terminology, not hardcoded nouns. */
@Injectable({ providedIn: 'root' })
export class TerminologyService {
  private readonly session = inject(SessionStateService);

  term(key: string, fallback: string): string {
    return this.session.terminology[key] ?? fallback;
  }
}
