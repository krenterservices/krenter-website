import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-property.component.html',
  styleUrls: ['./edit-property.component.scss']
})
export class EditPropertyComponent implements OnInit {
  propertyForm: FormGroup;
  propertyId!: number;

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
      location: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyId = +id;
      const property = this.propertyService.getProperty(this.propertyId);
      if (property) {
        this.propertyForm.patchValue(property);
      }
    }
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      this.propertyService.updateProperty({ id: this.propertyId, ...this.propertyForm.value });
      this.router.navigate(['/my-properties']);
    }
  }
}
