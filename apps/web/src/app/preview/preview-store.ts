import type { PreviewTable } from './preview-table';

/** The one sample table the preview page is showing. */
let current: PreviewTable | null = null;

export function currentPreviewTable(): PreviewTable | null {
  return current;
}

export function setPreviewTable(table: PreviewTable | null) {
  current = table;
}
