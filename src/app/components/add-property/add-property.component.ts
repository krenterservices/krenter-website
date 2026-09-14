import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss']
})
export class AddPropertyComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly authService = inject(AuthService);
  propertyForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) {
    this.propertyForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      location: ['', Validators.required],
      society: [''],
      address: [''],
      city: [''],
      state: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.seoService.setNoIndex('Add Property');
  }

  async onSubmit() {
    if (this.propertyForm.valid) {
      this.isSubmitting = true;
      try {
        const user = this.authService.getCurrentUserSync();
        const formVal = this.propertyForm.value;

        const propertyData = {
          ...formVal,
          price: Number(formVal.price) || 0,
          ownerId: user?.uid || '',
          ownerEmailId: user?.email || '',
          ownerPhoneNumber: user?.phone || '',
          isAvailable: true
        };

        await this.propertyService.addProperty(propertyData);

        if (user?.uid) {
          await this.authService.markUserAsOwner(user.uid);
        }

        await this.router.navigate(['/my-properties']);
      } catch (err) {
        console.error('Error adding property:', err);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}

