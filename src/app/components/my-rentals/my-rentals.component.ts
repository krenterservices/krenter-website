import { Component, OnInit, OnDestroy } from '@angular/core';
import { PropertyService, Rental, Property } from '../../services/property.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
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
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user && user.role === 'renter') {
        this.loadRentals(user.uid);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async loadRentals(renterId: string): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      const rentals = await this.propertyService.getRentalsByRenter(renterId);

      // Load property details for each rental
      this.myRentals = await Promise.all(
        rentals.map(async (rental) => {
          const property = await this.propertyService.getProperty(rental.propertyId);
          return {
            ...rental,
            property: property || undefined
          };
        })
      );
    } catch (error) {
      console.error('Error loading rentals:', error);
      this.errorMessage = 'Failed to load your rentals. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  getStatusColor(status: string): string {
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
