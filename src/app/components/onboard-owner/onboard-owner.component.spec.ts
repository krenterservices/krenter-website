import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { OnboardOwnerComponent } from './onboard-owner.component';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { PropertyService } from '../../services/property.service';

describe('OnboardOwnerComponent', () => {
  let component: OnboardOwnerComponent;
  let fixture: ComponentFixture<OnboardOwnerComponent>;
  let currentUserSubject: BehaviorSubject<KrenterUser | null>;
  let mockAuthService: Partial<AuthService>;
  let mockPropertyService: Partial<PropertyService>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<KrenterUser | null>({
      uid: 'owner-test-1',
      name: 'Alice Owner',
      email: 'alice@example.com',
      phone: '+91 9876543210',
      role: 'renter',
      roles: ['renter'],
      createdAt: new Date(),
    });

    mockAuthService = {
      currentUser: currentUserSubject.asObservable(),
      getCurrentUserSync: () => currentUserSubject.value,
      markUserAsOwner: () => Promise.resolve(true),
    };

    mockPropertyService = {
      addProperty: () => Promise.resolve('new-prop-id-123'),
      addRenter: () => Promise.resolve('new-renter-id-123'),
    };

    await TestBed.configureTestingModule({
      imports: [OnboardOwnerComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: PropertyService, useValue: mockPropertyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should prefill owner email and phone from authenticated user', () => {
    expect(component.onboardingForm.get('ownerEmailId')?.value).toBe('alice@example.com');
    expect(component.onboardingForm.get('ownerPhoneNumber')?.value).toBe('+91 9876543210');
  });

  it('should invalidate form when required fields are empty', () => {
    component.onboardingForm.patchValue({ name: '', society: '', address: '', city: '', state: '', zipCode: '' });
    expect(component.onboardingForm.invalid).toBe(true);
  });

  it('should toggle tenant fields when assignTenant is checked', () => {
    expect(component.hasTenant).toBe(false);
    component.onboardingForm.patchValue({ assignTenant: true });
    component.onToggleTenant();
    expect(component.hasTenant).toBe(true);
  });

  it('should toggle manager fields when assignManager is checked', () => {
    expect(component.hasManager).toBe(false);
    component.onboardingForm.patchValue({ assignManager: true });
    component.onToggleManager();
    expect(component.hasManager).toBe(true);
  });
});
