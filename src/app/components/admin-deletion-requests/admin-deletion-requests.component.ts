import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DeletionRequestService, DeletionRequest } from '../../services/deletion-request.service';
import { AuthService, KrenterUser } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-admin-deletion-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-deletion-requests.component.html',
  styleUrls: ['./admin-deletion-requests.component.scss']
})
export class AdminDeletionRequestsComponent implements OnInit, OnDestroy {
  private readonly deletionService = inject(DeletionRequestService);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUser: KrenterUser | null = null;
  private authSub?: Subscription;

  requests: DeletionRequest[] = [];
  filteredRequests: DeletionRequest[] = [];
  isLoading = true;
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'in_progress' | 'completed' | 'rejected' = 'all';

  // Execution state
  selectedRequestForDeletion: DeletionRequest | null = null;
  isExecutingDeletion = false;
  executionError = '';
  executionSuccessMessage = '';

  // Status update state
  updatingRequestId: string | null = null;

  ngOnInit(): void {
    this.seoService.setNoIndex('Admin: Account & Data Deletion Requests');

    this.authSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    void this.loadRequests();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin(this.currentUser);
  }

  async loadRequests(): Promise<void> {
    this.isLoading = true;
    try {
      this.requests = await this.deletionService.getDeletionRequests();
      this.applyFilter();
    } catch (err) {
      console.error('Error fetching deletion requests:', err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  applyFilter(): void {
    let result = [...this.requests];

    if (this.statusFilter !== 'all') {
      result = result.filter(r => r.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        r =>
          r.email.toLowerCase().includes(term) ||
          r.name.toLowerCase().includes(term) ||
          (r.phone && r.phone.includes(term)) ||
          (r.id && r.id.toLowerCase().includes(term))
      );
    }

    this.filteredRequests = result;
    this.cdr.markForCheck();
  }

  setStatusFilter(filter: 'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'): void {
    this.statusFilter = filter;
    this.applyFilter();
  }

  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'pending').length;
  }

  get inProgressCount(): number {
    return this.requests.filter(r => r.status === 'in_progress').length;
  }

  get completedCount(): number {
    return this.requests.filter(r => r.status === 'completed').length;
  }

  openDeleteModal(request: DeletionRequest): void {
    this.selectedRequestForDeletion = request;
    this.executionError = '';
    this.executionSuccessMessage = '';
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    if (!this.isExecutingDeletion) {
      this.selectedRequestForDeletion = null;
      this.cdr.markForCheck();
    }
  }

  async confirmExecuteDeletion(): Promise<void> {
    if (!this.selectedRequestForDeletion) return;

    this.isExecutingDeletion = true;
    this.executionError = '';
    this.cdr.markForCheck();

    const req = this.selectedRequestForDeletion;
    const adminEmail = this.currentUser?.email || 'krenterservices@gmail.com';

    const result = await this.deletionService.executeUserDeletion(req, adminEmail);

    this.isExecutingDeletion = false;

    if (result.success) {
      const c = result.counts;
      this.executionSuccessMessage = `Account and data for ${req.email} successfully purged: ${c.users} user profile, ${c.properties} properties, ${c.renters + c.rentals} rental records, ${c.payments} payment records, ${c.messages} messages. Notification email sent to ${req.email}.`;
      this.selectedRequestForDeletion = null;
      await this.loadRequests();
    } else {
      this.executionError = result.error || 'Failed to complete user deletion.';
    }
    this.cdr.markForCheck();
  }

  async updateStatus(request: DeletionRequest, newStatus: DeletionRequest['status']): Promise<void> {
    if (!request.id) return;
    this.updatingRequestId = request.id;
    this.cdr.markForCheck();
    const adminEmail = this.currentUser?.email || 'krenterservices@gmail.com';
    const success = await this.deletionService.updateRequestStatus(
      request.id,
      newStatus,
      undefined,
      adminEmail
    );
    this.updatingRequestId = null;

    if (success) {
      request.status = newStatus;
      this.applyFilter();
    }
    this.cdr.markForCheck();
  }
}
