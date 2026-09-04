import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { WebsiteHorizonComponent } from './website-horizon.component';

/**
 * Public marketing site — Fora.so structure, motion, and type language.
 * Identity carry-over: Lekki logo only. Dark canvas, Inter, pill chrome.
 */
@Component({
  standalone: true,
  imports: [RouterLink, WebsiteHorizonComponent],
  selector: 'leos-website-home',
  template: `
    <div class="lk" [class.lk--nav-open]="menuOpen">
      <header class="lk-nav">
        <a class="lk-nav__brand" routerLink="/" aria-label="Lekki home">
          <img src="/brand/lekki-logo-64.png" width="28" height="28" alt="" />
          <span>Lekki.</span>
        </a>
        <nav class="lk-nav__center" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="mailto:hello&#64;lekki.app">Contact</a>
        </nav>
        <div class="lk-nav__end">
          <a class="lk-link" routerLink="/signin" (pointerenter)="warmSignin()">Login</a>
          <a class="lk-pill lk-pill--ghost" routerLink="/signin" (pointerenter)="warmSignin()">Get started</a>
          <button
            type="button"
            class="lk-nav__burger"
            [attr.aria-expanded]="menuOpen"
            aria-label="Menu"
            (click)="menuOpen = !menuOpen"
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      @if (menuOpen) {
        <div class="lk-drawer" role="dialog" aria-label="Menu">
          <a href="#about" (click)="menuOpen = false">About</a>
          <a href="#features" (click)="menuOpen = false">Features</a>
          <a href="#pricing" (click)="menuOpen = false">Pricing</a>
          <a href="#faq" (click)="menuOpen = false">FAQ</a>
          <a href="mailto:hello&#64;lekki.app" (click)="menuOpen = false">Contact</a>
          <a routerLink="/signin" (pointerenter)="warmSignin()" (click)="menuOpen = false">Login</a>
          <a class="lk-pill lk-pill--solid" routerLink="/signin" (pointerenter)="warmSignin()" (click)="menuOpen = false">Get started</a>
        </div>
      }

      <leos-website-horizon>
        <div horizonCopy class="lk-hero__copy">
          <p class="lk-chip" data-rise>Experience platform for hospitality</p>
          <h1 class="lk-hero__title" data-rise>
            Your venue deserves<br />its own home.
          </h1>
          <p class="lk-hero__lead" data-rise>
            Lekki gives restaurants, cafés, hotels, and festivals a fully branded space
            with menus, orders, the kitchen, and the bill.
          </p>
          <a class="lk-pill lk-pill--solid lk-hero__cta" routerLink="/signin" (pointerenter)="warmSignin()" data-rise>Get started free</a>
        </div>

        <div horizonScreen class="lk-stage" data-rise-late>
          <div class="lk-app" aria-hidden="true">
            <aside class="lk-app__rail">
              @for (item of rail; track item.label) {
                <span [class.is-on]="item.on">{{ item.icon }} {{ item.label }}</span>
              }
            </aside>
            <div class="lk-app__body">
              <div class="lk-glow"></div>
              <div class="lk-card">
                <div class="lk-card__avatars">
                  <span>R</span><span>T</span><span>S</span>
                </div>
                <strong>Rusty Oak</strong>
                <p>12 at table</p>
                <a class="lk-pill lk-pill--solid lk-card__join">Join now</a>
                <ul>
                  <li>Scan once — the menu is already yours</li>
                  <li>Kitchen sees the ticket as it lands</li>
                  <li>The bill splits without a second screen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </leos-website-horizon>

      <section class="lk-intro" id="about" aria-labelledby="intro-title">
        <p class="lk-chip">Intro</p>
        <h2 id="intro-title" class="visually-hidden">What Lekki is</h2>
        <p class="lk-ink" data-ink>
          Lekki is an experience platform built for restaurants, cafés, hotels, and festivals.
          Menu, orders, kitchen, and the bill — all in one place, under one login, with one QR.
        </p>
        <p class="lk-ink" data-ink>
          That QR is yours. Every venue on Lekki runs on its own place codes.
          Guests join at the table. They never see our name on the experience, and they never should.
        </p>
        <p class="lk-ink" data-ink>
          You set it up in minutes. Lekki handles the routing, the payments, and the infrastructure
          in the background. What your guests experience is entirely yours.
        </p>
      </section>

      <section class="lk-block" id="features">
        <p class="lk-chip">Core Features</p>
        <div class="lk-split">
          <h2>One platform to run your entire floor.</h2>
          <p>
            Lekki brings your menu, orders, kitchen, and guests into one space, so you stop
            switching between tools and start spending time with the table.
          </p>
        </div>

        <div class="lk-tabs" role="tablist" aria-label="Product surfaces">
          @for (tab of tabs; track tab.id; let i = $index) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="feature === i"
              [class.is-on]="feature === i"
              (click)="feature = i"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="lk-showcase">
          <div class="lk-showcase__frame">
            <img class="lk-showcase__dusk" src="/brand/dusk-hero.png" alt="" />
            <div class="lk-showcase__ui">
              @switch (feature) {
                @case (0) {
                  <div class="lk-feed">
                    <header>
                      <strong>Menu</strong>
                      <span>Table 4</span>
                    </header>
                    <article>
                      <b>Classic Burger</b>
                      <span>R120 · Add</span>
                    </article>
                    <article>
                      <b>Garden Salad</b>
                      <span>R85 · Add</span>
                    </article>
                    <article>
                      <b>Craft Lager</b>
                      <span>R45 · Add</span>
                    </article>
                    <footer>What’s for the table?</footer>
                  </div>
                }
                @case (1) {
                  <div class="lk-feed">
                    <header>
                      <strong>Kitchen</strong>
                      <span>2 firing</span>
                    </header>
                    <article>
                      <b>T4 · Classic Burger</b>
                      <span>Now</span>
                    </article>
                    <article>
                      <b>T4 · Garden Salad</b>
                      <span>Hold</span>
                    </article>
                    <article>
                      <b>T2 · Weekend Roast</b>
                      <span>Ready</span>
                    </article>
                  </div>
                }
                @case (2) {
                  <div class="lk-feed">
                    <header>
                      <strong>Bill</strong>
                      <span>R248</span>
                    </header>
                    <article>
                      <b>Thabo · Burger</b>
                      <span>Claimed</span>
                    </article>
                    <article>
                      <b>Sarah · Salad</b>
                      <span>Claimed</span>
                    </article>
                    <article>
                      <b>Visit remaining</b>
                      <span>R0</span>
                    </article>
                  </div>
                }
                @default {
                  <div class="lk-feed">
                    <header>
                      <strong>Studio</strong>
                      <span>Live</span>
                    </header>
                    <article>
                      <b>Who are you welcoming?</b>
                      <span>Rusty Oak</span>
                    </article>
                    <article>
                      <b>Places</b>
                      <span>T1 · T2 · T3</span>
                    </article>
                    <article>
                      <b>Go Live</b>
                      <span>QR minted</span>
                    </article>
                  </div>
                }
              }
            </div>
          </div>
          <div class="lk-showcase__cap">
            <button type="button" class="lk-round" aria-label="Previous" (click)="prevFeature()">‹</button>
            <p>{{ tabs[feature].caption }}</p>
            <button type="button" class="lk-round" aria-label="Next" (click)="nextFeature()">›</button>
          </div>
        </div>
      </section>

      <section class="lk-block">
        <p class="lk-chip">What you get</p>
        <div class="lk-split">
          <h2>Set up once. Run it the way you want.</h2>
          <p>
            Lekki is built so you spend time with the floor, not configuring it.
            From your first setting to your hundredth guest, the platform stays out of your way.
          </p>
        </div>

        @for (card of gets; track card.kicker) {
          <article class="lk-get">
            <div class="lk-get__visual" [attr.data-kind]="card.kind" aria-hidden="true">
              <img src="/brand/dusk-close.png" alt="" />
              <div class="lk-get__glass">{{ card.visual }}</div>
            </div>
            <div class="lk-get__copy">
              <p class="lk-kicker">{{ card.kicker }}</p>
              <h3>{{ card.title }}</h3>
              <p>{{ card.body }}</p>
              <p class="lk-footline">{{ card.foot }}</p>
            </div>
          </article>
        }
      </section>

      <section class="lk-block" id="pricing">
        <p class="lk-chip">Pricing</p>
        <h2 class="lk-center-title">Clear pricing plans that scale with you</h2>
        <div class="lk-plans">
          @for (plan of plans; track plan.name) {
            <article class="lk-plan" [class.lk-plan--featured]="plan.featured">
              <p class="lk-plan__name">{{ plan.name }}</p>
              <p class="lk-plan__price">
                {{ plan.price }}
                @if (plan.period) {
                  <span>{{ plan.period }}</span>
                }
              </p>
              <p class="lk-plan__blurb">{{ plan.blurb }}</p>
              @if (plan.link) {
                <a class="lk-pill lk-pill--ghost" [routerLink]="plan.href">{{ plan.cta }}</a>
              } @else {
                <a class="lk-pill lk-pill--ghost" [href]="plan.href">{{ plan.cta }}</a>
              }
              <ul>
                @for (item of plan.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </article>
          }
        </div>
      </section>

      <section class="lk-block" id="faq">
        <p class="lk-chip">FAQ</p>
        <div class="lk-split">
          <h2>Answers to the questions that come up most.</h2>
          <p>
            Learn how Lekki works, what guests experience, and what to expect as you go live.
          </p>
        </div>
        <div class="lk-faq">
          @for (item of faqs; track item.q; let i = $index) {
            <div class="lk-faq__item">
              <button type="button" [attr.aria-expanded]="faqOpen === i" (click)="toggleFaq(i)">
                {{ item.q }}
                <span aria-hidden="true">{{ faqOpen === i ? '–' : '+' }}</span>
              </button>
              @if (faqOpen === i) {
                <p>{{ item.a }}</p>
              }
            </div>
          }
        </div>
        <p class="lk-faq__more">
          Can’t find what you’re looking for? Reach out — we’re fast.
          <a href="mailto:hello&#64;lekki.app">Contact us →</a>
        </p>
      </section>

      <section class="lk-close">
        <div class="lk-close__photo">
          <img src="/brand/dusk-close.png" alt="" />
        </div>
        <div class="lk-close__copy">
          <h2>Your first guest is one scan away.</h2>
          <p>
            Lekki is free to start. Set up your venue, print a QR, and see what it feels like
            when everything lives in one place — under your name.
          </p>
          <a class="lk-pill lk-pill--solid" routerLink="/signin">Start for free</a>
        </div>
        <aside class="lk-close__card">
          <strong>Rusty Oak</strong>
          <p>12 at table</p>
          <a class="lk-pill lk-pill--solid" routerLink="/e/qr-demo-restaurant">Join now</a>
          <p class="lk-close__bio">
            A neighbourhood table with a live guest experience — menu, kitchen, and bill in one QR.
          </p>
        </aside>
      </section>

      <footer class="lk-foot">
        <div class="lk-foot__brand">
          <img src="/brand/lekki-logo-64.png" width="40" height="40" alt="" />
          <p>The human experience app.</p>
        </div>
        <div class="lk-foot__cols">
          <div>
            <p>Product</p>
            <a href="#about">About</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="mailto:hello&#64;lekki.app">Contact</a>
          </div>
          <div>
            <p>Legal</p>
            <a routerLink="/terms">Terms of use</a>
            <a routerLink="/privacy">Privacy policy</a>
          </div>
          <div>
            <p>Enter</p>
            <a routerLink="/signin">Studio</a>
            <a routerLink="/e/qr-demo-restaurant">Guest demo</a>
            <a routerLink="/staff">Staff</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #00070d;
        color: #fff3f0;
        font-family: Inter, system-ui, sans-serif;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
      .lk {
        min-height: 100dvh;
        background: #00070d;
        overflow-x: hidden;
      }

      .lk-nav {
        position: sticky;
        top: 0;
        z-index: 40;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 1.25rem;
        background: linear-gradient(180deg, rgba(0, 7, 13, 0.86), rgba(0, 7, 13, 0));
      }
      .lk-nav__brand {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        color: #fff;
        text-decoration: none;
        font-weight: 650;
        letter-spacing: -0.03em;
        font-size: 1.05rem;
      }
      .lk-nav__brand img {
        display: block;
        border-radius: 8px;
      }
      .lk-nav__center {
        display: none;
        gap: 1.4rem;
        font-size: 0.875rem;
      }
      .lk-nav__center a,
      .lk-link {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
      }
      .lk-nav__center a:hover,
      .lk-link:hover {
        color: #fff;
      }
      .lk-nav__end {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.85rem;
      }
      .lk-nav__end .lk-link,
      .lk-nav__end .lk-pill {
        display: none;
      }
      @media (min-width: 960px) {
        .lk-nav__end .lk-link,
        .lk-nav__end .lk-pill {
          display: inline-flex;
        }
      }
      .lk-nav__burger {
        width: 2.4rem;
        height: 2.4rem;
        border: 0;
        background: transparent;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
        padding: 0 0.4rem;
        cursor: pointer;
      }
      .lk-nav__burger span {
        display: block;
        height: 1.5px;
        background: #fff;
        width: 100%;
      }
      @media (min-width: 960px) {
        .lk-nav__center {
          display: flex;
        }
        .lk-nav__burger {
          display: none;
        }
      }

      .lk-drawer {
        position: fixed;
        inset: 3.5rem 1rem auto;
        z-index: 39;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        padding: 1.25rem;
        border-radius: 1.25rem;
        background: rgba(10, 12, 16, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(8px);
      }
      .lk-drawer a {
        color: #fff;
        text-decoration: none;
        font-size: 1.05rem;
      }

      .lk-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.4rem;
        padding: 0 1.15rem;
        border-radius: 999px;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 550;
        border: 1px solid transparent;
        transition: background 180ms ease, transform 160ms ease, border-color 180ms ease;
      }
      .lk-pill--ghost {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.12);
      }
      .lk-pill--solid {
        background: rgba(255, 243, 240, 0.92);
        color: #0b1016;
      }
      .lk-pill:hover {
        transform: translateY(-1px);
      }

      .lk-chip {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        padding: 0 0.9rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 243, 240, 0.78);
        font-size: 0.8rem;
        margin: 0 0 1.25rem;
      }

      .lk-hero__copy {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
      }
      .lk-hero__copy > .lk-chip,
      .lk-hero__cta {
        width: max-content;
        max-width: 100%;
      }
      .lk-hero__title {
        margin: 0 auto 1.1rem;
        max-width: 16ch;
        font-size: clamp(2.4rem, 6vw, 3.5rem);
        font-weight: 500;
        letter-spacing: -0.045em;
        line-height: 1.18;
        color: #fff3f0;
      }
      .lk-hero__lead {
        margin: 0 auto 1.6rem;
        max-width: 38rem;
        color: rgba(255, 243, 240, 0.72);
        font-size: 1.05rem;
        line-height: 1.55;
      }
      .lk-hero__cta {
        min-height: 3rem;
        padding: 0 1.5rem;
        font-size: 0.95rem;
      }

      .lk-stage {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-self: stretch;
        width: 100%;
        max-width: 72rem;
        margin: 3.5rem auto 0;
        min-height: 28rem;
        padding-bottom: 7rem;
      }
      .lk-app {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 11rem 1fr;
        min-height: 24rem;
        margin: 0 6%;
        border-radius: 1.35rem;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(8, 10, 14, 0.72);
        backdrop-filter: blur(8px);
        box-shadow: 0 40px 80px rgba(0, 0, 0, 0.45);
      }
      @media (max-width: 720px) {
        .lk-stage {
          min-height: 0;
          margin-top: 2.2rem;
          padding-bottom: 5.5rem;
        }
        .lk-app {
          grid-template-columns: 3.2rem 1fr;
          min-height: 16rem;
          margin: 0 0.35rem;
        }
        .lk-app__body {
          min-height: 14rem;
        }
        .lk-app__rail span {
          font-size: 0;
        }
      }
      .lk-app__rail {
        padding: 1rem 0.7rem;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.55);
        font-size: 0.82rem;
      }
      .lk-app__rail .is-on {
        color: #fff;
      }
      .lk-app__body {
        position: relative;
        min-height: 22rem;
      }
      .lk-glow {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at 50% 40%, rgba(180, 220, 230, 0.55), transparent 55%),
          radial-gradient(ellipse at 30% 80%, rgba(90, 140, 160, 0.4), transparent 50%),
          #1a2830;
      }
      .lk-card {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -46%);
        width: min(22rem, 86%);
        padding: 1.35rem 1.4rem 1.2rem;
        border-radius: 1.15rem;
        background: rgba(12, 14, 18, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(8px);
        text-align: left;
        color: #fff;
      }
      .lk-card__avatars {
        display: flex;
        gap: 0.3rem;
        margin-bottom: 0.7rem;
      }
      .lk-card__avatars span {
        width: 1.7rem;
        height: 1.7rem;
        border-radius: 50%;
        background: #3a4450;
        display: grid;
        place-items: center;
        font-size: 0.7rem;
      }
      .lk-card p {
        margin: 0.2rem 0 0.9rem;
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.85rem;
      }
      .lk-card__join {
        min-height: 2.6rem;
        width: 100%;
      }
      .lk-card ul {
        margin: 0.9rem 0 0;
        padding: 0;
        list-style: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.82rem;
        line-height: 1.55;
      }

      .lk-intro,
      .lk-block {
        max-width: 68rem;
        margin: 0 auto;
        padding: 6.5rem 1.25rem 2rem;
      }
      .lk-ink {
        margin: 0 0 2.4rem;
        max-width: 46rem;
        font-size: clamp(1.35rem, 2.4vw, 1.85rem);
        line-height: 1.45;
        letter-spacing: -0.03em;
        color: rgba(255, 243, 240, 0.28);
        transition: color 900ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .lk-ink.is-lit {
        color: #fff3f0;
      }

      .lk-split {
        display: grid;
        gap: 1.25rem;
        margin-bottom: 2.5rem;
      }
      @media (min-width: 860px) {
        .lk-split {
          grid-template-columns: 1.15fr 0.85fr;
          align-items: end;
        }
      }
      .lk-split h2,
      .lk-center-title,
      .lk-get h3,
      .lk-close h2 {
        margin: 0;
        font-size: clamp(1.85rem, 3.4vw, 2.7rem);
        font-weight: 550;
        letter-spacing: -0.04em;
        line-height: 1.15;
      }
      .lk-split p,
      .lk-get__copy p {
        margin: 0;
        color: rgba(255, 243, 240, 0.7);
        line-height: 1.55;
      }
      .lk-center-title {
        text-align: center;
        margin: 0 0 2.5rem;
      }

      .lk-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1.5rem;
      }
      .lk-tabs button {
        border: 0;
        background: transparent;
        color: rgba(255, 255, 255, 0.6);
        padding: 0.55rem 0.95rem;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
      }
      .lk-tabs button.is-on {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .lk-showcase__frame {
        position: relative;
        border-radius: 1.5rem;
        overflow: hidden;
        min-height: 22rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .lk-showcase__dusk {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: brightness(0.45) saturate(0.8);
      }
      .lk-showcase__ui {
        position: relative;
        z-index: 1;
        padding: 1.5rem;
        display: flex;
        justify-content: center;
      }
      .lk-feed {
        width: min(28rem, 100%);
        border-radius: 1.1rem;
        background: rgba(10, 12, 16, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        overflow: hidden;
      }
      .lk-feed header,
      .lk-feed article,
      .lk-feed footer {
        display: flex;
        justify-content: space-between;
        padding: 0.9rem 1.1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .lk-feed footer {
        border: 0;
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.85rem;
      }
      .lk-showcase__cap {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 1rem;
        color: rgba(255, 243, 240, 0.8);
      }
      .lk-round {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        cursor: pointer;
        font-size: 1.2rem;
      }

      .lk-get {
        display: grid;
        gap: 1.5rem;
        margin: 0 0 3.5rem;
        padding: 1rem;
        border-radius: 1.5rem;
        background: #07090c;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      @media (min-width: 900px) {
        .lk-get {
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
        }
        .lk-get:nth-child(even) .lk-get__copy {
          order: -1;
        }
      }
      .lk-get__visual {
        position: relative;
        min-height: 16rem;
        border-radius: 1.15rem;
        overflow: hidden;
      }
      .lk-get__visual img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: brightness(0.55);
      }
      .lk-get__glass {
        position: absolute;
        inset: auto 8% 12%;
        padding: 0.9rem 1rem;
        border-radius: 0.9rem;
        background: rgba(12, 14, 18, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(8px);
        font-size: 0.9rem;
      }
      .lk-kicker,
      .lk-footline {
        font-size: 0.8rem;
        color: rgba(255, 243, 240, 0.5);
        letter-spacing: 0.02em;
      }
      .lk-get h3 {
        margin: 0.55rem 0 0.7rem;
        font-size: 1.7rem;
      }

      .lk-plans {
        display: grid;
        gap: 0.9rem;
      }
      @media (min-width: 900px) {
        .lk-plans {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      .lk-plan {
        padding: 1.5rem 1.35rem 1.6rem;
        border-radius: 1.25rem;
        background: #0a0c10;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .lk-plan--featured {
        outline: 1px solid rgba(255, 255, 255, 0.18);
      }
      .lk-plan__name {
        margin: 0 0 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.5);
      }
      .lk-plan__price {
        margin: 0;
        font-size: 2.4rem;
        letter-spacing: -0.04em;
      }
      .lk-plan__price span {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.45);
      }
      .lk-plan__blurb {
        min-height: 3.2rem;
        color: rgba(255, 255, 255, 0.65);
      }
      .lk-plan ul {
        margin: 1.2rem 0 0;
        padding: 0;
        list-style: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        line-height: 1.8;
      }

      .lk-faq__item {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .lk-faq__item button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        background: none;
        border: 0;
        color: #fff;
        text-align: left;
        padding: 1.15rem 0;
        font: inherit;
        font-size: 1.05rem;
        cursor: pointer;
      }
      .lk-faq__item p {
        margin: 0 0 1.1rem;
        color: rgba(255, 243, 240, 0.65);
        max-width: 40rem;
        line-height: 1.55;
      }
      .lk-faq__more {
        margin-top: 1.5rem;
        color: rgba(255, 255, 255, 0.55);
      }
      .lk-faq__more a {
        color: #fff;
      }

      .lk-close {
        position: relative;
        margin: 3rem 1rem 0;
        min-height: 28rem;
        border-radius: 1.5rem;
        overflow: hidden;
      }
      .lk-close__photo,
      .lk-close__photo img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .lk-close__copy,
      .lk-close__card {
        position: relative;
        z-index: 1;
      }
      .lk-close__copy {
        padding: 3rem 1.5rem 2rem;
        max-width: 28rem;
      }
      .lk-close__copy p {
        color: rgba(255, 243, 240, 0.78);
        line-height: 1.55;
      }
      .lk-close__card {
        margin: 0 1.25rem 2rem auto;
        max-width: 22rem;
        padding: 1.2rem 1.3rem;
        border-radius: 1.15rem;
        background: rgba(8, 10, 14, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(8px);
      }
      .lk-close__bio {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .lk-foot {
        display: grid;
        gap: 2rem;
        padding: 4rem 1.5rem 3rem;
        max-width: 68rem;
        margin: 0 auto;
      }
      @media (min-width: 800px) {
        .lk-foot {
          grid-template-columns: 1fr 2fr;
        }
      }
      .lk-foot__brand p {
        color: rgba(255, 255, 255, 0.5);
      }
      .lk-foot__cols {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
      .lk-foot__cols p {
        margin: 0 0 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
      }
      .lk-foot__cols a {
        display: block;
        color: rgba(255, 255, 255, 0.78);
        text-decoration: none;
        margin: 0.35rem 0;
        font-size: 0.9rem;
      }

      @media (prefers-reduced-motion: no-preference) {
        [data-rise] {
          opacity: 0;
          transform: translateY(18px);
          animation: lk-rise 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        [data-rise]:nth-of-type(1) {
          animation-delay: 80ms;
        }
        .lk-hero__title[data-rise] {
          animation-delay: 180ms;
        }
        .lk-hero__lead[data-rise] {
          animation-delay: 280ms;
        }
        .lk-hero__cta[data-rise] {
          animation-delay: 380ms;
        }
        [data-rise-late] {
          opacity: 0;
          transform: translateY(40px);
          animation: lk-rise 1100ms cubic-bezier(0.22, 1, 0.36, 1) 520ms forwards;
        }
      }
      @keyframes lk-rise {
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class WebsiteHomePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private observer?: IntersectionObserver;
  private reducedMotion = false;

  menuOpen = false;
  feature = 0;
  faqOpen: number | null = 0;

  readonly rail = [
    { icon: '◎', label: 'Overview', on: true },
    { icon: '☰', label: 'Menu', on: false },
    { icon: '◷', label: 'Kitchen', on: false },
    { icon: '◇', label: 'Bill', on: false },
    { icon: '▣', label: 'Team', on: false },
    { icon: '✧', label: 'Grow', on: false },
  ];

  readonly tabs = [
    { id: 'guest', label: 'Guest', caption: 'Scan, browse, order — the path your guests live in.' },
    { id: 'kitchen', label: 'Kitchen', caption: 'Tickets land where the work actually happens.' },
    { id: 'bill', label: 'Bill', caption: 'Pay, split, leave — without a second conversation.' },
    { id: 'studio', label: 'Studio', caption: 'Create. Configure. Go live. Operate.' },
  ];

  readonly gets = [
    {
      kicker: 'Your front door',
      title: 'A guest arrival that sells itself.',
      body: 'Print a QR. Add a headline. The first screen a visitor sees is already yours — menu, place, and confidence in one scan.',
      foot: 'First impressions that convert.',
      visual: 'Table 4 · live',
      kind: 'door',
    },
    {
      kicker: 'The floor',
      title: 'A station board your team actually checks.',
      body: 'Kitchen, bar, and waiter share one visit. Ranked by what’s on now — not by another app they have to remember.',
      foot: 'Calm that compounds over service.',
      visual: '2 firing · 1 ready',
      kind: 'floor',
    },
    {
      kicker: 'The menu',
      title: 'Build the catalogue the way you cook.',
      body: 'Structure dishes, drinks, and specials in any order. Publish once. Guests learn it inside the same visit they already live in.',
      foot: 'A menu that feels like yours, not a template.',
      visual: 'Type / for a course',
      kind: 'menu',
    },
  ];

  readonly plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '/month',
      blurb: 'Everything you need to launch one venue.',
      cta: 'Get Started',
      link: true,
      href: '/signin',
      featured: false,
      items: ['One venue', 'Guest QR & menu', 'Kitchen tickets', 'Bill & split', 'Staff PIN', 'Analytics'],
    },
    {
      name: 'Pro',
      price: '$0',
      period: '/month',
      blurb: 'For operators serious about their brand.',
      cta: 'Get Started',
      link: true,
      href: '/signin',
      featured: true,
      items: [
        'Everything in Starter',
        'Custom domain feel',
        'Pay at table',
        'Multiple places',
        'Operate board',
        'Grow briefing',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      blurb: 'For groups that need more control.',
      cta: 'Contact us',
      link: false,
      href: 'mailto:hello@lekki.app',
      featured: false,
      items: [
        'Unlimited venues',
        'Everything in Pro',
        'Priority support',
        'Dedicated onboarding',
        'SLA',
        'Custom contract',
      ],
    },
  ];

  readonly faqs = [
    {
      q: 'What is Lekki?',
      a: 'Lekki is an experience platform for hospitality. You get a fully branded guest space with menus, orders, kitchen, and the bill — running from a QR you own.',
    },
    {
      q: 'How long does it take to set up?',
      a: 'Most venues are live in minutes. You name the place, add the menu, mint a QR, and invite the floor. No code, no infrastructure.',
    },
    {
      q: 'Do I need technical knowledge?',
      a: 'Not at all. Everything happens through Studio. Guests never install an app — they scan and they’re in.',
    },
    {
      q: 'Is Lekki really free right now?',
      a: 'Yes. Start without a card. When paid plans launch, early venues keep what they already built.',
    },
    {
      q: 'What do guests see?',
      a: 'Your venue. Your menu. Your bill. They never land on a Lekki marketing page in the middle of dinner.',
    },
  ];

  ngOnInit() {
    this.title.setTitle('Lekki — Your venue deserves its own home');
    this.meta.updateTag({
      name: 'description',
      content:
        'Lekki gives restaurants, cafés, hotels, and festivals a fully branded guest space with menus, orders, kitchen, and the bill.',
    });
    this.meta.updateTag({ property: 'og:title', content: 'Lekki — Your venue deserves its own home' });
    this.meta.updateTag({
      property: 'og:description',
      content: 'One QR. One floor. Set up in minutes.',
    });
    this.meta.updateTag({ name: 'theme-color', content: '#00070d' });
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.menuOpen = false;
  }

  prevFeature() {
    this.feature = (this.feature + this.tabs.length - 1) % this.tabs.length;
  }
  nextFeature() {
    this.feature = (this.feature + 1) % this.tabs.length;
  }
  toggleFaq(i: number) {
    this.faqOpen = this.faqOpen === i ? null : i;
  }

  warmSignin() {
    void import('./studio-signin.page');
  }

  ngAfterViewInit(): void {
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    window.setTimeout(() => this.warmSignin(), 0);

    const items = Array.from(this.host.nativeElement.querySelectorAll('[data-ink]')) as HTMLElement[];
    if (!items.length || typeof IntersectionObserver === 'undefined') return;
    if (this.reducedMotion) {
      items.forEach((el) => el.classList.add('is-lit'));
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-lit', entry.isIntersecting);
        }
      },
      { threshold: 0.4, rootMargin: '0px 0px -10% 0px' },
    );
    items.forEach((el) => this.observer!.observe(el));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
