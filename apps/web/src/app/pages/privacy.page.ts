import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { seoForPath } from '../studio/marketing-seo';

@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'leos-privacy',
  template: `
    <main class="legal">
      <a routerLink="/">← Lekki</a>
      <h1>Privacy</h1>
      <p>
        Lekki processes guest first names and order data on behalf of each venue. We do not sell
        personal information. Venues are the data controllers for their guests; Lekki provides the
        platform under contract.
      </p>
      <p>
        For POPIA-related requests, contact your venue first. Platform enquiries:
        <a href="mailto:privacy&#64;lekki.io">privacy&#64;lekki.io</a>.
      </p>
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
export class PrivacyPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit() {
    const seo = seoForPath('/privacy');
    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
  }
}
