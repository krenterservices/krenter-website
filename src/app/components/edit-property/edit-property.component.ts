import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { SeoService } from '../../services/seo.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-property.component.html',
  styleUrls: ['./edit-property.component.scss']
})
export class EditPropertyComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  propertyForm: FormGroup;
  propertyId: string = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.propertyForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      location: ['', Validators.required],
      description: [''],
      amenities: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    this.seoService.setNoIndex('Edit Property');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyId = id;
      try {
        const property = await this.propertyService.getProperty(this.propertyId);
        if (property) {
          this.propertyForm.patchValue({
            name: property.name,
            type: property.type,
            price: property.price,
            location: property.location,
            description: property.description,
            amenities: property.amenities?.join(', ')
          });
        } else {
          this.errorMessage = 'Property not found';
        }
      } catch (error) {
        this.errorMessage = 'Error loading property';
        console.error('Error loading property:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.propertyForm.valid && this.propertyId) {
      try {
        const amenities = this.propertyForm.value.amenities
          ? this.propertyForm.value.amenities.split(',').map((a: string) => a.trim())
          : [];

        const success = await this.propertyService.updateProperty(this.propertyId, {
          ...this.propertyForm.value,
          amenities: amenities
        });

        if (success) {
          this.router.navigate(['/my-properties']);
        } else {
          this.errorMessage = 'Failed to update property';
        }
      } catch (error) {
        this.errorMessage = 'Error updating property';
        console.error('Error updating property:', error);
      }
    }
  }
}
