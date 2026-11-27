// Must stay the first import: Studio's preview phone swaps storage before anything reads it.
import './app/preview/preview-boot';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
