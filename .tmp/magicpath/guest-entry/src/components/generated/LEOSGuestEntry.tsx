import { useState } from 'react';

type EntryStep = 'missing' | 'welcome' | 'join';

const demoVenues = [
  { token: 'qr-demo-restaurant', title: 'Restaurant', placeLabel: 'Table', placeCode: '12' },
  { token: 'qr-demo-cafe', title: 'Café', placeLabel: 'Counter', placeCode: 'Pickup' },
  { token: 'qr-demo-hotel', title: 'Hotel', placeLabel: 'Room', placeCode: '101' },
  { token: 'qr-demo-festival', title: 'Festival', placeLabel: 'Zone', placeCode: 'Main Stage' },
  { token: 'qr-demo-airport', title: 'Airport', placeLabel: 'Gate', placeCode: 'B12' },
  { token: 'qr-demo-healthcare', title: 'Healthcare', placeLabel: 'Bay', placeCode: 'A' },
];

export const LEOSGuestEntry = () => {
  const [step, setStep] = useState<EntryStep>('missing');
  const [active, setActive] = useState(demoVenues[0]);
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);

  const purpose =
    step === 'join' ? 'Almost there' : step === 'welcome' ? active.title : 'Scan to join';

  const lead =
    step === 'join'
      ? 'One name — then the menu.'
      : step === 'welcome'
        ? `${active.placeLabel} ${active.placeCode}`
        : 'Engineering demo — guests arrive via QR only.';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(15,122,95,0.08),transparent_55%),#f7f3ec] text-[#1c2420]">
      <header className="px-5 py-3">
        <p className="m-0 text-[11px] tracking-[0.16em] text-[#6b6560] uppercase">LEOS</p>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-8">
        <article className="flex flex-col gap-6">
          <header>
            <h1 className="m-0 text-[1.75rem] font-semibold leading-tight text-[#1c2420]">{purpose}</h1>
            <p className="mt-2 max-w-sm text-base leading-6 text-[#5c6760]">{lead}</p>
          </header>

          <div className="rounded-[24px] border border-[#e5ddd0] bg-[#faf7f2] p-6 shadow-[0_24px_48px_rgba(13,58,47,0.1)]">
            {step === 'missing' ? (
              <div className="space-y-4">
                <p className="m-0 text-sm text-[#5c6760]">Scan the QR at your table — you’ll land right here.</p>
                <p className="m-0 text-sm text-[#5c6760]">Engineering demo — pick a seed:</p>
                <div className="grid grid-cols-2 gap-3">
                  {demoVenues.map((venue) => (
                    <button
                      key={venue.token}
                      type="button"
                      onClick={() => {
                        setActive(venue);
                        setStep('welcome');
                        setJoined(false);
                      }}
                      className={`rounded-[24px] border-2 bg-white p-4 text-left transition ${
                        active.token === venue.token
                          ? 'border-[#1ecad3] shadow-[0_0_0_4px_rgba(30,202,211,0.18)]'
                          : 'border-[#e5ddd0] hover:border-[#d9cfc0]'
                      }`}
                    >
                      <p className="m-0 font-semibold text-[#1c2420]">{venue.title}</p>
                      <p className="mt-1 m-0 text-sm text-[#5c6760]">Engineering demo only</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 'welcome' ? (
              <div className="py-2 text-center">
                <p className="m-0 text-xs tracking-[0.14em] text-[#5c6760] uppercase">{active.title}</p>
                <p className="mt-4 m-0 text-[1.75rem] leading-tight text-[#1c2420]">
                  {active.placeLabel} <strong>{active.placeCode}</strong>
                </p>
                <p className="mt-3 m-0 text-base text-[#5c6760]">You’re in the right place.</p>
              </div>
            ) : null}

            {step === 'join' ? (
              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c2420] uppercase">
                    What should we call you?
                  </span>
                  <input
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value);
                      setJoined(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setDisplayName((current) => current.trim() || 'Guest');
                        setJoined(true);
                      }
                    }}
                    placeholder="Guest"
                    autoFocus
                    className="min-h-11 w-full rounded-xl border border-[#e5ddd0] bg-white px-4 text-base text-[#1c2420] outline-none focus:border-[#0d3a2f] focus:shadow-[0_0_0_3px_rgba(13,58,47,0.08)]"
                  />
                </label>
                <p className="m-0 text-sm text-[#5c6760]">
                  Joining {active.placeLabel} <strong>{active.placeCode}</strong> · {active.title}
                </p>
                {joined ? (
                  <p className="m-0 rounded-xl bg-[#e8f5ef] px-3 py-2 text-sm font-semibold text-[#1a6b4f]" role="status">
                    Welcome, {displayName.trim() || 'Guest'} — opening the menu.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {(step === 'welcome' || step === 'join') && (
            <footer className="flex gap-3 border-t border-[#e5ddd0] pt-6">
              <button
                type="button"
                onClick={() => setStep(step === 'join' ? 'welcome' : 'missing')}
                className="min-h-11 rounded-xl border border-[#e5ddd0] px-4 text-sm font-semibold text-[#1c2420] transition hover:bg-[#f4efe6]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step === 'welcome') {
                    setDisplayName('');
                    setStep('join');
                    return;
                  }
                  setDisplayName((current) => current.trim() || 'Guest');
                  setJoined(true);
                }}
                className="min-h-11 flex-1 rounded-xl bg-[#0d3a2f] px-4 text-sm font-semibold text-white transition hover:bg-[#0a2f26] active:scale-[0.98]"
              >
                {step === 'join' ? 'See the menu' : 'Continue'}
              </button>
            </footer>
          )}
        </article>
      </main>
    </div>
  );
};
