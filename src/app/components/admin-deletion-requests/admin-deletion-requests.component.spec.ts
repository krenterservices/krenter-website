import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AdminDeletionRequestsComponent } from './admin-deletion-requests.component';
import { DeletionRequestService, DeletionRequest } from '../../services/deletion-request.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

describe('AdminDeletionRequestsComponent', () => {
  let component: AdminDeletionRequestsComponent;
  let fixture: ComponentFixture<AdminDeletionRequestsComponent>;
  let currentUserSubject: BehaviorSubject<KrenterUser | null>;
  let mockDeletionService: Partial<DeletionRequestService>;
  let mockAuthService: Partial<AuthService>;
  let mockSeoService: Partial<SeoService>;

  const mockRequests: DeletionRequest[] = [
    {
      id: 'req-1',
      name: 'Alice Renter',
      email: 'alice@example.com',
      phone: '111-222-3333',
      role: 'renter',
      scope: 'all',
      status: 'pending',
      createdAt: new Date(),
    },
    {
      id: 'req-2',
      name: 'Bob Landlord',
      email: 'bob@example.com',
      role: 'owner',
      scope: 'all',
      status: 'completed',
      createdAt: new Date(),
      deletedCounts: {
        users: 1,
        properties: 2,
        renters: 1,
        rentals: 1,
        payments: 3,
        messages: 4,
      },
    },
  ];

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<KrenterUser | null>({
      uid: 'admin-uid',
      name: 'Admin User',
      email: 'krenterservices@gmail.com',
      role: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
    });

    mockAuthService = {
      currentUser: currentUserSubject.asObservable(),
      isAdmin: () => true,
    };

    mockDeletionService = {
      getDeletionRequests: () => Promise.resolve(mockRequests),
      updateRequestStatus: () => Promise.resolve(true),
      executeUserDeletion: () =>
        Promise.resolve({
          success: true,
          counts: {
            users: 1,
            properties: 0,
            renters: 2,
            rentals: 1,
            payments: 4,
            messages: 3,
          },
        }),
    };

    mockSeoService = {
      setSeoData: () => {},
      setNoIndex: () => {},
    };

    await TestBed.configureTestingModule({
      imports: [AdminDeletionRequestsComponent],
      providers: [
        provideRouter([]),
        { provide: DeletionRequestService, useValue: mockDeletionService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SeoService, useValue: mockSeoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDeletionRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and display deletion requests on init', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.requests.length).toBe(2);
    expect(component.pendingCount).toBe(1);
    expect(component.completedCount).toBe(1);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('alice@example.com');
    expect(compiled.textContent).toContain('bob@example.com');
  });

  it('should filter requests by status', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    component.setStatusFilter('pending');
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].id).toBe('req-1');

    component.setStatusFilter('completed');
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].id).toBe('req-2');
  });

  it('should open confirmation modal when clicking delete button', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    component.openDeleteModal(mockRequests[0]);
    expect(component.selectedRequestForDeletion).toBe(mockRequests[0]);

    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Confirm Permanent User & Data Deletion');
    expect(compiled.textContent).toContain('alice@example.com');
  });

  it('should execute deletion across collections and report purged counts', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    component.openDeleteModal(mockRequests[0]);
    await component.confirmExecuteDeletion();
    fixture.detectChanges();

    expect(component.executionSuccessMessage).toContain('alice@example.com');
    expect(component.executionSuccessMessage).toContain('1 user profile');
    expect(component.executionSuccessMessage).toContain('3 rental records');
    expect(component.executionSuccessMessage).toContain('4 payment records');
    expect(component.executionSuccessMessage).toContain('3 messages');
  });
});
