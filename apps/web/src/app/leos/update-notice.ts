/** What a service worker update event means for the person holding the phone. */
export type UpdateNotice = 'ready' | 'broken' | null;

export function noticeForVersionEvent(evt: { type?: string } | null | undefined): UpdateNotice {
  return evt?.type === 'VERSION_READY' ? 'ready' : null;
}

export const UPDATE_COPY: Record<Exclude<UpdateNotice, null>, string> = {
  ready: 'A newer version is ready.',
  broken: 'Something got out of date on this phone.',
};
