import { useMemo, useState } from 'react';

const moods = [
  {
    name: 'Moon Bloom',
    accent: 'from-rose-200 via-amber-100 to-white',
    summary: 'A soft, romantic direction for boutique hospitality and premium wellness launches.',
  },
  {
    name: 'Glass Garden',
    accent: 'from-emerald-100 via-teal-50 to-white',
    summary: 'A lighter botanical story with extra air, motion, and tactile calm.',
  },
  {
    name: 'Velvet Dawn',
    accent: 'from-violet-100 via-fuchsia-50 to-white',
    summary: 'An editorial palette for creative brands that want intimacy and polish.',
  },
];

const faqs = [
  {
    question: 'What is Aurora Atelier?',
    answer: 'Aurora Atelier is a concept landing page for a high-touch creative studio that pairs strategy, styling, and launch support.',
  },
  {
    question: 'Can guests book without a sales call?',
    answer: 'Yes. This demo includes a polished mini-booking interaction so visitors can express interest immediately.',
  },
  {
    question: 'Is the page responsive?',
    answer: 'It is designed as a fluid single-frame experience that adapts cleanly from mobile to large desktop canvases.',
  },
];

const packages = [
  { name: 'Editorial Sprint', detail: 'Creative direction, campaign story, and signature hero section.', price: '$2.4k' },
  { name: 'Launch Week', detail: 'Landing page, motion language, conversion copy, and proof stack.', price: '$4.8k' },
  { name: 'Studio Residency', detail: 'Ongoing art direction for teams releasing premium experiences monthly.', price: '$8.2k' },
];

