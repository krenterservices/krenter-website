import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { Property, PropertyService, Rental } from '../../services/property.service';
import { SeoService } from '../../services/seo.service';

interface RentalWithProperty extends Rental {
  property?: Property;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly seoService = inject(SeoService);
  currentUser: KrenterUser | null = null;
  ownedProperties: Property[] = [];
  rentedProperties: RentalWithProperty[] = [];
  activeTab: 'owned' | 'rented' = 'owned';
  isLoading = true;
  errorMessage = '';

  private authSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService
  ) { }

  ngOnInit(): void {
    this.seoService.setNoIndex('Dashboard');
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        void this.loadDashboard(user);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  async loadDashboard(target?: KrenterUser | string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    const user = typeof target === 'object' && target !== null 
      ? target 
      : this.currentUser;

    if (!user) {
      this.isLoading = false;
      return;
    }

    try {
      const [ownerProps, managerProps, canonicalRenters, legacyRentals, renterProps] = await Promise.all([
        this.propertyService.getPropertiesByOwner(user.uid, user.email),
        user.email ? this.propertyService.getPropertiesByManagerEmail(user.email, user.phone) : Promise.resolve([]),
        user.email ? this.propertyService.getRentersByRenterEmail(user.email, user.phone) : Promise.resolve([]),
        this.propertyService.getRentalsByRenter(user.uid),
        user.email ? this.propertyService.getPropertiesByRenterEmail(user.email, user.phone) : Promise.resolve([])
      ]);

      // Deduplicate owned / managed properties
      const propMap = new Map<string, Property>();
      for (const p of [...ownerProps, ...managerProps]) {
        if (p.id) propMap.set(p.id, p);
      }
      this.ownedProperties = Array.from(propMap.values());

      // Deduplicate rentals
      const rentalMap = new Map<string, RentalWithProperty>();
      for (const r of [...canonicalRenters, ...legacyRentals]) {
        const prop = r.propertyId ? await this.propertyService.getProperty(r.propertyId) : null;
        rentalMap.set(r.id || r.propertyId, {
          ...r,
          property: prop || undefined
        });
      }

      for (const prop of renterProps) {
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

      this.rentedProperties = Array.from(rentalMap.values());
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.errorMessage = 'We could not load your dashboard. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  selectTab(tab: 'owned' | 'rented'): void {
    this.activeTab = tab;
  }

  get activeRentalsCount(): number {
    return this.rentedProperties.filter(rental => rental.status === 'active').length;
  }

  get availableOwnedCount(): number {
    return this.ownedProperties.filter(property => property.isAvailable).length;
  }

  get monthlyRentalTotal(): number {
    return this.rentedProperties
      .filter(rental => rental.status === 'active')
      .reduce((total, rental) => total + Number(rental.rentalPrice || 0), 0);
  }

  getRemainingDays(endDate: Date | undefined): number | string {
    if (!endDate) {
      return 'No end date';
    }

    const difference = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 'Expired';
  }

  getRentalStatusClass(status: Rental['status']): string {
    return `text-bg-${status === 'active' ? 'success' : status === 'completed' ? 'secondary' : 'danger'}`;
  }
}
