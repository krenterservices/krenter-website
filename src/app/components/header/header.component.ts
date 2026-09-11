import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, KrenterUser } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUser: KrenterUser | null = null;
  isMenuOpen = false;
  private authSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.markForCheck();
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.cdr.markForCheck();
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) {
      return 'U';
    }
    const parts = this.currentUser.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    this.cdr.markForCheck();
  }
}
