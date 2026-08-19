import { useState } from 'react';

type Status = 'empty' | 'inProgress' | 'live';

export const LEOSStudioHome = () => {
  const [status, setStatus] = useState<Status>('empty');
  const greeting = 'Good afternoon.';

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
            {['Home', 'Identity', 'Experience', 'Places', 'Payments', 'Go Live'].map((item, index) => (
              <span
                key={item}
                className={`rounded-[10px] px-3 py-2.5 text-[15px] font-medium ${
                  index === 0 ? 'bg-[rgba(13,58,47,0.08)] font-semibold text-[#111827]' : 'text-[#6b7280]'
                }`}
              >
                {item}
              </span>
            ))}
          </nav>
          <div className="mt-auto border-t border-[#e5e7eb] pt-6">
            <p className="text-sm font-semibold">{status === 'empty' ? 'Your experience' : 'Blue Door'}</p>
            <p className={`mt-1 text-xs font-semibold ${status === 'live' ? 'text-[#047857]' : 'text-[#6b7280]'}`}>
              {status === 'live' ? 'Live' : 'Setup'}
            </p>
          </div>
        </aside>

        <main className="px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-[47.5rem] flex-col gap-12">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['empty', 'Empty'],
                  ['inProgress', 'In progress'],
                  ['live', 'Live'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    status === key
                      ? 'bg-[#0d3a2f] text-white'
                      : 'border border-[#e5e7eb] bg-white text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  Preview: {label}
                </button>
              ))}
            </div>

            {status === 'empty' ? (
              <>
                <header>
                  <p className="m-0 text-sm font-medium text-[#6b7280]">{greeting}</p>
                  <h1 className="mt-2 max-w-[16ch] text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111827] sm:text-5xl">
                    Welcome to LEOS Studio
                  </h1>
                  <p className="mt-3 max-w-md text-base leading-6 text-[#6b7280]">Let’s create your first experience.</p>
                </header>
                <div>
                  <button
                    type="button"
                    className="min-h-12 rounded-xl bg-[#0d3a2f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0a2f26] active:scale-[0.98]"
                  >
                    Create your first experience
                  </button>
                </div>
              </>
            ) : null}

            {status === 'inProgress' ? (
              <>
                <header>
                  <p className="m-0 text-sm font-medium text-[#6b7280]">{greeting}</p>
                  <h1 className="mt-2 max-w-[16ch] text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111827] sm:text-5xl">
                    Let’s finish Blue Door.
                  </h1>
                  <p className="mt-3 max-w-md text-base leading-6 text-[#6b7280]">Step 3 of 5</p>
                </header>
                <div className="flex flex-col items-start gap-3">
                  <button
                    type="button"
                    className="min-h-12 rounded-xl bg-[#0d3a2f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0a2f26] active:scale-[0.98]"
                  >
                    Continue setup
                  </button>
                  <p className="m-0 text-sm text-[#9ca3af]">Restaurant · almost there</p>
                </div>
                <section>
                  <p className="m-0 text-sm text-[#9ca3af]">Start over?</p>
                  <button type="button" className="mt-2 text-base font-semibold tracking-[-0.01em] text-[#111827]">
                    Choose experience →
                  </button>
                </section>
              </>
            ) : null}

            {status === 'live' ? (
              <>
                <header>
                  <p className="m-0 text-sm font-medium text-[#6b7280]">{greeting}</p>
                  <h1 className="mt-2 max-w-[16ch] text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111827] sm:text-5xl">
                    Blue Door is live.
                  </h1>
                  <p className="mt-3 max-w-md text-base leading-6 text-[#6b7280]">Welcome back — here’s where things stand.</p>
                </header>
                <section className="border-y border-[#e5e7eb]" aria-label="Today">
                  {[
                    { label: 'Guests today', value: '—', ok: true },
                    { label: 'Payments', value: 'Healthy', ok: true },
                    { label: 'Kitchen', value: 'Online', ok: true },
                    { label: 'Last QR scan', value: 'Ready to scan', ok: true },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 border-b border-[#e5e7eb] py-4 last:border-b-0"
                    >
                      <span className="text-[15px] text-[#6b7280]">{row.label}</span>
                      <span className={`text-base font-semibold ${row.ok ? 'text-[#047857]' : 'text-[#b45309]'}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </section>
                <div>
                  <button
                    type="button"
                    className="min-h-12 rounded-xl bg-[#0d3a2f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0a2f26] active:scale-[0.98]"
                  >
                    Continue operating
                  </button>
                </div>
                <section>
                  <p className="m-0 text-sm text-[#9ca3af]">Need setup?</p>
                  <button type="button" className="mt-2 text-base font-semibold tracking-[-0.01em] text-[#111827]">
                    Manage experience →
                  </button>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};
