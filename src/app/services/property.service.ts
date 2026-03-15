import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  private properties: any[] = [
    { id: 1, type: 'Flat', name: 'Modern Downtown Flat', price: 1200, location: 'New York', ownerId: 2, rented: false, rentedBy: null },
    { id: 2, type: 'House', name: 'Cozy Suburban House', price: 2500, location: 'San Francisco', ownerId: 2, rented: false, rentedBy: null },
    { id: 3, type: 'Flat', name: 'Sunny Beachside Apartment', price: 1800, location: 'Los Angeles', ownerId: 3, rented: false, rentedBy: null },
    { id: 4, type: 'House', name: 'Rustic Country House', price: 1500, location: 'Austin', ownerId: 3, rented: false, rentedBy: null }
  ];

  getProperties() {
    return this.properties;
  }

  getProperty(id: number) {
    return this.properties.find(p => p.id === id);
  }

  addProperty(property: any) {
    const newProperty = { ...property, id: this.properties.length + 1, rented: false, rentedBy: null };
    this.properties.push(newProperty);
  }

  updateProperty(updatedProperty: any) {
    const index = this.properties.findIndex(p => p.id === updatedProperty.id);
    if (index !== -1) {
      this.properties[index] = { ...this.properties[index], ...updatedProperty };
    }
  }

  deleteProperty(propertyId: number) {
    this.properties = this.properties.filter(p => p.id !== propertyId);
  }

  getPropertiesByOwner(ownerId: number) {
    return this.properties.filter(p => p.ownerId === ownerId);
  }

  rentProperty(propertyId: number, userId: number) {
    const property = this.getProperty(propertyId);
    if (property) {
      property.rented = true;
      property.rentedBy = userId;
    }
  }

  getRentalsByUser(userId: number) {
    return this.properties.filter(p => p.rentedBy === userId);
  }
}
