/**
 * Imported first by main.ts so it runs before any other module touches storage.
 * Studio's preview phone (/preview) gets its own throwaway storage.
 */
import { installPreviewStorage, isPreviewPath } from './preview-storage';

if (typeof window !== 'undefined' && isPreviewPath(window.location.pathname)) {
  installPreviewStorage(window);
}
