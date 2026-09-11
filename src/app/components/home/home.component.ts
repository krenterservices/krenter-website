import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Krenter | Property Management Platform for Landlords & Tenants',
      description:
        'Krenter connects property owners, landlords, and tenants in their local areas. Effortlessly manage rental properties, collect and pay rent smoothly online, handle tenant maintenance and service requests, and streamline leasing.',
      keywords:
        'property management, rent collection, pay rent online, landlord software, tenant maintenance requests, rental service requests, lease management, local rental platform, Krenter',
      canonicalUrl: 'https://krenter.org/',
      ogTitle: 'Krenter - Smart Property Management for Landlords & Tenants',
      ogDescription:
        'Smooth online rent payments, instant tenant service requests, and complete local rental management for owners and renters.',
      ogImage: '/krenter-logo.png',
      schemaJson: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Krenter',
          url: 'https://krenter.org/',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://krenter.org/properties?search={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Krenter, Inc.',
          url: 'https://krenter.org',
          logo: 'https://krenter.org/krenter-logo.png',
          sameAs: [
            'https://apps.apple.com',
            'https://play.google.com'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'support@krenter.app',
            contactType: 'Customer Support'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Krenter Rental Management',
          operatingSystem: 'Web, iOS, Android',
          applicationCategory: 'BusinessApplication',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          description:
            'All-in-one property management solution facilitating smooth rent payments, maintenance coordination, and tenant-landlord communication in local areas.'
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is Krenter and who is it for?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Krenter is an all-in-one rental and property management platform designed for independent property owners, landlords, renters, and tenants to manage properties, payments, and service requests in their local areas.'
              }
            },
            {
              '@type': 'Question',
              name: 'How does Krenter handle rent payments smoothly?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Krenter enables automated, secure online rent payments via ACH bank transfer, debit cards, and credit cards with automated payment receipts, recurring schedules, and real-time tracking.'
              }
            },
            {
              '@type': 'Question',
              name: 'How do tenants submit maintenance and service requests?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Tenants can submit service tickets directly through the Krenter mobile app or website with photos, descriptions, and urgency levels. Landlords receive immediate notifications and can track repairs to completion.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can landlords list and manage properties in their respective local areas?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, landlords can add single-family homes, multi-family units, apartments, or rooms in their specific zip codes and geographic areas, manage listings, screen applicants, and track leases effortlessly.'
              }
            }
          ]
        }
      ]
    });
  }
}
