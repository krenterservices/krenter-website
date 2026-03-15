import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../services/property.service';
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
      this.property = this.propertyService.getProperty(+propertyId);
      this.isRented = this.property?.rented;
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
      this.propertyService.rentProperty(this.property.id, 1);
    }
  }

  onCancelRent() {
    this.showModal = false;
  }
}
