/**
 * Studio Grow — Feedback breath.
 * One sentiment sentence · at most one flagged comment. Never a review console.
 */

export type FeedbackTone = 'delighted' | 'concern';

export type FeedbackMemory = {
  tones: FeedbackTone[];
  flagged?: {
    id: string;
    text: string;
    guestFirstName: string;
    canReply: boolean;
  } | null;
  participantNounPlural: string;
};

export type FeedbackCopy = {
  sentiment: 'delighted' | 'mixed' | 'quiet';
  sentimentLine: string;
  flaggedLine: string;
  replyLabel: string;
};

/** Guest → AssistanceRequest.message payload. */
export function encodeFeedbackMessage(tone: FeedbackTone, text?: string): string {
  const clean = (text ?? '').trim().slice(0, 280);
  if (tone === 'delighted') return JSON.stringify({ tone: 'delighted' });
  return JSON.stringify({ tone: 'concern', ...(clean ? { text: clean } : {}) });
}

export function parseFeedbackMessage(
  raw: string | null | undefined,
): { tone: FeedbackTone; text: string } | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { tone?: string; text?: string };
    if (o.tone === 'delighted') return { tone: 'delighted', text: '' };
    if (o.tone === 'concern' || o.tone === 'mixed') {
      return { tone: 'concern', text: typeof o.text === 'string' ? o.text.trim() : '' };
    }
  } catch {
    /* plain-text fallback */
  }
  const t = raw.trim();
  if (!t) return null;
  if (/^delighted$/i.test(t)) return { tone: 'delighted', text: '' };
  return { tone: 'concern', text: t };
}

export function composeFeedbackCopy(m: FeedbackMemory): FeedbackCopy {
  const people = m.participantNounPlural || 'Guests';
  const replyLabel = 'Got it';

  if (!m.tones.length) {
    return {
      sentiment: 'quiet',
      sentimentLine: 'Quiet night — no feedback yet.',
      flaggedLine: '',
      replyLabel,
    };
  }

  const hasConcern = m.tones.some((t) => t === 'concern');
  const allDelighted = m.tones.every((t) => t === 'delighted');

  let sentiment: FeedbackCopy['sentiment'];
  let sentimentLine: string;
  if (allDelighted) {
    sentiment = 'delighted';
    sentimentLine = `${capitalize(people)} were delighted.`;
  } else if (hasConcern) {
    sentiment = 'mixed';
    sentimentLine = `${capitalize(people)} had mixed feelings.`;
  } else {
    sentiment = 'quiet';
    sentimentLine = 'Quiet night — no feedback yet.';
  }

  let flaggedLine = '';
  if (m.flagged?.text) {
    const who = m.flagged.guestFirstName?.trim() || 'A guest';
    flaggedLine = `${who} said: “${m.flagged.text}”`;
  }

  return { sentiment, sentimentLine, flaggedLine, replyLabel };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
