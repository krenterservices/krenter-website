import { Component, OnInit } from '@angular/core';
import { PropertyService } from '../../services/property.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-rentals.component.html',
  styleUrls: ['./my-rentals.component.scss']
})
export class MyRentalsComponent implements OnInit {
  rentedProperties: any[] = [];

  constructor(private propertyService: PropertyService) { }

  ngOnInit(): void {
    // In a real app, you'd get the user's ID from the auth service
    this.rentedProperties = this.propertyService.getRentalsByUser(1);
  }
}
