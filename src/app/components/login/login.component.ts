import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loginError = '';
  isLoading = false;
  private loadingSubscription: Subscription | undefined;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
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
    if (this.loginForm.valid) {
      this.loginError = '';
      const result = await this.authService.login(this.loginForm.value);

      if (!result.success) {
        this.loginError = result.error || 'Invalid email or password. Please try again.';
      }
    }
  }

  get emailError(): string {
    const emailControl = this.loginForm.get('email');
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
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.touched && passwordControl.hasError('required')) {
      return 'Password is required.';
    }
    return '';
  }
}
