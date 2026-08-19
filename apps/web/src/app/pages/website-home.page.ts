import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lekki public front door — emotion first, software second.
 * Brand = Lekki. Studio = the tool (after Get Started).
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'leos-website-home',
  template: `
    <div class="www">
      <header class="www-nav">
        <a class="www-nav__brand" routerLink="/" aria-label="Lekki home">
          <img src="/brand/lekki-mark.svg" alt="" width="28" height="28" />
          <span>Lekki</span>
        </a>
        <nav class="www-nav__links" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#pricing">Pricing</a>
          <a routerLink="/signin">Sign In</a>
          <a class="www-nav__cta" routerLink="/signin">Get Started</a>
        </nav>
      </header>

      <!-- 1. Hero — brand first, photography, almost no UI -->
      <section class="www-hero" aria-labelledby="www-hero-title">
        <div class="www-hero__media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80"
            alt=""
          />
        </div>
        <div class="www-hero__veil" aria-hidden="true"></div>
        <div class="www-hero__copy">
          <p class="www-hero__wordmark" id="www-hero-title">LEKKI</p>
          <p class="www-hero__line">The human experience app.</p>
          <p class="www-hero__lead">
            Create experiences people love.<br />
            From restaurants to hotels, festivals and beyond.
          </p>
          <div class="www-hero__actions">
            <a class="www-btn www-btn--brand" routerLink="/signin">Get Started</a>
            <a class="www-btn www-btn--quiet" routerLink="/signin">Sign into Studio</a>
          </div>
        </div>
      </section>

      <!-- 2. What is Lekki? — story, not features -->
      <section class="www-section www-about" id="about" aria-labelledby="about-title">
        <h2 class="www-section__title" id="about-title">
          Every great experience<br />
          begins with confidence.
        </h2>
        <div class="www-story">
          <article class="www-story__card">
            <h3>Guests</h3>
            <p>Scan once.<br />Everything feels natural.</p>
          </article>
          <article class="www-story__card">
            <h3>Businesses</h3>
            <p>Go live in minutes.</p>
          </article>
          <article class="www-story__card">
            <h3>Teams</h3>
            <p>Operate calmly,<br />even under pressure.</p>
          </article>
        </div>
      </section>

      <!-- 3. How it works -->
      <section class="www-section www-how" aria-labelledby="how-title">
        <h2 class="www-section__title" id="how-title">How it works</h2>
        <ol class="www-flow">
          @for (step of flowSteps; track step.label) {
            <li class="www-flow__step">
              <span class="www-flow__mark" aria-hidden="true">{{ step.mark }}</span>
              <span class="www-flow__label">{{ step.label }}</span>
            </li>
          }
        </ol>
      </section>

      <!-- 4. Packs — imagery, not industry pitch -->
      <section class="www-section www-packs" aria-labelledby="packs-title">
        <h2 class="www-section__title" id="packs-title">Built once. Works everywhere.</h2>
        <div class="www-packs__grid">
          @for (pack of packs; track pack.name) {
            <figure class="www-pack">
              <img [src]="pack.image" [alt]="pack.name" loading="lazy" />
              <figcaption>{{ pack.name }}</figcaption>
            </figure>
          }
        </div>
      </section>

      <!-- 5. Studio — one glimpse of the tool -->
      <section class="www-section www-studio" aria-labelledby="studio-title">
        <div class="www-studio__copy">
          <p class="www-eyebrow">Lekki Studio</p>
          <h2 class="www-section__title" id="studio-title">The place you create and run it.</h2>
          <p class="www-studio__lead">
            Create. Configure. Go Live. Operate.<br />
            Everything works together behind the scenes.
          </p>
        </div>
        <div class="www-studio__frame" aria-hidden="true">
          <div class="www-studio__window">
            <div class="www-studio__chrome">
              <span></span><span></span><span></span>
            </div>
            <div class="www-studio__body">
              <p class="www-studio__brand">Studio</p>
              <ul>
                <li class="is-active">Create</li>
                <li>Configure</li>
                <li>Go Live</li>
                <li>Operate</li>
              </ul>
              <div class="www-studio__canvas">
                <p>Your experience</p>
                <span>Ready when you are</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. Pricing — Linear-simple -->
      <section class="www-section www-pricing" id="pricing" aria-labelledby="pricing-title">
        <h2 class="www-section__title" id="pricing-title">Simple, calm pricing.</h2>
        <p class="www-pricing__sub">One place to start. Room to grow.</p>
        <div class="www-pricing__grid">
          <article class="www-plan">
            <h3>Starter</h3>
            <p class="www-plan__price">Free</p>
            <p class="www-plan__blurb">One place. Guest path. Get live.</p>
            <a class="www-btn www-btn--ghost" routerLink="/signin">Get Started</a>
          </article>
          <article class="www-plan www-plan--featured">
            <p class="www-plan__badge">Popular</p>
            <h3>Professional</h3>
            <p class="www-plan__price">Coming soon</p>
            <p class="www-plan__blurb">Stations. Operate. Grow with calm truth.</p>
            <a class="www-btn www-btn--brand" routerLink="/signin">Get Started</a>
          </article>
          <article class="www-plan">
            <h3>Enterprise</h3>
            <p class="www-plan__price">Custom</p>
            <p class="www-plan__blurb">Groups. Many venues. Tailored together.</p>
            <a class="www-btn www-btn--ghost" href="mailto:hello@lekki.app">Talk to us</a>
          </article>
        </div>
      </section>

      <footer class="www-footer">
        <div class="www-footer__brand">
          <img src="/brand/lekki-mark.svg" alt="" width="22" height="22" />
          <div>
            <strong>Lekki</strong>
            <p>The human experience app.</p>
          </div>
        </div>
        <nav class="www-footer__nav" aria-label="Footer">
          <a href="#pricing">Pricing</a>
          <a routerLink="/signin">Studio</a>
          <a href="#about">About</a>
          <span class="www-footer__muted">Privacy</span>
          <span class="www-footer__muted">Terms</span>
        </nav>
      </footer>
    </div>
  `,
  styles: [
    `
      .www {
        --www-bg: #faf7f2;
        --www-ink: #1b2230;
        --www-muted: #6b7280;
        --www-brand: #d7a14a;
        --www-brand-hover: #c98f33;
        --www-line: #e7e2db;
        --www-surface: #ffffff;
        --www-display: 'Fraunces', Georgia, serif;
        --www-sans: 'Sora', system-ui, sans-serif;
        min-height: 100dvh;
        background: var(--www-bg);
        color: var(--www-ink);
        font-family: var(--www-sans);
      }

      .www-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.1rem clamp(1.25rem, 4vw, 3rem);
        position: sticky;
        top: 0;
        z-index: 20;
        background: color-mix(in srgb, var(--www-bg) 92%, transparent);
        backdrop-filter: blur(8px);
      }
      .www-nav__brand {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: var(--www-ink);
        font-weight: 650;
        letter-spacing: -0.02em;
      }
      .www-nav__brand img {
        display: block;
      }
      .www-nav__links {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.35rem 1.15rem;
        font-size: 0.875rem;
        font-weight: 550;
      }
      .www-nav__links a {
        color: var(--www-ink);
        text-decoration: none;
      }
      .www-nav__cta {
        padding: 0.55rem 1.05rem;
        border-radius: 999px;
        background: var(--www-brand);
        color: #fff !important;
      }
      .www-nav__cta:hover {
        background: var(--www-brand-hover);
      }

      /* Hero — full-bleed photo, brand first */
      .www-hero {
        position: relative;
        min-height: min(92dvh, 52rem);
        display: flex;
        align-items: flex-end;
        padding: clamp(2rem, 6vh, 4rem) clamp(1.25rem, 4vw, 3rem);
        overflow: hidden;
      }
      .www-hero__media {
        position: absolute;
        inset: 0;
      }
      .www-hero__media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 40%;
        animation: www-ken 28s ease-in-out infinite alternate;
      }
      .www-hero__veil {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(26, 22, 18, 0.15) 0%,
          rgba(26, 22, 18, 0.45) 55%,
          rgba(26, 22, 18, 0.72) 100%
        );
      }
      .www-hero__copy {
        position: relative;
        z-index: 1;
        max-width: 36rem;
        color: #fff;
        animation: www-rise 0.9s ease-out both;
      }
      .www-hero__wordmark {
        margin: 0;
        font-family: var(--www-display);
        font-size: clamp(3.75rem, 14vw, 7rem);
        font-weight: 650;
        letter-spacing: -0.04em;
        line-height: 0.92;
        color: #fff;
      }
      .www-hero__line {
        margin: 1rem 0 0;
        font-family: var(--www-display);
        font-size: clamp(1.25rem, 3vw, 1.75rem);
        font-weight: 500;
        letter-spacing: -0.02em;
      }
      .www-hero__lead {
        margin: 1rem 0 0;
        font-size: 1.05rem;
        line-height: 1.55;
        color: rgba(255, 255, 255, 0.88);
        max-width: 28rem;
      }
      .www-hero__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 2rem;
      }

      .www-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 3rem;
        padding: 0 1.35rem;
        border-radius: 999px;
        font-weight: 650;
        text-decoration: none;
        font-size: 0.95rem;
      }
      .www-btn--brand {
        background: var(--www-brand);
        color: #fff;
      }
      .www-btn--brand:hover {
        background: var(--www-brand-hover);
      }
      .www-btn--quiet {
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: transparent;
      }
      .www-btn--quiet:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .www-btn--ghost {
        border: 1px solid var(--www-line);
        color: var(--www-ink);
        background: var(--www-surface);
      }

      .www-section {
        padding: clamp(3.5rem, 10vh, 6rem) clamp(1.25rem, 4vw, 3rem);
        max-width: 72rem;
        margin: 0 auto;
      }
      .www-section__title {
        margin: 0 0 2.5rem;
        font-family: var(--www-display);
        font-size: clamp(1.85rem, 4.5vw, 2.75rem);
        font-weight: 600;
        letter-spacing: -0.03em;
        line-height: 1.15;
        max-width: 22ch;
      }
      .www-eyebrow {
        margin: 0 0 0.65rem;
        font-size: 0.75rem;
        font-weight: 650;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--www-brand);
      }

      .www-story {
        display: grid;
        gap: 1rem;
      }
      @media (min-width: 800px) {
        .www-story {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
      }
      .www-story__card {
        padding: 1.75rem 1.5rem;
        border-top: 1px solid var(--www-line);
      }
      .www-story__card h3 {
        margin: 0 0 0.85rem;
        font-family: var(--www-display);
        font-size: 1.5rem;
        font-weight: 600;
      }
      .www-story__card p {
        margin: 0;
        color: var(--www-muted);
        font-size: 1.05rem;
        line-height: 1.45;
      }

      .www-flow {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 1.25rem;
      }
      @media (min-width: 800px) {
        .www-flow {
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }
      }
      .www-flow__step {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .www-flow__mark {
        width: 3rem;
        height: 3rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        border: 1px solid var(--www-line);
        background: var(--www-surface);
        font-family: var(--www-display);
        font-size: 1.1rem;
        color: var(--www-brand);
      }
      .www-flow__label {
        font-weight: 600;
        font-size: 1rem;
        letter-spacing: -0.01em;
      }

      .www-packs__grid {
        display: grid;
        gap: 0.85rem;
        grid-template-columns: repeat(2, 1fr);
      }
      @media (min-width: 720px) {
        .www-packs__grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      .www-pack {
        margin: 0;
        position: relative;
        border-radius: 1rem;
        overflow: hidden;
        aspect-ratio: 4 / 5;
        background: var(--www-line);
      }
      .www-pack img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }
      .www-pack:hover img {
        transform: scale(1.04);
      }
      .www-pack figcaption {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 1.25rem 1rem;
        font-family: var(--www-display);
        font-size: 1.25rem;
        font-weight: 600;
        color: #fff;
        background: linear-gradient(transparent, rgba(20, 16, 12, 0.65));
      }

      .www-studio {
        display: grid;
        gap: 2.5rem;
        align-items: center;
      }
      @media (min-width: 900px) {
        .www-studio {
          grid-template-columns: 0.95fr 1.05fr;
        }
      }
      .www-studio__lead {
        margin: -1.5rem 0 0;
        color: var(--www-muted);
        font-size: 1.05rem;
        line-height: 1.55;
      }
      .www-studio__frame {
        min-height: 18rem;
      }
      .www-studio__window {
        border-radius: 1rem;
        border: 1px solid var(--www-line);
        background: var(--www-surface);
        box-shadow: 0 24px 60px rgba(27, 34, 48, 0.08);
        overflow: hidden;
        animation: www-rise 1s 0.1s ease-out both;
      }
      .www-studio__chrome {
        display: flex;
        gap: 0.4rem;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--www-line);
        background: #f4efe8;
      }
      .www-studio__chrome span {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 999px;
        background: #d5cfc6;
      }
      .www-studio__body {
        display: grid;
        grid-template-columns: 8.5rem 1fr;
        min-height: 16rem;
      }
      .www-studio__brand {
        margin: 0;
        padding: 1rem 1rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--www-muted);
        grid-column: 1;
      }
      .www-studio__body ul {
        grid-column: 1;
        list-style: none;
        margin: 0;
        padding: 0.25rem 0.65rem 1rem;
      }
      .www-studio__body li {
        padding: 0.45rem 0.65rem;
        border-radius: 0.45rem;
        font-size: 0.875rem;
        color: var(--www-muted);
      }
      .www-studio__body li.is-active {
        background: color-mix(in srgb, var(--www-brand) 16%, transparent);
        color: var(--www-ink);
        font-weight: 600;
      }
      .www-studio__canvas {
        grid-column: 2;
        grid-row: 1 / span 2;
        margin: 1rem 1rem 1rem 0;
        border-radius: 0.75rem;
        background: var(--www-bg);
        border: 1px solid var(--www-line);
        display: grid;
        place-content: center;
        text-align: center;
        gap: 0.35rem;
      }
      .www-studio__canvas p {
        margin: 0;
        font-family: var(--www-display);
        font-size: 1.35rem;
      }
      .www-studio__canvas span {
        color: var(--www-muted);
        font-size: 0.875rem;
      }

      .www-pricing__sub {
        margin: -1.75rem 0 2.5rem;
        color: var(--www-muted);
      }
      .www-pricing__grid {
        display: grid;
        gap: 1rem;
      }
      @media (min-width: 800px) {
        .www-pricing__grid {
          grid-template-columns: repeat(3, 1fr);
          align-items: stretch;
        }
      }
      .www-plan {
        position: relative;
        padding: 1.75rem 1.5rem;
        border: 1px solid var(--www-line);
        border-radius: 1rem;
        background: var(--www-surface);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .www-plan--featured {
        border-color: color-mix(in srgb, var(--www-brand) 55%, var(--www-line));
        box-shadow: 0 18px 40px rgba(215, 161, 74, 0.12);
      }
      .www-plan__badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        margin: 0;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--www-brand);
      }
      .www-plan h3 {
        margin: 0;
        font-family: var(--www-display);
        font-size: 1.5rem;
      }
      .www-plan__price {
        margin: 0.35rem 0 0;
        font-size: 1.75rem;
        font-weight: 650;
        letter-spacing: -0.02em;
      }
      .www-plan__blurb {
        margin: 0 0 1.25rem;
        color: var(--www-muted);
        flex: 1;
        line-height: 1.45;
      }

      .www-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 2.5rem clamp(1.25rem, 4vw, 3rem) 3rem;
        border-top: 1px solid var(--www-line);
        max-width: 72rem;
        margin: 0 auto;
      }
      .www-footer__brand {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
      }
      .www-footer__brand strong {
        display: block;
        font-size: 1rem;
      }
      .www-footer__brand p {
        margin: 0.15rem 0 0;
        color: var(--www-muted);
        font-size: 0.875rem;
      }
      .www-footer__nav {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 1.35rem;
        align-items: center;
        font-size: 0.875rem;
        font-weight: 550;
      }
      .www-footer__nav a {
        color: var(--www-ink);
        text-decoration: none;
      }
      .www-footer__muted {
        color: var(--www-muted);
      }

      @keyframes www-rise {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes www-ken {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(1.06);
        }
      }
    `,
  ],
})
export class WebsiteHomePageComponent {
  readonly flowSteps = [
    { mark: '1', label: 'Create' },
    { mark: '2', label: 'Generate QR' },
    { mark: '3', label: 'Guests Join' },
    { mark: '4', label: 'Experience Happens' },
    { mark: '5', label: 'Operate Calmly' },
  ];

  readonly packs = [
    {
      name: 'Restaurant',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Café',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Hotel',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Festival',
      image: 'https://images.unsplash.com/photo-1459749411175-04754421d915?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Airport',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109880b?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Healthcare',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
    },
  ];
}
