import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DeleteAccountComponent } from './delete-account.component';
import { DeletionRequestService } from '../../services/deletion-request.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

describe('DeleteAccountComponent', () => {
  let component: DeleteAccountComponent;
  let fixture: ComponentFixture<DeleteAccountComponent>;
  let currentUserSubject: BehaviorSubject<KrenterUser | null>;
  let mockDeletionService: Partial<DeletionRequestService>;
  let mockAuthService: Partial<AuthService>;
  let mockSeoService: Partial<SeoService>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<KrenterUser | null>(null);
    mockAuthService = {
      currentUser: currentUserSubject.asObservable(),
    };

    mockDeletionService = {
      createDeletionRequest: () => Promise.resolve({ success: true, id: 'req-abc-123' }),
    };

    mockSeoService = {
      setSeoData: () => {},
      setNoIndex: () => {},
    };

    await TestBed.configureTestingModule({
      imports: [DeleteAccountComponent],
      providers: [
        provideRouter([]),
        { provide: DeletionRequestService, useValue: mockDeletionService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SeoService, useValue: mockSeoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display page header and data safety compliance badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Request Account & Data Deletion');
    expect(compiled.textContent).toContain('Google Play & Apple App Store Data Safety Compliance');
  });

  it('should auto-fill form with logged-in user data', () => {
    currentUserSubject.next({
      uid: 'user-456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 555-987-6543',
      role: 'owner',
      createdAt: new Date(),
    });

    fixture.detectChanges();

    expect(component.deletionForm.get('email')?.value).toBe('jane@example.com');
    expect(component.deletionForm.get('name')?.value).toBe('Jane Smith');
    expect(component.deletionForm.get('phone')?.value).toBe('+1 555-987-6543');
    expect(component.deletionForm.get('role')?.value).toBe('owner');
  });

  it('should require email, name, and confirmation acknowledge', () => {
    expect(component.deletionForm.valid).toBe(false);

    component.deletionForm.patchValue({
      email: 'invalid-email',
      name: '',
      confirmAcknowledge: false,
    });
    expect(component.deletionForm.valid).toBe(false);

    component.deletionForm.patchValue({
      email: 'valid@example.com',
      name: 'Jane Doe',
      confirmAcknowledge: true,
    });
    expect(component.deletionForm.valid).toBe(true);
  });

  it('should handle successful submission and display success view', async () => {
    component.deletionForm.patchValue({
      email: 'user@example.com',
      name: 'Test User',
      phone: '1234567890',
      role: 'renter',
      scope: 'all',
      confirmAcknowledge: true,
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.isSubmitted).toBe(true);
    expect(component.requestId).toBe('req-abc-123');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Deletion Request Received');
    expect(compiled.textContent).toContain('req-abc-123');
    expect(compiled.textContent).toContain('krenterservices@gmail.com');
  });

  it('should handle submission errors gracefully', async () => {
    mockDeletionService.createDeletionRequest = () =>
      Promise.resolve({ success: false, error: 'Database connection failed' });

    component.deletionForm.patchValue({
      email: 'user@example.com',
      name: 'Test User',
      confirmAcknowledge: true,
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.isSubmitted).toBe(false);
    expect(component.isSubmitting).toBe(false);
    expect(component.submissionError).toBe('Database connection failed');
  });

  it('should ensure isSubmitting becomes false even if createDeletionRequest throws', async () => {
    mockDeletionService.createDeletionRequest = () =>
      Promise.reject(new Error('Network offline'));

    component.deletionForm.patchValue({
      email: 'user@example.com',
      name: 'Test User',
      confirmAcknowledge: true,
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.isSubmitting).toBe(false);
    expect(component.isSubmitted).toBe(false);
    expect(component.submissionError).toBe('Network offline');
  });

  it('should generate correct mailto URL and reset form', () => {
    component.requestId = 'REQ-TEST-123';
    component.submittedEmail = 'user@example.com';
    const mailto = component.getMailtoUrl();
    expect(mailto).toContain('mailto:krenterservices@gmail.com');
    expect(mailto).toContain('REQ-TEST-123');

    component.resetForm();
    expect(component.isSubmitted).toBe(false);
    expect(component.requestId).toBe('');
    expect(component.submittedEmail).toBe('');
  });
});
