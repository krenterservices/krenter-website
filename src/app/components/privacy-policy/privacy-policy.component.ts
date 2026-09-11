import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  readonly lastModifiedDate = 'September 11, 2026';
  readonly contactEmail = 'support@krenter.app';

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Privacy Policy | Krenter Property Management',
      description:
        'Privacy Policy for Krenter web and mobile applications (iOS and Android). Learn how Krenter collects, protects, and manages your personal data in compliance with GDPR, CCPA, and App Store guidelines.',
      keywords:
        'Krenter privacy policy, data privacy, property management privacy, GDPR, CCPA, user data protection',
      canonicalUrl: 'https://krenter.org/privacy-policy',
      ogTitle: 'Privacy Policy | Krenter',
      ogDescription:
        'Learn how Krenter protects your privacy across our web platform and iOS/Android mobile applications.',
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
