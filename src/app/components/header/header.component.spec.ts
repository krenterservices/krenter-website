import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService, KrenterUser } from '../../services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let currentUserSubject: BehaviorSubject<KrenterUser | null>;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<KrenterUser | null>(null);
    mockAuthService = {
      currentUser: currentUserSubject.asObservable(),
      logout: () => Promise.resolve(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display brand logo and company name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('.brand-logo') as HTMLImageElement;
    const brandName = compiled.querySelector('.brand-name');
    expect(logo).toBeTruthy();
    expect(logo.getAttribute('src')).toBe('/krenter-logo.png');
    expect(brandName?.textContent).toContain('Krenter');
  });

  it('should toggle and close mobile hamburger menu', () => {
    expect(component.isMenuOpen).toBe(false);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);
    component.closeMenu();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should display guest sign in and register buttons when logged out', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const signInLink = compiled.querySelector('a[routerLink="/login"]');
    const registerLink = compiled.querySelector('a[routerLink="/register"]');
    expect(signInLink).toBeTruthy();
    expect(registerLink).toBeTruthy();
  });

  it('should display user info and role badge when logged in', () => {
    const mockUser: KrenterUser = {
      uid: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      createdAt: new Date(),
    };

    currentUserSubject.next(mockUser);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John Doe');
    expect(compiled.textContent).toContain('OWNER');
    expect(component.getUserInitials()).toBe('JD');

    const logoutBtn = compiled.querySelector('button.btn-outline-danger');
    expect(logoutBtn).toBeTruthy();
  });

  it('should display owner-specific links when logged in as owner', () => {
    currentUserSubject.next({
      uid: 'user-owner',
      name: 'Owner User',
      email: 'owner@example.com',
      role: 'owner',
      createdAt: new Date(),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerLink="/my-properties"]')).toBeTruthy();
    expect(compiled.querySelector('a[routerLink="/add-property"]')).toBeTruthy();
  });

  it('should display renter-specific links when logged in as renter', () => {
    currentUserSubject.next({
      uid: 'user-renter',
      name: 'Renter User',
      email: 'renter@example.com',
      role: 'renter',
      createdAt: new Date(),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerLink="/my-rentals"]')).toBeTruthy();
  });
});
