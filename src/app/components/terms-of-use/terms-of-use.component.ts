import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms-of-use.component.html',
  styleUrl: './terms-of-use.component.scss',
})
export class TermsOfUseComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly effectiveDate = 'September 11, 2026';
  readonly contactEmail = 'support@krenter.app';

  ngOnInit(): void {
    this.titleService.setTitle('Terms of Use | Krenter Property Management');

    this.metaService.updateTag({
      name: 'description',
      content:
        'Terms of Use for Krenter (krenter.org) web and mobile applications covering account rules, permitted use, subscription fees, payment processing, landlord-tenant relations, arbitration, and dispute resolution.',
    });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ property: 'og:title', content: 'Terms of Use | Krenter' });
    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Terms of Use and legal agreement governing access and use of Krenter web and mobile applications.',
    });
    this.metaService.updateTag({ property: 'og:image', content: '/krenter-logo.png' });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
  }

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();
    if (typeof document !== 'undefined') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}
