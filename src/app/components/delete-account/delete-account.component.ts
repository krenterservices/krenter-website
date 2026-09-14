import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DeletionRequestService } from '../../services/deletion-request.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.scss']
})
export class DeleteAccountComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly deletionService = inject(DeletionRequestService);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly cdr = inject(ChangeDetectorRef);

  deletionForm: FormGroup;
  currentUser: KrenterUser | null = null;
  private authSub?: Subscription;

  isSubmitting = false;
  isSubmitted = false;
  submissionError = '';
  requestId = '';
  submittedEmail = '';
  isStoredLocally = false;
  copied = false;

  constructor() {
    this.deletionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      role: ['renter', Validators.required],
      scope: ['all', Validators.required],
      specificDataDetails: [''],
      reason: [''],
      confirmAcknowledge: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: 'Request Account & Data Deletion - Krenter',
      description: 'Submit a request to delete your Krenter user account and associated personal data in compliance with Google Play Store and Apple App Store policies.'
    });

    this.authSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.deletionForm.patchValue({
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone || '',
          role: user.role === 'owner' ? 'owner' : user.role === 'manager' ? 'manager' : 'renter'
        });
        this.cdr.markForCheck();
      }
    });

    // Toggle requirement on specificDataDetails when scope is specific
    this.deletionForm.get('scope')?.valueChanges.subscribe(scope => {
      const detailsControl = this.deletionForm.get('specificDataDetails');
      if (scope === 'specific') {
        detailsControl?.setValidators([Validators.required, Validators.minLength(5)]);
      } else {
        detailsControl?.clearValidators();
      }
      detailsControl?.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  get isSpecificScope(): boolean {
    return this.deletionForm.get('scope')?.value === 'specific';
  }

  copyRequestId(): void {
    if (!this.requestId) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.requestId).then(() => {
        this.copied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.copied = false;
          this.cdr.markForCheck();
        }, 2000);
      }).catch(() => {});
    }
  }

  getMailtoUrl(): string {
    const subject = encodeURIComponent(`[Krenter Deletion Backup] Request Ref: ${this.requestId} (${this.submittedEmail})`);
    const body = encodeURIComponent(
      `Hello Krenter Support Team,\n\n` +
      `I have submitted an account and personal data deletion request on Krenter.\n\n` +
      `Request Reference ID: ${this.requestId}\n` +
      `Account Email: ${this.submittedEmail}\n` +
      `Name: ${this.deletionForm.get('name')?.value || ''}\n` +
      `Phone: ${this.deletionForm.get('phone')?.value || 'N/A'}\n` +
      `Role: ${this.deletionForm.get('role')?.value || 'renter'}\n` +
      `Scope: ${this.deletionForm.get('scope')?.value || 'all'}\n\n` +
      `Please ensure all personal data and profile records associated with this account are permanently removed.\n\nThank you.`
    );
    return `mailto:krenterservices@gmail.com?subject=${subject}&body=${body}`;
  }

  async onSubmit(): Promise<void> {
    if (this.deletionForm.invalid) {
      this.deletionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submissionError = '';
    this.cdr.markForCheck();

    try {
      const formValues = this.deletionForm.value;
      const result = await this.deletionService.createDeletionRequest({
        email: formValues.email,
        name: formValues.name,
        phone: formValues.phone,
        role: formValues.role,
        scope: formValues.scope,
        specificDataDetails: formValues.specificDataDetails,
        reason: formValues.reason
      });

      if (result.success && result.id) {
        this.requestId = result.id;
        this.submittedEmail = formValues.email;
        this.isStoredLocally = !!result.isStoredLocally;
        this.isSubmitted = true;
      } else {
        this.submissionError = result.error || 'Failed to submit request. Please try again or email krenterservices@gmail.com.';
      }
    } catch (err: any) {
      console.error('Error submitting deletion request:', err);
      this.submissionError = err?.message || 'An unexpected error occurred. Please try again or email krenterservices@gmail.com.';
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  resetForm(): void {
    this.isSubmitted = false;
    this.requestId = '';
    this.submittedEmail = '';
    this.submissionError = '';
    this.isStoredLocally = false;
    this.copied = false;
    this.deletionForm.reset({
      role: 'renter',
      scope: 'all',
      confirmAcknowledge: false
    });
    this.cdr.markForCheck();
  }
}
