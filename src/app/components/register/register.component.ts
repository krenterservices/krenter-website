import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  registerError = '';
  isLoading = false;
  private loadingSubscription: Subscription | undefined;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['renter', Validators.required] // Default to renter
    });
  }

  ngOnInit(): void {
    // Subscribe to loading state
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
      const result = await this.authService.register(this.registerForm.value);

      if (!result.success) {
        this.registerError = result.error || 'Registration failed. Please try again.';
      }
    }
  }

  get nameError(): string {
    const nameControl = this.registerForm.get('name');
    if (nameControl?.touched && nameControl.hasError('required')) {
      return 'Full name is required.';
    }
    return '';
  }

  get emailError(): string {
    const emailControl = this.registerForm.get('email');
    if (emailControl?.touched) {
      if (emailControl.hasError('required')) {
        return 'Email is required.';
      }
      if (emailControl.hasError('email')) {
        return 'Please enter a valid email.';
      }
    }
    return '';
  }

  get passwordError(): string {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl?.touched) {
      if (passwordControl.hasError('required')) {
        return 'Password is required.';
      }
      if (passwordControl.hasError('minlength')) {
        return 'Password must be at least 6 characters long.';
      }
    }
    return '';
  }

  getRoleDescription(role: string): string {
    if (role === 'owner') {
      return 'I want to list and manage properties';
    } else {
      return 'I want to rent properties';
    }
  }
}
