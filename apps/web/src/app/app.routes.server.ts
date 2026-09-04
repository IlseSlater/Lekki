import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Batch 7 fork (documented in docs/teardown-batches.md):
 * Prerender public marketing HTML for crawlers. Guest / Studio / Operate stay
 * client-rendered (never indexed — robots.txt already disallows them).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
