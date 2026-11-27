/**
 * After the meal, every guest gets the same three choices at equal weight:
 * a Google review, a private note to the manager, and sending the place to a friend.
 */

/** A review link is shown only when it is a secure web address. */
export function safeReviewUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function friendShareText(placeName: string): string {
  const name = placeName.trim();
  return name ? `Have a look at ${name}` : 'Have a look at this place';
}

/** WhatsApp opens its own share sheet. The text carries the link. */
export function whatsappShareUrl(text: string, link: string): string {
  const body = link ? `${text} ${link}` : text;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

/** Venue-side setting kept inside the guest design the guest already receives. */
export function googleReviewUrlFrom(design: Record<string, unknown> | null | undefined): string {
  return safeReviewUrl(design?.['googleReviewUrl']);
}
