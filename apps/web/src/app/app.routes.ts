import { Routes } from '@angular/router';
import { studioAuthGuard } from './guards/studio-auth.guard';
import { studioRoleGuard } from './guards/studio-role.guard';
import { guidedSetupOnlyBeforeLive } from './studio/guided-setup';

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
      {
        // Studio's preview phone — the real guest app on a sample table.
        path: 'preview',
        loadComponent: () =>
          import('./pages/guest-preview.page').then((m) => m.GuestPreviewPageComponent),
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
    canActivateChild: [studioRoleGuard],
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
        // The guided first run. Once live, these links open the everyday pages.
        canActivateChild: [guidedSetupOnlyBeforeLive],
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
            path: 'payments/connect',
            loadComponent: () =>
              import('./pages/setup-payfast.page').then((m) => m.SetupPayfastPageComponent),
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
        // Everyday pages: the page beside the real guest app. Edits save as you go —
        // the same screens the guided first run walks, without Back / Continue.
        path: '',
        loadComponent: () =>
          import('./pages/studio-page-host.page').then((m) => m.StudioPageHostComponent),
        data: { studioPage: true },
        children: [
          {
            path: 'place',
            data: { studioPage: true },
            loadComponent: () =>
              import('./pages/setup-identity.page').then((m) => m.SetupIdentityPageComponent),
          },
          {
            path: 'tables',
            data: { studioPage: true },
            loadComponent: () =>
              import('./pages/setup-places.page').then((m) => m.SetupPlacesPageComponent),
          },
          {
            path: 'at-the-table',
            data: { studioPage: true },
            loadComponent: () =>
              import('./pages/studio-at-the-table.page').then(
                (m) => m.StudioAtTheTablePageComponent,
              ),
          },
          {
            path: 'payments',
            data: { studioPage: true },
            loadComponent: () =>
              import('./pages/setup-payments.page').then((m) => m.SetupPaymentsPageComponent),
          },
        ],
      },
      {
        path: 'payments/connect',
        loadComponent: () =>
          import('./pages/setup-payfast.page').then((m) => m.SetupPayfastPageComponent),
      },
      {
        path: 'connections',
        loadComponent: () =>
          import('./pages/setup-integrations.page').then(
            (m) => m.SetupIntegrationsPageComponent,
          ),
      },
      {
        path: 'connections/pilot',
        loadComponent: () =>
          import('./pages/setup-pilot.page').then((m) => m.SetupPilotPageComponent),
      },
      { path: 'integrations', redirectTo: 'connections' },
      { path: 'integrations/pilot', redirectTo: 'connections/pilot' },
      { path: 'integrations/payfast', redirectTo: 'payments/connect' },
      {
        path: 'menu',
        loadComponent: () =>
          import('./pages/studio-menu.page').then((m) => m.StudioMenuPageComponent),
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
      { path: 'organisation', redirectTo: 'place' },
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
      { path: 'configure', redirectTo: 'place' },
      { path: 'golive', redirectTo: 'setup/golive' },
      { path: 'live', redirectTo: 'setup/golive' },
    ],
  },

  { path: 'setup', pathMatch: 'full', redirectTo: 'studio' },
  { path: 'setup/organisation', redirectTo: 'studio/place' },
  { path: 'setup/golive', redirectTo: 'studio/setup/golive' },
  { path: 'setup/operate', redirectTo: 'studio/operate' },
  { path: 'setup/payments', redirectTo: 'studio/setup/payments' },
  { path: 'service', redirectTo: 'staff/service' },
  { path: 'station/:stationId', redirectTo: 'staff/station/:stationId' },
];
