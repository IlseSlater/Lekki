import { useMemo, useState } from "react";

type EntryStep = "missing" | "welcome" | "join" | "loading";

const DEMO_VENUES = [
  { token: "qr-demo-restaurant", title: "Restaurant", desc: "Engineering demo only" },
  { token: "qr-demo-cafe", title: "Café", desc: "Engineering demo only" },
  { token: "qr-demo-hotel", title: "Hotel", desc: "Engineering demo only" },
  { token: "qr-demo-festival", title: "Festival", desc: "Engineering demo only" },
  { token: "qr-demo-airport", title: "Airport", desc: "Engineering demo only" },
  { token: "qr-demo-healthcare", title: "Healthcare", desc: "Engineering demo only" },
] as const;

/**
 * LEOS Experience Entry — Arrival → Join (from apps/web entry.page.ts).
 * Interactive canvas recreation: demo seeds, welcome, name join.
 */
export const GuestEntry = () => {
  const [step, setStep] = useState<EntryStep>("missing");
  const [displayName, setDisplayName] = useState("");
  const [profileLabel, setProfileLabel] = useState("Restaurant");
  const [placeCode, setPlaceCode] = useState("T12");
  const [error, setError] = useState("");

  const purpose = useMemo(() => {
    switch (step) {
      case "join":
        return "Almost there";
      case "loading":
        return "Joining";
      case "missing":
        return "Scan to join";
      case "welcome":
        return profileLabel || "Welcome";
      default:
        return "Welcome";
    }
  }, [step, profileLabel]);

  const lead = useMemo(() => {
    switch (step) {
      case "join":
        return "One name — then the menu.";
      case "missing":
        return "Engineering demo — guests arrive via QR only.";
      case "welcome":
        return placeCode ? `Place ${placeCode}` : "Welcome — you’re here.";
      default:
        return "";
    }
  }, [step, placeCode]);

  const showFooter = step === "welcome" || step === "join";

  const pickDemo = (token: string, title: string) => {
    setError("");
    setStep("loading");
    setProfileLabel(title);
    setPlaceCode(title === "Café" ? "C3" : "T12");
    window.setTimeout(() => setStep("welcome"), 700);
  };

  const toJoin = () => {
    if (!displayName || displayName === "Guest") setDisplayName("");
    setStep("join");
  };

  const enterExperience = () => {
    const name = displayName.trim() || "Guest";
    setDisplayName(name);
    setStep("welcome");
    setError("");
    // Canvas demo: brief confirmation pulse back through welcome
    setProfileLabel((p) => p);
  };

  return (
    <div className="guest-entry min-h-screen w-full flex items-center justify-center bg-[var(--leos-warm-sand)] px-4 py-8 font-[family-name:var(--leos-font-sans)] text-[var(--leos-neutral-dark)]">
      <article className="leos-screen w-full max-w-md">
        <header>
          <p className="mb-3 text-[0.6875rem] font-bold tracking-[0.14em] uppercase text-[var(--leos-emerald)]">
            LEOS
          </p>
          <h1 className="leos-screen__purpose m-0 text-[1.75rem] font-semibold leading-tight">
            {purpose}
          </h1>
          {lead ? (
            <p className="leos-screen__lead mt-2 mb-0 text-base leading-relaxed text-[var(--leos-neutral-muted)] max-w-md">
              {lead}
            </p>
          ) : null}
        </header>

        <div className="leos-card mt-6 rounded-[24px] border border-[var(--leos-warm-sand-dark)] bg-[var(--leos-surface-ambient)] p-6 shadow-[var(--leos-shadow-emerald)]">
          {error ? (
            <p className="mb-4 rounded-xl bg-[var(--leos-danger-bg)] px-3 py-2 text-sm text-[var(--leos-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          {step === "missing" ? (
            <div>
              <p className="m-0 text-[var(--leos-neutral-muted)]">
                Scan the QR at your table — you’ll land right here.
              </p>
              <p className="mt-4 mb-0 text-[var(--leos-neutral-muted)]">
                Engineering demo — pick a seed:
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {DEMO_VENUES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    className="leos-visual-card rounded-[24px] border-2 border-[var(--leos-warm-sand-dark)] bg-white p-4 text-left transition hover:border-[var(--leos-warm-sand-focus)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--leos-emerald)]"
                    onClick={() => pickDemo(v.token, v.title)}
                  >
                    <p className="m-0 mb-1 font-semibold text-[var(--leos-neutral-dark)]">
                      {v.title}
                    </p>
                    <p className="m-0 text-sm text-[var(--leos-neutral-muted)]">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "loading" ? (
            <div className="py-8 text-center" aria-live="polite">
              <p className="m-0 text-[var(--leos-neutral-muted)]">Finding your place…</p>
            </div>
          ) : null}

          {step === "welcome" ? (
            <div className="leos-arrival py-5 text-center animate-[leosFadeUp_0.45s_ease-out]">
              <p className="m-0 text-xs tracking-[0.14em] uppercase text-[var(--leos-neutral-muted)]">
                {profileLabel || "Experience"}
              </p>
              {placeCode ? (
                <p className="mt-4 mb-0 text-[1.75rem] leading-tight text-[var(--leos-neutral-dark)]">
                  Place <strong>{placeCode}</strong>
                </p>
              ) : null}
              <p className="mt-3 mb-0 text-[var(--leos-neutral-muted)]">
                You’re in the right place.
              </p>
            </div>
          ) : null}

          {step === "join" ? (
            <div>
              <label className="flex flex-col gap-2">
                <span className="text-[0.6875rem] font-bold tracking-[0.08em] uppercase text-[var(--leos-neutral-dark)]">
                  What should we call you?
                </span>
                <input
                  className="min-h-11 w-full rounded-xl border border-[var(--leos-warm-sand-dark)] bg-white px-4 py-3 text-base text-[var(--leos-neutral-dark)] focus:border-[var(--leos-emerald)] focus:outline-none focus:shadow-[0_0_0_3px_var(--leos-emerald-soft)]"
                  name="displayName"
                  value={displayName}
                  autoComplete="nickname"
                  autoFocus
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") enterExperience();
                  }}
                />
              </label>
              {placeCode ? (
                <p className="mt-4 mb-0 text-[var(--leos-neutral-muted)]">
                  Joining Place <strong>{placeCode}</strong>
                  {profileLabel ? ` · ${profileLabel}` : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {showFooter ? (
          <footer className="mt-6 flex justify-end gap-3 border-t border-[var(--leos-warm-sand-dark)] pt-6">
            {step === "welcome" ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--leos-emerald)] px-6 py-3 text-[0.9375rem] font-semibold text-white transition hover:bg-[var(--leos-emerald-dark)] active:scale-[0.98]"
                onClick={toJoin}
              >
                Continue
              </button>
            ) : null}
            {step === "join" ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--leos-emerald)] px-6 py-3 text-[0.9375rem] font-semibold text-white transition hover:bg-[var(--leos-emerald-dark)] active:scale-[0.98]"
                onClick={enterExperience}
              >
                See the menu
              </button>
            ) : null}
          </footer>
        ) : null}
      </article>
    </div>
  );
};