export const AuroraAtelier = () => {
  const [selectedMood, setSelectedMood] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(packages[1].name);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const mood = moods[selectedMood];
  const selectedPackageDetail = useMemo(
    () => packages.find((entry) => entry.name === selectedPackage) ?? packages[0],
    [selectedPackage],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Add your name so the studio knows who to follow up with.');
      setSubmitted(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email for your private concept note.');
      setSubmitted(false);
      return;
    }

    setError('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f4ef] text-[#2b1f1c]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-[#d8c9bf] bg-white/80 px-5 py-4 shadow-[0_20px_60px_rgba(95,65,53,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2b1f1c] text-sm font-semibold tracking-[0.2em] text-white">
              AA
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] uppercase text-[#8f5f49]">Aurora Atelier</p>
              <p className="text-sm text-[#7f6b63]">Editorial launch pages for taste-led brands.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#71584e]">
            <span className="rounded-full border border-[#d9c8bd] px-4 py-2">Concept No. 02</span>
            <button
              type="button"
              onClick={() => setSelectedMood((selectedMood + 1) % moods.length)}
              className="rounded-full bg-[#2b1f1c] px-4 py-2 font-medium text-white transition hover:bg-[#4a342e] focus:outline-none focus:ring-2 focus:ring-[#d7b7a3]"
            >
              Change mood
            </button>
          </div>
        </header>

        <section className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${mood.accent} px-5 py-10 shadow-[0_30px_100px_rgba(95,65,53,0.12)] sm:px-8 lg:px-10 lg:py-12`}>
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-40 w-40 rounded-full bg-[#f1d5cc]/50 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-sm text-[#7b5e53]">
                <span className="h-2 w-2 rounded-full bg-[#c78062]" />
                Crafted for boutique launches, premium stays, and intimate services
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#2b1f1c] sm:text-5xl lg:text-7xl">
                  Invite people into a world they want to linger in.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[#69534a] sm:text-lg">
                  Aurora Atelier pairs editorial composition, tactile storytelling, and conversion-aware details to make
                  premium offers feel unmistakably considered from the first scroll.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {moods.map((entry, index) => (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => setSelectedMood(index)}
                    className={`rounded-full px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#d7b7a3] ${
                      selectedMood === index
                        ? 'bg-[#2b1f1c] text-white'
                        : 'border border-white/70 bg-white/70 text-[#71584e] hover:bg-white'
                    }`}
                  >
                    {entry.name}
                  </button>
                ))}
              </div>

              <p className="max-w-xl text-sm leading-7 text-[#745d54]">{mood.summary}</p>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['4.9/5', 'Average experience rating'],
                  ['36h', 'Concept turnaround'],
                  ['88%', 'Visitors who reach the inquiry block'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[1.5rem] border border-white/70 bg-white/65 p-4">
                    <p className="text-2xl font-semibold text-[#2b1f1c]">{value}</p>
                    <p className="mt-2 text-sm text-[#7c6760]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_25px_80px_rgba(87,56,44,0.12)] backdrop-blur">
              <div className="rounded-[1.75rem] border border-[#eadad0] bg-[#fffaf6] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#8f6f60]">Private concept note</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#2b1f1c]">Request a tailored direction</h2>
                  </div>
                  <div className="rounded-full bg-[#f1e2d9] px-3 py-1 text-xs font-semibold text-[#8f5f49]">Interactive</div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#7a6259]">Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        if (error) setError('');
                        if (submitted) setSubmitted(false);
                      }}
                      placeholder="Your name"
                      className="h-12 w-full rounded-2xl border border-[#e6d6cb] bg-white px-4 text-base text-[#2b1f1c] placeholder:text-[#ae968b] focus:border-[#c58968] focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#7a6259]">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError('');
                        if (submitted) setSubmitted(false);
                      }}
                      placeholder="name@brand.com"
                      className="h-12 w-full rounded-2xl border border-[#e6d6cb] bg-white px-4 text-base text-[#2b1f1c] placeholder:text-[#ae968b] focus:border-[#c58968] focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#7a6259]">Package</span>
                    <select
                      value={selectedPackage}
                      onChange={(event) => setSelectedPackage(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#e6d6cb] bg-white px-4 text-base text-[#2b1f1c] focus:border-[#c58968] focus:outline-none"
                    >
                      {packages.map((entry) => (
                        <option key={entry.name} value={entry.name}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#7a6259]">A short note</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={4}
                      placeholder="Tell us the feeling or offer you want this page to carry."
                      className="w-full rounded-[1.5rem] border border-[#e6d6cb] bg-white px-4 py-3 text-base text-[#2b1f1c] placeholder:text-[#ae968b] focus:border-[#c58968] focus:outline-none"
                    />
                  </label>

                  <button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-[#2b1f1c] text-base font-semibold text-white transition hover:bg-[#4a342e] focus:outline-none focus:ring-2 focus:ring-[#d7b7a3]"
                  >
                    Request concept note
                  </button>

                  <div className="min-h-6 text-sm">
                    {error ? <p className="text-[#b44d43]">{error}</p> : null}
                    {!error && submitted ? (
                      <p className="text-[#4f7d58]">
                        Thanks, {name.trim()}. We’ll send a curated concept note for the {selectedPackage} package to {email.trim()}.
                      </p>
                    ) : null}
                    {!error && !submitted ? (
                      <p className="text-[#8d766c]">{selectedPackageDetail.detail} | Starting at {selectedPackageDetail.price}</p>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#e3d4c8] bg-white px-5 py-6 shadow-[0_15px_50px_rgba(89,59,47,0.07)] sm:px-6">
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-[#9d715b]">Signature packages</p>
            <div className="mt-5 space-y-4">
              {packages.map((entry) => {
                const isSelected = selectedPackage === entry.name;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => setSelectedPackage(entry.name)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#c58a6b] bg-[#fff4ee] shadow-[0_12px_30px_rgba(197,138,107,0.15)]'
                        : 'border-[#efe1d7] bg-[#fffdfa] hover:border-[#dbc2b2]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#2b1f1c]">{entry.name}</h3>
                        <p className="mt-2 text-sm leading-7 text-[#7b655c]">{entry.detail}</p>
                      </div>
                      <p className="text-lg font-semibold text-[#8f5f49]">{entry.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e3d4c8] bg-[#fcf8f4] px-5 py-6 shadow-[0_15px_50px_rgba(89,59,47,0.07)] sm:px-6">
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-[#9d715b]">Frequently asked</p>
            <div className="mt-5 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={faq.question} className="rounded-[1.5rem] border border-[#eadbd0] bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-base font-semibold text-[#2b1f1c]">{faq.question}</span>
                      <span className="text-2xl text-[#9d715b]">{isOpen ? '-' : '+'}</span>
                    </button>
                    {isOpen ? <p className="px-5 pb-5 text-sm leading-7 text-[#7b655c]">{faq.answer}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
