/** Catalogue on the desk: fail closed. Samples only when a design route opts in. */

export function resolveCatalogueLock(input: { live: boolean; slug: string }): {
  lockCatalogue: boolean;
  allowExampleCatalogue: boolean;
} {
  const allowExampleCatalogue = !input.live && input.slug === 'experience';
  return {
    allowExampleCatalogue,
    lockCatalogue: !allowExampleCatalogue,
  };
}
