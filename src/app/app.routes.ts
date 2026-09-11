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
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(module => module.DashboardComponent),
    canActivate: [AuthGuard]
  },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [AuthGuard] },
  { path: 'my-properties', component: MyPropertiesComponent, canActivate: [AuthGuard] },
  { path: 'edit-property/:id', component: EditPropertyComponent, canActivate: [AuthGuard] },
  { path: 'my-rentals', component: MyRentalsComponent, canActivate: [AuthGuard] },
];
