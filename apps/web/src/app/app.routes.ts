import { Routes } from '@angular/router';
import { studioAuthGuard } from './guards/studio-auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/website-home.page').then((m) => m.WebsiteHomePageComponent),
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./pages/studio-signin.page').then((m) => m.StudioSignInPageComponent),
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/guest-splash.page').then((m) => m.GuestSplashPageComponent),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./pages/onboarding.page').then((m) => m.OnboardingPageComponent),
  },
  {
    path: 'scan',
    loadComponent: () =>
      import('./pages/scan-qr.page').then((m) => m.ScanQrPageComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy.page').then((m) => m.PrivacyPageComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms.page').then((m) => m.TermsPageComponent),
  },

  {
    path: '',
    loadComponent: () =>
      import('./shells/experience-shell.component').then((m) => m.ExperienceShellComponent),
    children: [
      {
        path: 'entry',
        loadComponent: () => import('./pages/entry.page').then((m) => m.EntryPageComponent),
      },
      {
        path: 'e/:token',
        loadComponent: () => import('./pages/entry.page').then((m) => m.EntryPageComponent),
      },
      {
        path: 'experience',
        loadComponent: () => import('./pages/guest.page').then((m) => m.GuestPageComponent),
      },
      {
        path: 'guest',
        loadComponent: () => import('./pages/guest.page').then((m) => m.GuestPageComponent),
      },
    ],
  },

  {
    path: 'staff',
    loadComponent: () =>
      import('./shells/staff-shell.component').then((m) => m.StaffShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/staff-entry.page').then((m) => m.StaffEntryPageComponent),
      },
      {
        path: 'service',
        loadComponent: () =>
          import('./pages/service.page').then((m) => m.ServicePageComponent),
      },
      {
        path: 'station/:stationId',
        loadComponent: () =>
          import('./pages/station.page').then((m) => m.StationPageComponent),
      },
      { path: 'kitchen', redirectTo: 'station/kitchen' },
      { path: 'bar', redirectTo: 'station/bar' },
      { path: 'waiter', redirectTo: 'service' },
      { path: 'counter', redirectTo: 'station/counter' },
    ],
  },

  {
    path: 'studio',
    loadComponent: () =>
      import('./shells/studio-shell.component').then((m) => m.StudioShellComponent),
    canActivate: [studioAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/studio-home.page').then((m) => m.StudioHomePageComponent),
      },
      {
        path: 'welcome',
        loadComponent: () =>
          import('./pages/studio-welcome.page').then((m) => m.StudioWelcomePageComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/studio-create.page').then((m) => m.StudioCreatePageComponent),
      },
      {
        path: 'setup',
        loadComponent: () =>
          import('./pages/setup-engine-host.page').then((m) => m.SetupEngineHostPageComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'identity' },
          {
            path: 'identity',
            loadComponent: () =>
              import('./pages/setup-identity.page').then((m) => m.SetupIdentityPageComponent),
          },
          {
            path: 'experience',
            loadComponent: () =>
              import('./pages/setup-experience-step.page').then(
                (m) => m.SetupExperienceStepPageComponent,
              ),
          },
          {
            path: 'places',
            loadComponent: () =>
              import('./pages/setup-places.page').then((m) => m.SetupPlacesPageComponent),
          },
          {
            path: 'payments',
            loadComponent: () =>
              import('./pages/setup-payments.page').then((m) => m.SetupPaymentsPageComponent),
          },
          {
            path: 'golive',
            loadComponent: () =>
              import('./pages/setup-golive-engine.page').then(
                (m) => m.SetupGoliveEnginePageComponent,
              ),
          },
        ],
      },
      {
        path: 'operate',
        loadComponent: () =>
          import('./pages/setup-operate.page').then((m) => m.SetupOperatePageComponent),
      },
      { path: 'operate/staff', redirectTo: '/staff' },
      {
        path: 'team',
        loadComponent: () =>
          import('./pages/studio-team.page').then((m) => m.StudioTeamPageComponent),
      },
      {
        path: 'grow',
        loadComponent: () =>
          import('./pages/studio-grow.page').then((m) => m.StudioGrowPageComponent),
      },
      { path: 'organisation', redirectTo: 'setup/identity' },
      {
        path: 'station/:stationId',
        redirectTo: ({ params }) => `/staff/station/${params['stationId']}`,
      },
      { path: 'service', redirectTo: '/staff/service' },
      { path: 'kitchen', redirectTo: '/staff/station/kitchen' },
      { path: 'bar', redirectTo: '/staff/station/bar' },
      { path: 'waiter', redirectTo: '/staff/service' },
      { path: 'counter', redirectTo: '/staff/station/counter' },
      { path: 'choose', redirectTo: 'create' },
      { path: 'configure', redirectTo: 'setup/identity' },
      { path: 'payments', redirectTo: 'setup/payments' },
      { path: 'golive', redirectTo: 'setup/golive' },
      { path: 'live', redirectTo: 'setup/golive' },
    ],
  },

  { path: 'setup', pathMatch: 'full', redirectTo: 'studio' },
  { path: 'setup/organisation', redirectTo: 'studio/setup/identity' },
  { path: 'setup/golive', redirectTo: 'studio/setup/golive' },
  { path: 'setup/operate', redirectTo: 'studio/operate' },
  { path: 'setup/payments', redirectTo: 'studio/setup/payments' },
  { path: 'service', redirectTo: 'staff/service' },
  { path: 'station/:stationId', redirectTo: 'staff/station/:stationId' },
];
