import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss']
})
export class AddPropertyComponent {
  propertyForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router,
    private authService: AuthService
  ) {
    this.propertyForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      location: ['', Validators.required]
    });
  }

  onSubmit() {
    const currentUser = this.authService.getCurrentUserSync();

    if (this.propertyForm.valid && currentUser) {
      void this.propertyService.addProperty({
        ...this.propertyForm.value,
        ownerId: currentUser.uid,
        isAvailable: true
      }).then(propertyId => {
        if (propertyId) {
          void this.router.navigate(['/dashboard']);
        }
      });
    }
  }
}
