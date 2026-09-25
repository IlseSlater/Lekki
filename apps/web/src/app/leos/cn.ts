export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

/** Merge class names. Complete Tailwind names only — never interpolate utility stems. */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(8)
    .filter((v): v is string | number => typeof v === 'string' || typeof v === 'number')
    .join(' ');
}
