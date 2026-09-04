import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { seoForPath } from '../studio/marketing-seo';

@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'leos-terms',
  template: `
    <main class="legal">
      <a routerLink="/">← Lekki</a>
      <h1>Terms</h1>
      <p>
        LEOS Studio is provided to venue operators under subscription. Each venue is merchant of
        record for guest payments processed through their chosen connector (e.g. PayFast).
      </p>
      <p>
        Guests joining via QR agree to venue house rules displayed at entry. Platform terms may be
        updated with notice to operators.
      </p>
      <p>Questions: <a href="mailto:hello&#64;lekki.io">hello&#64;lekki.io</a>.</p>
    </main>
  `,
  styles: [
    `
      .legal {
        max-width: 40rem;
        margin: 0 auto;
        padding: 2rem 1.25rem 4rem;
        font-family: 'Sora', system-ui, sans-serif;
        line-height: 1.55;
        color: #f6f1ea;
        min-height: 100dvh;
      }
      h1 {
        font-family: 'Fraunces', Georgia, serif;
      }
      a {
        color: #d7a14a;
      }
    `,
  ],
})
export class TermsPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit() {
    const seo = seoForPath('/terms');
    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
  }
}
