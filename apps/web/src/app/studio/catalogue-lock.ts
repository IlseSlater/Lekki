/** Catalogue on the desk: fail closed. Samples only when a design route opts in. */

export function resolveCatalogueLock(input: { live: boolean; slug: string }): {
  lockCatalogue: boolean;
  allowExampleCatalogue: boolean;
} {
  if (input.slug === 'menu') {
    return { lockCatalogue: false, allowExampleCatalogue: false };
  }
  const allowExampleCatalogue = !input.live && input.slug === 'experience';
  return {
    allowExampleCatalogue,
    lockCatalogue: !allowExampleCatalogue,
  };
}

export type StudioLivePhone = {
  mode: 'arrival' | 'pay' | 'shell';
  publicLive: boolean;
  lockCatalogue: boolean;
  allowExampleCatalogue: boolean;
};

/** Live phone on a Studio URL — menu editor shows browse, not arrival. */
export function studioLivePhone(input: { url: string; live: boolean }): StudioLivePhone {
  const path = (input.url.split('?')[0] || '').split('#')[0] || '';
  if (path.includes('/studio/menu')) {
    const lock = resolveCatalogueLock({ live: input.live, slug: 'menu' });
    return { mode: 'shell', publicLive: input.live, ...lock };
  }
  const match = /\/studio\/setup\/([^/]+)$/.exec(path) ?? /\/studio\/setup\/([^/?#]+)/.exec(path);
  const onCreate = path.includes('/studio/create');
  const slug = match?.[1] ?? (onCreate ? 'experience' : 'identity');
  const lock = resolveCatalogueLock({
    live: input.live,
    slug: match?.[1] ?? (onCreate ? 'experience' : ''),
  });
  if (slug === 'payments') {
    return { mode: 'pay', publicLive: false, ...lock };
  }
  if (slug === 'identity' || slug === 'places') {
    return { mode: 'arrival', publicLive: false, ...lock };
  }
  return {
    mode: 'shell',
    publicLive: slug === 'golive' || input.live,
    ...lock,
  };
}

export function catalogueEditorCopy(input: {
  itemNoun?: string;
  count: number;
}): {
  purposeList: string;
  purposeEdit: string;
  addLabel: string;
  listHint: string;
} {
  const item = (input.itemNoun || 'Item').trim() || 'Item';
  const lc = item.toLowerCase();
  return {
    purposeList: 'What can guests order?',
    purposeEdit: `Tell guests about this ${lc}`,
    addLabel: input.count ? `Add a ${lc}` : `Add the first ${lc}`,
    listHint: input.count
      ? `Tap a ${lc} to change it — or mark what’s off tonight.`
      : `Add a priced ${lc} so guests can order.`,
  };
}
