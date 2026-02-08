import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Usar zoneless para mejor rendimiento con signals
    provideZonelessChangeDetection(),
    provideRouter(routes)
  ]
};
