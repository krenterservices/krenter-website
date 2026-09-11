import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
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
  propertyForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) {
    this.propertyForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      location: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.seoService.setNoIndex('Add Property');
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      // In a real app, you'd get the owner's ID from the auth service
      this.propertyService.addProperty({ ...this.propertyForm.value, ownerId: 1 });
      this.router.navigate(['/my-properties']);
    }
  }
}
