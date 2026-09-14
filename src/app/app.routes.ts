import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PropertiesComponent } from './components/properties/properties.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PropertyDetailsComponent } from './components/property-details/property-details.component';
import { AddPropertyComponent } from './components/add-property/add-property.component';
import { MyPropertiesComponent } from './components/my-properties/my-properties.component';
import { EditPropertyComponent } from './components/edit-property/edit-property.component';
import { MyRentalsComponent } from './components/my-rentals/my-rentals.component';
import { SupportComponent } from './components/support/support.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsOfUseComponent } from './components/terms-of-use/terms-of-use.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'properties', component: PropertiesComponent },
  {
    path: 'property/:id',
    component: PropertyDetailsComponent,
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'support', component: SupportComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'privacypolicy', component: PrivacyPolicyComponent },
  { path: 'terms', component: TermsOfUseComponent },
  { path: 'terms-of-use', component: TermsOfUseComponent },
  { path: 'termsofuse', component: TermsOfUseComponent },
  {
    path: 'delete-account',
    loadComponent: () =>
      import('./components/delete-account/delete-account.component').then(
        m => m.DeleteAccountComponent
      )
  },
  { path: 'data-deletion-request', redirectTo: 'delete-account', pathMatch: 'full' },
  { path: 'data-deletion', redirectTo: 'delete-account', pathMatch: 'full' },
  { path: 'delete-user-data', redirectTo: 'delete-account', pathMatch: 'full' },
  {
    path: 'admin/deletion-requests',
    loadComponent: () =>
      import('./components/admin-deletion-requests/admin-deletion-requests.component').then(
        m => m.AdminDeletionRequestsComponent
      ),
    canActivate: [AuthGuard]
  },
  { path: 'deletion-requests', redirectTo: 'admin/deletion-requests', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(module => module.DashboardComponent),
    canActivate: [AuthGuard]
  },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [AuthGuard] },
  {
    path: 'onboard-owner',
    loadComponent: () => import('./components/onboard-owner/onboard-owner.component').then(m => m.OnboardOwnerComponent),
    canActivate: [AuthGuard]
  },
  { path: 'property-owner-onboarding', redirectTo: 'onboard-owner', pathMatch: 'full' },
  { path: 'onboard-property', redirectTo: 'onboard-owner', pathMatch: 'full' },
  { path: 'my-properties', component: MyPropertiesComponent, canActivate: [AuthGuard] },
  { path: 'edit-property/:id', component: EditPropertyComponent, canActivate: [AuthGuard] },
  { path: 'my-rentals', component: MyRentalsComponent, canActivate: [AuthGuard] },
  { path: '**', component: NotFoundComponent },
];

