import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms-of-use.component.html',
  styleUrl: './terms-of-use.component.scss',
})
export class TermsOfUseComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  readonly effectiveDate = 'September 11, 2026';
  readonly contactEmail = 'support@krenter.app';

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Terms of Use | Krenter Property Management',
      description:
        'Terms of Use for Krenter (krenter.org) web and mobile applications covering account rules, permitted use, subscription fees, payment processing, landlord-tenant relations, arbitration, and dispute resolution.',
      keywords:
        'Krenter terms of use, terms of service, user agreement, rental agreement terms, landlord tenant rules, arbitration agreement',
      canonicalUrl: 'https://krenter.org/terms',
      ogTitle: 'Terms of Use | Krenter',
      ogDescription:
        'Terms of Use and legal agreement governing access and use of Krenter web and mobile applications.',
      ogImage: '/krenter-logo.png',
      ogType: 'article'
    });
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
