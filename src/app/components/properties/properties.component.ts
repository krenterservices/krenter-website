import { Component, OnInit } from '@angular/core';
import { PropertyService } from '../../services/property.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements OnInit {
  allProperties: any[] = [];
  filteredProperties: any[] = [];
  paginatedProperties: any[] = [];
  uniqueTypes: string[] = [];
  uniqueLocations: string[] = [];

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  private filters = {
    searchTerm: '',
    type: '',
    location: ''
  };
  private sortKey = 'price-asc';

  constructor(private propertyService: PropertyService) { }

  ngOnInit(): void {
    this.propertyService.getProperties().then(properties => {
      this.allProperties = properties;
    });
    // this.allProperties = this.propertyService.getProperties();
    this.uniqueTypes = [...new Set(this.allProperties.map(p => p.type))];
    this.uniqueLocations = [...new Set(this.allProperties.map(p => p.location))];
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    // Filtering
    this.filteredProperties = this.allProperties.filter(p => {
      const searchTermMatch = p.name.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
                              p.type.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
                              p.location.toLowerCase().includes(this.filters.searchTerm.toLowerCase());
      const typeMatch = this.filters.type ? p.type === this.filters.type : true;
      const locationMatch = this.filters.location ? p.location === this.filters.location : true;
      return searchTermMatch && typeMatch && locationMatch;
    });

    // Sorting
    this.filteredProperties.sort((a, b) => {
      const [key, order] = this.sortKey.split('-');
      const valA = a[key];
      const valB = b[key];
      const comparison = valA > valB ? 1 : (valA < valB ? -1 : 0);
      return order === 'asc' ? comparison : -comparison;
    });

    this.totalPages = Math.ceil(this.filteredProperties.length / this.itemsPerPage);
    this.changePage(1);
  }

  onSearch(event: Event) {
    this.filters.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFiltersAndSort();
  }

  onFilterChange(event: Event, filterType: 'type' | 'location') {
    this.filters[filterType] = (event.target as HTMLSelectElement).value;
    this.applyFiltersAndSort();
  }

  onSortChange(event: Event) {
    this.sortKey = (event.target as HTMLSelectElement).value;
    this.applyFiltersAndSort();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const startIndex = (page - 1) * this.itemsPerPage;
    this.paginatedProperties = this.filteredProperties.slice(startIndex, startIndex + this.itemsPerPage);
  }
}
