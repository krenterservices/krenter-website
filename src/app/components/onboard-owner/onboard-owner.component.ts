import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { PropertyService, Property, Renter } from '../../services/property.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-onboard-owner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './onboard-owner.component.html',
  styleUrls: ['./onboard-owner.component.scss']
})
export class OnboardOwnerComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  onboardingForm!: FormGroup;
  currentUser: KrenterUser | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  hasTenant = false;
  hasManager = false;

  private userSub?: Subscription;

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Onboard Property & Owner | Krenter',
      description: 'List your property on Krenter. Add property details, assign tenants or property managers, and manage your real estate portfolio.',
      canonicalUrl: 'https://krenter.org/onboard-owner'
    });

    this.initForm();

    this.userSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.onboardingForm.patchValue({
          ownerEmailId: user.email,
          ownerPhoneNumber: user.phone || ''
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  private initForm(): void {
    this.onboardingForm = this.fb.group({
      // Basic Details (canonical property.dart)
      name: ['', [Validators.required, Validators.minLength(3)]],
      society: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['India', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z -]{3,10}$/)]],

      // Specifications
      bedrooms: ['2', Validators.required],
      bathrooms: ['2', Validators.required],
      floorNumber: ['1'],
      parking: ['1 Covered'],
      balcony: ['1'],
      price: [15000, [Validators.required, Validators.min(0)]],
      description: [''],
      photoUrl: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],

      // Owner Info (Autofilled / Readonly)
      ownerEmailId: ['', [Validators.required, Validators.email]],
      ownerPhoneNumber: [''],

      // Optional Tenant Assignment (renter.dart)
      assignTenant: [false],
      renterFirstName: [''],
      renterLastName: [''],
      renterEmailId: [''],
      renterPhoneNumber: [''],
      rentStartDate: [''],
      rentEndDate: [''],
      securityDeposit: [''],

      // Optional Property Manager Assignment
      assignManager: [false],
      propertyManagerEmailId: [''],
      propertyManagerPhoneNumber: ['']
    });
  }

  onToggleTenant(): void {
    this.hasTenant = this.onboardingForm.get('assignTenant')?.value;
  }

  onToggleManager(): void {
    this.hasManager = this.onboardingForm.get('assignManager')?.value;
  }

  async onSubmit(): Promise<void> {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const v = this.onboardingForm.value;

      // Prepare Property record matching property.dart
      const propertyData: Partial<Property> = {
        name: v.name.trim(),
        society: v.society.trim(),
        address: v.address.trim(),
        city: v.city.trim(),
        state: v.state.trim(),
        country: v.country.trim(),
        zipCode: v.zipCode.trim(),
        bedrooms: String(v.bedrooms),
        bathrooms: String(v.bathrooms),
        floorNumber: String(v.floorNumber || ''),
        parking: String(v.parking || ''),
        balcony: String(v.balcony || ''),
        price: Number(v.price) || 0,
        description: v.description?.trim() || '',
        photoUrl: v.photoUrl?.trim() || '',
        images: v.photoUrl ? [v.photoUrl.trim()] : [],

        // Owner fields
        ownerEmailId: (v.ownerEmailId || this.currentUser?.email || '').trim().toLowerCase(),
        ownerPhoneNumber: (v.ownerPhoneNumber || this.currentUser?.phone || '').trim(),
        ownerId: this.currentUser?.uid || '',

        // Tenant fields
        renterEmailId: v.assignTenant && v.renterEmailId ? v.renterEmailId.trim().toLowerCase() : '',
        renterPhoneNumber: v.assignTenant && v.renterPhoneNumber ? v.renterPhoneNumber.trim() : '',

        // Manager fields
        propertyManagerEmailId: v.assignManager && v.propertyManagerEmailId ? v.propertyManagerEmailId.trim().toLowerCase() : '',
        propertyManagerPhoneNumber: v.assignManager && v.propertyManagerPhoneNumber ? v.propertyManagerPhoneNumber.trim() : '',

        // Availability flag: if tenant assigned, not available
        isAvailable: !(v.assignTenant && (v.renterEmailId || v.renterPhoneNumber)),
        location: `${v.address.trim()}, ${v.city.trim()}, ${v.state.trim()}`,
        type: `${v.bedrooms} BHK Apartment`
      };

      const propertyId = await this.propertyService.addProperty(propertyData);

      if (!propertyId) {
        throw new Error('Failed to save property. Please try again.');
      }

      // Automatically mark current user as Owner
      if (this.currentUser?.uid) {
        await this.authService.markUserAsOwner(this.currentUser.uid);
      }

      // If tenant assigned, create record in 'renters' collection matching renter.dart
      if (v.assignTenant && (v.renterEmailId || v.renterPhoneNumber)) {
        const renterRecord: Partial<Renter> = {
          propertyId,
          ownerEmailId: propertyData.ownerEmailId || '',
          ownerPhoneNumber: propertyData.ownerPhoneNumber || '',
          renterEmailId: v.renterEmailId?.trim().toLowerCase() || '',
          renterPhoneNumber: v.renterPhoneNumber?.trim() || '',
          firstName: v.renterFirstName?.trim() || '',
          lastName: v.renterLastName?.trim() || '',
          rentAmount: Number(v.price) || 0,
          securityDeposit: v.securityDeposit ? String(v.securityDeposit) : '',
          startDate: v.rentStartDate ? new Date(v.rentStartDate) : new Date(),
          endDate: v.rentEndDate ? new Date(v.rentEndDate) : undefined,
          renterStatus: 'active'
        };
        await this.propertyService.addRenter(renterRecord);
      }

      this.successMessage = `Property "${propertyData.name}" onboarded successfully! You are now registered as the property owner.`;
      setTimeout(() => {
        this.router.navigate(['/my-properties']);
      }, 2000);
    } catch (err: any) {
      console.error('Property onboarding error:', err);
      this.errorMessage = err.message || 'An error occurred during onboarding. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.onboardingForm.get(field);
    return !!(control && control.touched && control.invalid);
  }
}
