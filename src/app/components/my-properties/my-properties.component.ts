import { Component, OnInit, OnDestroy } from '@angular/core';
import { PropertyService, Property, Rental } from '../../services/property.service';
import { UserService } from '../../services/user.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

interface PropertyWithRenters extends Property {
  renters?: Partial<Rental>[];
}

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-properties.component.html',
  styleUrls: ['./my-properties.component.scss']
})
export class MyPropertiesComponent implements OnInit, OnDestroy {
  myProperties: PropertyWithRenters[] = [];
  currentUser: KrenterUser | null = null;
  isLoading = true;
  errorMessage = '';
  expandedPropertyId: string | null = null;
  private authSubscription: Subscription | undefined;

  constructor(
    private propertyService: PropertyService,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user && user.role === 'owner') {
        this.loadProperties(user.uid);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async loadProperties(ownerId: string): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      const properties = await this.propertyService.getPropertiesByOwner(ownerId);

      // Load renters for each property
      this.myProperties = await Promise.all(
        properties.map(async (property) => {
          const renters = await this.propertyService.getRentersForProperty(property.id!);
          return {
            ...property,
            renters: renters
          };
        })
      );
    } catch (error) {
      console.error('Error loading properties:', error);
      this.errorMessage = 'Failed to load properties. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async deleteProperty(propertyId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        const success = await this.propertyService.deleteProperty(propertyId);
        if (success && this.currentUser) {
          await this.loadProperties(this.currentUser.uid);
        } else {
          this.errorMessage = 'Failed to delete property.';
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        this.errorMessage = 'Failed to delete property.';
      }
    }
  }

  async getRenterDetails(renterId: string): Promise<Partial<any>> {
    try {
      const renter = await this.userService.getRenterDetails(renterId);
      return renter || {};
    } catch (error) {
      console.error('Error fetching renter details:', error);
      return {};
    }
  }

  togglePropertyDetails(propertyId: string): void {
    this.expandedPropertyId = this.expandedPropertyId === propertyId ? null : propertyId;
  }

  getStatusBadge(isAvailable: boolean): string {
    return isAvailable ? 'Available' : 'Rented';
  }
}
