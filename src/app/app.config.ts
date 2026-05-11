import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { firebaseConfig } from './config/firebase.config';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // Firebase providers
    provideFirebaseApp(() => {
      const config = firebaseConfig;
      // Check if Firebase credentials are configured
      if (config.apiKey === 'YOUR_API_KEY') {
        console.warn('Firebase credentials not configured. Please update firebase.config.ts');
      }
      return initializeApp(config);
    }),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};


