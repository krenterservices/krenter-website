import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly lastModifiedDate = 'September 11, 2026';
  readonly contactEmail = 'support@krenter.app';

  ngOnInit(): void {
    this.titleService.setTitle('Privacy Policy | Krenter Property Management');

    this.metaService.updateTag({
      name: 'description',
      content:
        'Privacy Policy for Krenter web and mobile applications (iOS and Android). Learn how Krenter collects, protects, and manages your personal data in compliance with GDPR, CCPA, and App Store guidelines.',
    });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ property: 'og:title', content: 'Privacy Policy | Krenter' });
    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Learn how Krenter protects your privacy across our web platform and iOS/Android mobile applications.',
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
