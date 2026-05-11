import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  currentUser: KrenterUser | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  private authSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.valid && this.currentUser) {
      try {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const success = await this.userService.updateUser(this.currentUser.uid, {
          name: this.profileForm.value.name,
          email: this.profileForm.value.email,
          phone: this.profileForm.value.phone
        });

        if (success) {
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = 'Failed to update profile.';
        }
      } catch (error) {
        this.errorMessage = 'Error updating profile.';
        console.error('Error updating profile:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
