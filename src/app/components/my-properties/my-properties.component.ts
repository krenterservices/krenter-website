import { Component, OnInit, OnDestroy } from '@angular/core';
import { PropertyService } from '../../services/property.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-properties.component.html',
  styleUrls: ['./my-properties.component.scss']
})
export class MyPropertiesComponent implements OnInit, OnDestroy {
  myProperties: any[] = [];
  private authSubscription!: Subscription;

  constructor(
    private propertyService: PropertyService,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.loadProperties(user.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  loadProperties(ownerId: number): void {
    this.myProperties = this.propertyService.getPropertiesByOwner(ownerId);
  }

  deleteProperty(propertyId: number): void {
    this.propertyService.deleteProperty(propertyId);
    this.authService.currentUser.subscribe(user => {
      if (user) this.loadProperties(user.id);
    }).unsubscribe();
  }

  getRenterEmail(renterId: number): string {
    if (!renterId) return 'N/A';
    const renter = this.userService.getUserById(renterId);
    return renter ? renter.email : 'Unknown';
  }
}
