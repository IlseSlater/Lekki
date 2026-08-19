export type Permission =

  | 'session.read'

  | 'session.write'

  | 'session.close'

  | 'transaction.create'

  | 'transaction.read'

  | 'fulfilment.read'

  | 'fulfilment.update'

  /** @deprecated prefer fulfilment.update — accepted as alias */

  | 'fulfilment.write'

  | 'payment.request'

  | 'payment.complete'

  | 'staff.service'

  | 'venue.manage'

  | 'organisation.manage';



export interface StaffPrincipal {

  id: string;

  organisationId: string;

  displayName: string;

  role: string;

  permissions: Permission[];

  sessionId?: string;

}



export interface GuestPrincipal {

  identityId: string;

  displayName: string;

  consentGranted: boolean;

}



export type Principal = StaffPrincipal | GuestPrincipal;



export function isStaffPrincipal(p: Principal): p is StaffPrincipal {

  return 'permissions' in p && 'organisationId' in p;

}



/** Normalize Team UI aliases to contract permissions. */

export function normalizePermission(p: string): string {

  if (p === 'fulfilment.write') return 'fulfilment.update';

  return p;

}



export function hasPermission(perms: string[] | undefined, need: string): boolean {

  const list = (perms ?? []).map(normalizePermission);

  const want = normalizePermission(need);

  return list.includes(want);

}


