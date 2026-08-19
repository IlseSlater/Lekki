import { useState } from "react";

const STEPS = [
  "Choose what you’re creating",
  "Name the place",
  "Shape the experience",
  "Define places",
  "Connect payments",
  "Go live",
] as const;

/**
 * Studio Welcome — create an experience (from apps/web studio-welcome.page.ts).
 */
export const StudioWelcome = () => {
  const [continued, setContinued] = useState(false);
  const [homePulse, setHomePulse] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--leos-warm-sand)] px-6 py-12 font-[family-name:var(--leos-font-sans)] text-[var(--leos-neutral-dark)]">
      <article className="w-full max-w-xl flex flex-col gap-6">
        <header>
          <p className="mb-3 text-[0.6875rem] font-bold tracking-[0.14em] uppercase text-[var(--leos-emerald)]">
            LEOS Studio
          </p>
          <h1 className="m-0 text-[2.25rem] font-semibold leading-tight tracking-tight md:text-[2.75rem]">
            Let’s create your first experience.
          </h1>
          <p className="mt-3 mb-0 max-w-lg text-lg leading-relaxed text-[var(--leos-neutral-muted)]">
            A few calm steps — then guests can scan a QR and join.
          </p>
        </header>

        <div className="rounded-[24px] border border-[var(--leos-warm-sand-dark)] bg-[var(--leos-surface-ambient)] p-8 shadow-[var(--leos-shadow-emerald)]">
          <ol className="m-0 list-decimal space-y-3 pl-5 text-base leading-relaxed text-[var(--leos-neutral-dark)]">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-6 mb-0 text-[var(--leos-neutral-muted)]">
            Most teams finish in under ten minutes.
          </p>

          {continued ? (
            <p
              className="mt-5 rounded-xl bg-[var(--leos-success-bg)] px-3 py-2 text-sm text-[var(--leos-success)]"
              role="status"
            >
              Next: Choose what you’re creating — Studio Create.
            </p>
          ) : null}
          {homePulse ? (
            <p
              className="mt-5 rounded-xl bg-[var(--leos-emerald-soft)] px-3 py-2 text-sm text-[var(--leos-emerald)]"
              role="status"
            >
              Back to Studio Home (demo).
            </p>
          ) : null}
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-[var(--leos-warm-sand-dark)] pt-6">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--leos-warm-sand-dark)] bg-transparent px-5 py-3 text-[0.9375rem] font-semibold transition hover:bg-[var(--leos-warm-sand)]"
            onClick={() => {
              setHomePulse(true);
              setContinued(false);
            }}
          >
            Home
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--leos-emerald)] px-6 py-3 text-[0.9375rem] font-semibold text-white transition hover:bg-[var(--leos-emerald-dark)] active:scale-[0.98]"
            onClick={() => {
              setContinued(true);
              setHomePulse(false);
            }}
          >
            Continue
          </button>
        </footer>
      </article>
    </div>
  );
};
