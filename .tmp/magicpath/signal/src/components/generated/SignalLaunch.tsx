import { useMemo, useState } from 'react';

const stats = [
  { label: 'Launches shipped', value: '3.2k' },
  { label: 'Average speed-up', value: '41%' },
  { label: 'Qualified pipeline', value: '$18M' },
];

const featurePillars = [
  {
    name: 'Live message testing',
    detail: 'Stress test messaging, headlines, and CTAs before media spend goes live.',
  },
  {
    name: 'Signal-based scoring',
    detail: 'See which channels and audiences show intent before your team scales campaigns.',
  },
  {
    name: 'Revenue room',
    detail: 'Pull launch ops, paid, sales, and customer proof into one calm operating layer.',
  },
];

const quotes = [
  {
    quote: 'We went from launch panic to launch rhythm in two weeks.',
    author: 'Nia Patel',
    role: 'VP Marketing, Relay Cloud',
  },
  {
    quote: 'The page feels premium, but the product promise lands even faster in demo calls.',
    author: 'Marcus Cole',
    role: 'Founder, Northline',
  },
  {
    quote: 'Our SDR and growth teams finally work from the same playbook.',
    author: 'Elena Brooks',
    role: 'Revenue Lead, Vector Labs',
  },
];

const plans = {
  monthly: { growth: '$79', scale: '$149' },
  yearly: { growth: '$63', scale: '$119' },
};

export const SignalLaunch = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [activeQuote, setActiveQuote] = useState(0);
  const [activePillar, setActivePillar] = useState(0);

  const currentQuote = quotes[activeQuote];
  const pricing = useMemo(() => plans[billing], [billing]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError('Enter a valid work email to reserve a launch audit.');
      setSubmitted(false);
      return;
    }

    setError('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#050816] text-white">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(72,120,255,0.38),_transparent_50%),radial-gradient(circle_at_20%_30%,_rgba(0,229,255,0.2),_transparent_30%),linear-gradient(180deg,_rgba(10,14,32,0.95),_rgba(5,8,22,1))]" />
        <div className="absolute left-1/2 top-28 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

        <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-col gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/20 text-sm font-semibold text-cyan-200">
                SL
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.22em] text-cyan-200 uppercase">Signal Launch</p>
                <p className="text-sm text-white/60">Launch intelligence for teams that move fast.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/10 px-4 py-2">Cohort opens Aug 18</span>
              <button
                type="button"
                onClick={() => setActiveQuote((activeQuote + 1) % quotes.length)}
                className="rounded-full bg-white px-4 py-2 font-medium text-slate-900 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                See proof
              </button>
            </div>
          </header>

          <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Pre-launch systems for B2B software, AI tools, and revenue teams
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-7xl">
                  Launch with conviction, not last-minute guesswork.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Signal Launch helps growth teams turn launch chaos into a measurable operating system.
                  Test the message, align the room, and move from first visit to booked demo with less drag.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-[0_24px_80px_rgba(6,10,30,0.4)] backdrop-blur"
              >
                <div className="flex flex-col gap-3 lg:flex-row">
                  <label className="flex-1">
                    <span className="sr-only">Work email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError('');
                        if (submitted) setSubmitted(false);
                      }}
                      placeholder="Work email for your launch audit"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 text-base text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-14 rounded-2xl bg-cyan-300 px-6 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  >
                    Reserve audit
                  </button>
                </div>
                <div className="mt-3 min-h-6 text-sm">
                  {error ? <p className="text-rose-300">{error}</p> : null}
                  {!error && submitted ? (
                    <p className="text-emerald-300">Audit reserved. We will send a sample launch scorecard to {email.trim()}.</p>
                  ) : null}
                  {!error && !submitted ? (
                    <p className="text-slate-400">Includes a messaging teardown, paid-channel map, and demo CTA recommendations.</p>
                  ) : null}
                </div>
              </form>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-3xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="rounded-[1.5rem] border border-cyan-300/20 bg-[#0b1126] p-5">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Revenue room snapshot</span>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-300">Live intent +12%</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/6 bg-white/4 p-4">
                    <p className="text-sm text-slate-400">Best converting promise</p>
                    <p className="mt-3 text-xl font-semibold">Automate renewals without losing account trust.</p>
                    <div className="mt-5 h-2 rounded-full bg-white/10">
                      <div className="h-2 w-[74%] rounded-full bg-cyan-300" />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">74% confidence score after 18 tests</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/6 bg-cyan-300/10 p-4">
                    <p className="text-sm text-cyan-100/80">Pipeline indicator</p>
                    <p className="mt-3 text-4xl font-semibold text-cyan-200">2.4x</p>
                    <p className="mt-2 text-sm text-slate-300">lift in qualified demo requests from launch-week traffic.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/6 bg-white/4 p-4">
                  <div className="flex flex-wrap gap-2">
                    {featurePillars.map((pillar, index) => {
                      const isActive = index === activePillar;
                      return (
                        <button
                          key={pillar.name}
                          type="button"
                          onClick={() => setActivePillar(index)}
                          className={`rounded-full px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-200 ${
                            isActive ? 'bg-cyan-300 text-slate-950' : 'bg-white/6 text-slate-300 hover:bg-white/12'
                          }`}
                        >
                          {pillar.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-base leading-7 text-slate-200">{featurePillars[activePillar].detail}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.22em] text-cyan-200 uppercase">How it works</p>
                  <h2 className="mt-3 text-3xl font-semibold">One launch page. Three confidence loops.</h2>
                </div>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Built for teams who want a clear message, stronger conversion, and a crisp internal story before launch day.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  ['01', 'Shape the offer', 'Refine hero copy, angle, and proof until the story lands in one scroll.'],
                  ['02', 'Run live tests', 'Compare hooks, CTA copy, and proof blocks with intent signals instead of guesswork.'],
                  ['03', 'Align revenue', 'Package findings into a single room your marketing, founder, and sales leads can trust.'],
                ].map(([step, title, detail]) => (
                  <article key={step} className="rounded-[1.5rem] border border-white/8 bg-slate-950/40 p-5">
                    <p className="text-sm font-semibold text-cyan-200">{step}</p>
                    <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-[#0c132c] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.2em] text-cyan-200 uppercase">Pricing</p>
                  <h2 className="mt-3 text-2xl font-semibold">Pick your launch pace</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 p-1">
                  {(['monthly', 'yearly'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBilling(option)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        billing === option ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {option === 'monthly' ? 'Monthly' : 'Yearly'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Growth</h3>
                      <p className="mt-2 text-sm text-slate-300">For one product line and one demand gen team.</p>
                    </div>
                    <p className="text-3xl font-semibold">{pricing.growth}</p>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-slate-950">
                        Most popular
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">Scale</h3>
                      <p className="mt-2 text-sm text-slate-200">For launch pods managing paid, lifecycle, and sales enablement together.</p>
                    </div>
                    <p className="text-3xl font-semibold text-cyan-100">{pricing.scale}</p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.22em] text-cyan-200 uppercase">Customer proof</p>
                <h2 className="mt-3 text-3xl font-semibold">A landing page that feels like a launch room.</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQuote((activeQuote - 1 + quotes.length) % quotes.length)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQuote((activeQuote + 1) % quotes.length)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
              <p className="text-2xl leading-9 text-white sm:text-3xl">"{currentQuote.quote}"</p>
              <div className="mt-5">
                <p className="font-semibold text-cyan-100">{currentQuote.author}</p>
                <p className="text-sm text-slate-400">{currentQuote.role}</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
