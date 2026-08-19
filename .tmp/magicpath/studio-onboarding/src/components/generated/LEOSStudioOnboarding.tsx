import { useState } from 'react';

type Step = 'welcome' | 'create';
type ExperienceId = 'restaurant' | 'cafe' | 'hotel' | 'festival' | 'airport' | 'healthcare';

const experiences: Array<{ id: ExperienceId; label: string; blurb: string }> = [
  { id: 'restaurant', label: 'Restaurant', blurb: 'Guests order and dine.' },
  { id: 'cafe', label: 'Café', blurb: 'Fast coffee service.' },
  { id: 'hotel', label: 'Hotel', blurb: 'Guest services and room experiences.' },
  { id: 'festival', label: 'Festival', blurb: 'Large-scale events.' },
  { id: 'airport', label: 'Airport', blurb: 'Traveller experiences.' },
  { id: 'healthcare', label: 'Healthcare', blurb: 'Calm waiting and care support.' },
];

export const LEOSStudioOnboarding = () => {
  const [step, setStep] = useState<Step>('welcome');
  const [selected, setSelected] = useState<ExperienceId | ''>('');
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-[#111827]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-8 border-b border-[#e5e7eb] bg-white px-5 py-8 lg:border-b-0 lg:border-r">
          <p className="text-[13px] font-semibold text-[#111827]">LEOS Studio</p>
          <nav className="flex flex-col gap-1 border-b border-[#e5e7eb] pb-4" aria-label="Studio mode">
            {['Setup', 'Operate', 'Grow'].map((item, index) => (
              <span
                key={item}
                className={`rounded-[10px] px-3 py-3 text-sm font-semibold ${
                  index === 0 ? 'bg-[rgba(13,58,47,0.08)] text-[#111827]' : 'text-[#6b7280]'
                }`}
              >
                {item}
              </span>
            ))}
          </nav>
          <nav className="flex flex-col gap-1" aria-label="Setup">
            {['Home', 'Identity', 'Experience', 'Places', 'Payments', 'Go Live'].map((item) => (
              <span key={item} className="rounded-[10px] px-3 py-2.5 text-[15px] font-medium text-[#6b7280]">
                {item}
              </span>
            ))}
          </nav>
          <div className="mt-auto border-t border-[#e5e7eb] pt-6">
            <p className="text-sm font-semibold">Your experience</p>
            <p className="mt-1 text-xs font-semibold text-[#047857]">Setup</p>
          </div>
        </aside>

        <main className="px-6 py-10 sm:px-10 lg:px-16">
          <article className="mx-auto flex w-full max-w-[47.5rem] flex-col gap-8">
            {step === 'welcome' ? (
              <>
                <header>
                  <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[#111827] sm:text-[2.25rem]">
                    Let’s create your first experience.
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[#6b7280]">
                    A few calm steps — then guests can scan a QR and join.
                  </p>
                </header>

                <div>
                  <ol className="list-decimal space-y-1 pl-5 text-base leading-8 text-[#6b7280]">
                    <li>Choose what you’re creating</li>
                    <li>Name the place</li>
                    <li>Shape the experience</li>
                    <li>Define places</li>
                    <li>Connect payments</li>
                    <li>Go live</li>
                  </ol>
                  <p className="mt-4 text-base text-[#6b7280]">Most teams finish in under ten minutes.</p>
                </div>

                <footer className="mt-4 flex flex-wrap items-center gap-6 border-t border-[#e5e7eb] pt-8">
                  <button
                    type="button"
                    className="rounded-xl px-1 py-3 text-base font-medium text-[#6b7280] transition hover:text-[#111827]"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('create')}
                    className="min-h-12 rounded-xl bg-[#0d3a2f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0a2f26] active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </footer>
              </>
            ) : (
              <>
                <header>
                  <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[#111827] sm:text-[2.25rem]">
                    What experience are you creating?
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[#6b7280]">
                    Pick the one that matches how guests will join.
                  </p>
                </header>

                <div className="flex flex-col gap-1" role="listbox" aria-activedescendant={selected || undefined}>
                  {experiences.map((experience) => {
                    const isSelected = selected === experience.id;
                    return (
                      <button
                        key={experience.id}
                        id={experience.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelected(experience.id);
                          setDone(false);
                        }}
                        className={`flex w-full flex-col items-start gap-1 rounded-xl px-4 py-[1.1rem] text-left transition ${
                          isSelected
                            ? 'bg-[rgba(13,58,47,0.12)]'
                            : 'bg-transparent hover:bg-[rgba(13,58,47,0.08)]'
                        }`}
                      >
                        <span className="text-[17px] font-semibold text-[#111827]">{experience.label}</span>
                        <span className="text-sm text-[#6b7280]">{experience.blurb}</span>
                      </button>
                    );
                  })}
                </div>

                {done ? (
                  <p className="rounded-xl bg-[#e8f5ef] px-4 py-3 text-sm font-semibold text-[#1a6b4f]" role="status">
                    {experiences.find((e) => e.id === selected)?.label} selected — continue to Identity.
                  </p>
                ) : null}

                <footer className="mt-2 flex flex-wrap items-center gap-6 border-t border-[#e5e7eb] pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('welcome');
                      setDone(false);
                    }}
                    className="rounded-xl px-1 py-3 text-base font-medium text-[#6b7280] transition hover:text-[#111827]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => setDone(true)}
                    className="min-h-12 rounded-xl bg-[#0d3a2f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0a2f26] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue
                  </button>
                </footer>
              </>
            )}
          </article>
        </main>
      </div>
    </div>
  );
};
