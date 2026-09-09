# Krenter Website - AI Agent Guide

This is an Angular 22 full-stack property rental marketplace with Firebase backend, SSR, and dual-role architecture (property owners and renters).

## Architecture Overview

**Core Stack:**
- **Frontend**: Angular 22 (standalone components, v22.1.5)
- **Backend**: Firebase (Authentication + Firestore)
- **SSR**: Angular Server-Side Rendering enabled
- **Deployment**: Firebase App Hosting with Cloud Run
- **UI**: Bootstrap 5.3.8 + custom SCSS
- **State**: RxJS Observables + BehaviorSubjects (services manage state)

**Key Principle**: Each service (AuthService, PropertyService, UserService) exposes BehaviorSubjects as public Observables. Components inject services and subscribe to `service.propertyName$` or call async methods directly.

## Critical Data Model & Service Patterns

**Firestore Collections** (`users`, `properties`, `rentals`):
- **users**: `{uid, email, name, role: 'owner'|'renter', phone?, profilePicture?, createdAt}`
- **properties**: `{id?, name, type, price, location, description?, amenities?, images?, ownerId, isAvailable, createdAt, updatedAt?}`
- **rentals**: `{id?, propertyId, ownerId, renterId, rentalPrice, startDate, endDate?, status: 'active'|'completed'|'cancelled', rentalDetails?, createdAt}`

**AuthService Pattern** (`src/app/services/auth.service.ts`):
- Watches Firebase auth state via `authState(this.auth)` → loads user profile from Firestore → emits via `currentUserSubject`
- Public Observable: `currentUser$` (for components to subscribe)
- Sync method: `getCurrentUserSync()` (returns current value immediately)
- Returns `{success: boolean, error?: string}` from login/register/logout

**PropertyService Pattern** (`src/app/services/property.service.ts`):
- No reactive subscriptions; all methods are async functions returning Promises
- CRUD: `addProperty()`, `updateProperty()`, `deleteProperty()`, `getProperty()`
- Query: `getProperties()` (available only), `getPropertiesByOwner(uid)`, `getRentalsByOwner()`, `getRentalsByRenter()`
- Rental flow: `rentProperty()` creates rental doc + sets property `isAvailable: false`

**Firestore Security Rules** (from config file):
- Users can only read/write their own `/users/{uid}` doc
- All authed users can read properties, only owner can update/delete
- Rentals readable only by owner or renter (via ownerId/renterId fields)

## Component & Routing Patterns

**Routing** (`src/app/app.routes.ts`):
- Public routes: `/`, `/home`, `/properties`, `/property/:id`, `/login`, `/register`, `/support`
- Protected routes (AuthGuard): `/add-property`, `/my-properties`, `/edit-property/:id`, `/my-rentals`
- AuthGuard implementation: checks `authService.currentUser` Observable, redirects to `/login` if falsy

**Component Structure** (all standalone):
- Located in `src/app/components/{component-name}/`
- Pattern: `*.component.ts`, `*.component.html`, `*.component.scss`
- Import services via constructor injection + DI
- No smart/dumb component distinction; services handle state
- Example: `HomeComponent` imports `RouterLink` only, no logic needed

**Standalone Bootstrap** (`src/app/app.config.ts`):
- Configures providers: `provideRouter()`, `provideClientHydration()`, `provideFirebaseApp()`, `provideAuth()`, `provideFirestore()`
- Firebase initialized with config from `src/app/config/firebase.config.ts`

## Development Workflows & Commands

```bash
# Start dev server with live reload (default: development config, source maps on)
npm start
# or
ng serve

# Build for production (with SSR, output to dist/)
npm run build
# or
ng build

# Build in watch mode for development
npm run watch

# Unit tests (Vitest runner)
npm test
ng test

# Serve production SSR build locally
npm run serve:ssr:krenter-website

# Run e2e tests (no default framework)
ng e2e
```

**Build Configuration** (`angular.json`):
- SSR entry: `src/server.ts` (Express server)
- Browser entry: `src/main.ts` (Angular app)
- Assets: `public/` folder → static files (logos, icons)
- Styles: Global `src/styles.scss` + component `component.scss`
- Budgets: Initial JS ~500KB, component styles ~4KB (triggers warnings at 80%, errors at 100%)

## Project-Specific Conventions

