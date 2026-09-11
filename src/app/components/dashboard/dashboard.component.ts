import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { Property, PropertyService, Rental } from '../../services/property.service';

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
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        void this.loadDashboard(user.uid);
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  async loadDashboard(userId: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [ownedProperties, rentals] = await Promise.all([
        this.propertyService.getPropertiesByOwner(userId),
        this.propertyService.getRentalsByRenter(userId)
      ]);

      this.ownedProperties = ownedProperties;
      this.rentedProperties = await Promise.all(
        rentals.map(async rental => ({
          ...rental,
          property: await this.propertyService.getProperty(rental.propertyId) || undefined
        }))
      );
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
