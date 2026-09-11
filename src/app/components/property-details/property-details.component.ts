import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { SeoService } from '../../services/seo.service';
import { CommonModule } from '@angular/common';
import { RentConfirmationModalComponent } from '../rent-confirmation-modal/rent-confirmation-modal.component';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RentConfirmationModalComponent],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  property: any;
  isRented = false;
  showModal = false;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService
  ) { }

  ngOnInit(): void {
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (propertyId) {
      this.property = this.propertyService.getProperty(propertyId);
      this.isRented = this.property?.rented;

      if (this.property) {
        const title = `${this.property.name} - ${this.property.type} for Rent in ${this.property.location} | Krenter`;
        const description =
          this.property.description ||
          `${this.property.name}, a ${this.property.type} available for rent in ${this.property.location} for $${this.property.price}/month.`;
        const image = this.property.images?.[0] || '/krenter-logo.png';
        const canonical = `https://krenter.org/property/${this.property.id || propertyId}`;

        this.seoService.setSeoData({
          title,
          description,
          keywords: `${this.property.type} for rent, ${this.property.location} rentals, ${this.property.name}, Krenter`,
          canonicalUrl: canonical,
          ogTitle: title,
          ogDescription: description,
          ogImage: image,
          ogType: 'article',
          schemaJson: {
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: this.property.name,
            description,
            url: canonical,
            offers: {
              '@type': 'Offer',
              price: this.property.price,
              priceCurrency: 'USD',
              availability: this.isRented ? 'https://schema.org/Sold' : 'https://schema.org/InStock'
            }
          }
        });
      } else {
        this.seoService.setSeoData({
          title: 'Property Details | Krenter',
          description: 'View property rental details, pricing, amenities, and location on Krenter.',
          canonicalUrl: `https://krenter.org/property/${propertyId}`
        });
      }
    }
  }

  openRentModal() {
    this.showModal = true;
  }

  onConfirmRent() {
    this.isRented = true;
    this.showModal = false;
    if (this.property) {
      // In a real app, you'd get the user's ID from the auth service
      this.propertyService.rentProperty(this.property.id);
    }
  }

  onCancelRent() {
    this.showModal = false;
  }
}
