import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { Subscription } from 'rxjs';

function atLeastOneRoleValidator(group: FormGroup) {
  const isOwner = group.get('isOwner')?.value;
  const isRenter = group.get('isRenter')?.value;
  const isManager = group.get('isManager')?.value;
  return isOwner || isRenter || isManager ? null : { noRoleSelected: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly seoService = inject(SeoService);
  registerForm: FormGroup;
  registerError = '';
  isLoading = false;
  private loadingSubscription: Subscription | undefined;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        isOwner: [false],
        isRenter: [true],
        isManager: [false]
      },
      { validators: atLeastOneRoleValidator }
    );
  }

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Create an Account | Krenter Property Management',
      description:
        'Join Krenter today. Sign up as a property owner, renter, or property manager to manage rentals, track properties, and coordinate leases.',
      robots: 'noindex, follow',
      canonicalUrl: 'https://krenter.org/register'
    });

    this.loadingSubscription = this.authService.isLoading.subscribe(loading => {
      this.isLoading = loading;
    });
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.registerError = '';
      const formVal = this.registerForm.value;
      const roles: ('owner' | 'renter' | 'manager')[] = [];
      if (formVal.isOwner) roles.push('owner');
      if (formVal.isRenter) roles.push('renter');
      if (formVal.isManager) roles.push('manager');

      const result = await this.authService.register({
        firstName: formVal.firstName.trim(),
        lastName: formVal.lastName.trim(),
        name: `${formVal.firstName.trim()} ${formVal.lastName.trim()}`.trim(),
        email: formVal.email.trim(),
        phone: (formVal.phone || '').trim(),
        password: formVal.password,
        isOwner: formVal.isOwner,
        isRenter: formVal.isRenter,
        isManager: formVal.isManager,
        roles
      });

      if (!result.success) {
        this.registerError = result.error || 'Registration failed. Please try again.';
      }
    }
  }

  get firstNameError(): string {
    const c = this.registerForm.get('firstName');
    return c?.touched && c.hasError('required') ? 'First name is required.' : '';
  }

  get lastNameError(): string {
    const c = this.registerForm.get('lastName');
    return c?.touched && c.hasError('required') ? 'Last name is required.' : '';
  }

  get emailError(): string {
    const c = this.registerForm.get('email');
    if (c?.touched) {
      if (c.hasError('required')) return 'Email is required.';
      if (c.hasError('email')) return 'Please enter a valid email.';
    }
    return '';
  }

  get passwordError(): string {
    const c = this.registerForm.get('password');
    if (c?.touched) {
      if (c.hasError('required')) return 'Password is required.';
      if (c.hasError('minlength')) return 'Password must be at least 6 characters long.';
    }
    return '';
  }

  get roleError(): string {
    return this.registerForm.touched && this.registerForm.hasError('noRoleSelected')
      ? 'Please select at least one role (Owner, Renter, or Property Manager).'
      : '';
  }
}