1. **Async Patterns**: Services use async/await for Firestore operations; components use .subscribe() or async pipe for Observables.
2. **Error Handling**: Services log errors to console; return `{success: false, error: string}` or `null`. Components should check return values & show user feedback.
3. **Timestamps**: Firestore timestamps stored as JS `Date` objects (auto-serialized). In TypeScript interfaces, use `Date` type.
4. **Role-Based Logic**: Check `currentUser.role` in components/services to branch owner vs. renter flows (no separate role guard, done manually).
5. **SCSS Variables & Global Styles**: Define global SCSS variables, maps, and theme overrides in `src/styles.scss` (global scope). Prefer using Sass (`@use`/`@import`) of Bootstrap partials to access its variables, mixins, and functions. Import only the needed Bootstrap partials or the full Bootstrap SCSS in `src/styles.scss` so components can rely on those variables and utilities.
6. **Bootstrap-first UI guidance**: When designing components prefer Bootstrap SCSS and utility classes first. Use Bootstrap components, grid, and utilities (for spacing, layout, typography, forms, buttons) to build structure and look. If a style is not available in Bootstrap, implement it in the component's `.component.scss` using SCSS and Bootstrap variables/mixins. For UI modifications or theme changes, prefer overriding Bootstrap variables before importing Bootstrap (in `src/styles.scss`) or create small, scoped overrides that extend Bootstrap classes. Keep custom CSS minimal, SCSS-based, and scoped to component files.

## Key Files for Common Tasks

| Task | Key Files |
|------|-----------|
| Add new route | `src/app/app.routes.ts` → add route entry; create component in `src/app/components/{name}/` |
| Auth-protected feature | Add to routes with `canActivate: [AuthGuard]` → check user role in component with `this.authService.getCurrentUserSync()?.role` |
| New Firestore query | Add method to `src/app/services/property.service.ts` or new service; follow async/Promise pattern |
| Update Firestore security | Modify rules in Firebase Console → propagate understanding to `src/app/config/firebase.config.ts` comments |
| Deploy to Firebase | `firebase deploy` (App Hosting); check `apphosting.yaml` + `firebase.json` config; env vars in Cloud Secret Manager |
| Style component | Use `component.scss` (scoped) + Bootstrap classes (global); SCSS imports from `src/styles.scss` if globals needed |

## Integration Points & External Dependencies

- **@angular/fire** (v20.0.1): Firebase SDK wrapper for Auth, Firestore
- **Bootstrap** (v5.3.8): CSS framework imported in templates
- **Express** (v5.2.1): SSR server (only in built app, not source)
- **RxJS** (v7.8.2): Reactive streams (Observables, BehaviorSubject, operators)
- **Firebase Console**: Source of truth for Firestore data, Auth config, deployment settings

## Firebase Configuration

**Config File**: `src/app/config/firebase.config.ts`
- Stores `firebaseConfig` object (apiKey, authDomain, projectId, etc.)
- **Security**: Never commit real credentials; use env vars for production
- Includes detailed setup docs for creating collections & security rules
- Security rules pattern: `/users/{uid}` (self-only), `/properties/{propertyId}` (owner CRUD), `/rentals/{rentalId}` (owner/renter read)

## Common Pitfalls & Debugging

1. **"Permission denied" in console**: Check Firestore rules are published; verify `ownerId`/`renterId` match `request.auth.uid`
2. **Component not updating**: Services emit state via BehaviorSubjects; ensure component subscribes or uses `async` pipe in template
3. **SSR build fails**: Check that services don't access browser APIs (window, localStorage) in constructors; use `isPlatformBrowser()` guard
4. **AuthGuard redirect loops**: Ensure `/login` is public (not in protected routes); check that login sets `currentUserSubject` after profile load
5. **Property not visible after rental**: `rentProperty()` sets `isAvailable: false`; filter queries check `isAvailable == true` by default

## AI Agent Capabilities in This Codebase

You can confidently:
- ✅ Add new components (scaffold with `ng generate component`)
- ✅ Add routes + guards (modify `app.routes.ts`, wire AuthGuard)
- ✅ Implement Firestore queries (pattern: async method in PropertyService returning Promise)
- ✅ Create forms (use Angular forms API + Bootstrap classes)
- ✅ Debug auth/data issues (check service state via `authService.currentUser.pipe()`, inspect Firestore rules)
- ✅ Deploy/configure Firebase App Hosting (modify `apphosting.yaml`, use Firebase CLI)

**Do not** (requires manual intervention):
- Modify Firestore security rules (publish manually in Firebase Console)
- Update Firebase credentials (manage in Firebase Console)
- Change SSR configuration (complex rebuild/deploy interaction)

