import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Support Center & FAQs | Krenter Property Management',
      description:
        'Get help with Krenter property management platform. Find answers to common questions about rent payments, tenant maintenance requests, and property listings.',
      keywords:
        'Krenter support, property management help, landlord questions, tenant service help, rent payment support',
      canonicalUrl: 'https://krenter.org/support',
      ogTitle: 'Support Center & FAQs | Krenter Property Management',
      ogDescription:
        'Need help managing properties or paying rent? Visit Krenter support center for answers and contact information.',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I add a new property?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Log in to your account and navigate to Add Property from the main menu. Fill in all required property details including address, price, amenities, and upload photos.'
            }
          },
          {
            '@type': 'Question',
            name: 'How do I manage my rentals?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Visit the My Rentals section to view active and past rentals, track dates, rental prices, and payment histories.'
            }
          },
          {
            '@type': 'Question',
            name: 'Is my personal and payment information secure?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all personal and payment information is encrypted with industry-standard protocols, TLS in transit, and AES encryption at rest.'
            }
          }
        ]
      }
    });
  }
}

