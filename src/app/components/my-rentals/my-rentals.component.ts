import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { PropertyService, Rental, Property } from '../../services/property.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

interface RentalWithProperty extends Rental {
  property?: Property;
  ownerDetails?: Partial<any>;
}

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-rentals.component.html',
  styleUrls: ['./my-rentals.component.scss']
})
export class MyRentalsComponent implements OnInit, OnDestroy {
  private readonly seoService = inject(SeoService);
  myRentals: RentalWithProperty[] = [];
  currentUser: KrenterUser | null = null;
  isLoading = true;
  errorMessage = '';
  private authSubscription: Subscription | undefined;

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.seoService.setNoIndex('My Rentals');
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadRentals(user);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async loadRentals(user: KrenterUser): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      // 1. Load canonical records from 'renters' collection
      const canonicalRenters = user.email
        ? await this.propertyService.getRentersByRenterEmail(user.email, user.phone)
        : [];

      // 2. Load legacy rentals by UID
      const legacyRentals = await this.propertyService.getRentalsByRenter(user.uid);

      // 3. Load properties where owner added renter's email or phone directly
      const renterProperties = user.email
        ? await this.propertyService.getPropertiesByRenterEmail(user.email, user.phone)
        : [];

      // Build consolidated rental map
      const rentalMap = new Map<string, RentalWithProperty>();

      for (const r of [...canonicalRenters, ...legacyRentals]) {
        const prop = r.propertyId ? await this.propertyService.getProperty(r.propertyId) : null;
        rentalMap.set(r.id || r.propertyId, {
          ...r,
          property: prop || undefined
        });
      }

      // Add any direct properties matching renter's email/phone not yet in rentalMap
      for (const prop of renterProperties) {
        if (prop.id && !rentalMap.has(prop.id)) {
          rentalMap.set(prop.id, {
            id: prop.id,
            propertyId: prop.id,
            ownerId: prop.ownerId || '',
            ownerEmailId: prop.ownerEmailId || '',
            renterId: user.uid,
            renterEmailId: prop.renterEmailId || user.email || '',
            rentalPrice: prop.price,
            startDate: prop.createdAt || new Date(),
            status: 'active',
            property: prop
          });
        }
      }

      this.myRentals = Array.from(rentalMap.values());
    } catch (error) {
      console.error('Error loading rentals:', error);
      this.errorMessage = 'Failed to load your rentals. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return '';
    }
  }

  getRemainingDays(endDate: Date | undefined): number | string {
    if (!endDate) return 'N/A';
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 'Expired';
  }
}
