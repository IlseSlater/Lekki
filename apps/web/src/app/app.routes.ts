import { Routes } from '@angular/router';
import { ExperienceShellComponent } from './shells/experience-shell.component';
import { StudioShellComponent } from './shells/studio-shell.component';
import { StaffShellComponent } from './shells/staff-shell.component';
import { EntryPageComponent } from './pages/entry.page';
import { GuestPageComponent } from './pages/guest.page';
import { ServicePageComponent } from './pages/service.page';
import { StationPageComponent } from './pages/station.page';
import { SetupOperatePageComponent } from './pages/setup-operate.page';
import { StaffEntryPageComponent } from './pages/staff-entry.page';
import { StudioTeamPageComponent } from './pages/studio-team.page';
import { SetupPaymentsPageComponent } from './pages/setup-payments.page';
import { StudioWelcomePageComponent } from './pages/studio-welcome.page';
import { StudioCreatePageComponent } from './pages/studio-create.page';
import { StudioHomePageComponent } from './pages/studio-home.page';
import { StudioGrowPageComponent } from './pages/studio-grow.page';
import { SetupEngineHostPageComponent } from './pages/setup-engine-host.page';
import { SetupIdentityPageComponent } from './pages/setup-identity.page';
import { SetupExperienceStepPageComponent } from './pages/setup-experience-step.page';
import { SetupPlacesPageComponent } from './pages/setup-places.page';
import { SetupGoliveEnginePageComponent } from './pages/setup-golive-engine.page';
import { OnboardingPageComponent } from './pages/onboarding.page';
import { ScanQrPageComponent } from './pages/scan-qr.page';
import { WebsiteHomePageComponent } from './pages/website-home.page';
import { StudioSignInPageComponent } from './pages/studio-signin.page';
import { GuestSplashPageComponent } from './pages/guest-splash.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: WebsiteHomePageComponent },
  { path: 'signin', component: StudioSignInPageComponent },
  { path: 'splash', component: GuestSplashPageComponent },
  { path: 'onboarding', component: OnboardingPageComponent },
  { path: 'scan', component: ScanQrPageComponent },

  {
    path: '',
    component: ExperienceShellComponent,
    children: [
      { path: 'entry', component: EntryPageComponent },
      { path: 'e/:token', component: EntryPageComponent },
      { path: 'experience', component: GuestPageComponent },
      { path: 'guest', component: GuestPageComponent },
    ],
  },

  {
    path: 'staff',
    component: StaffShellComponent,
    children: [
      { path: '', component: StaffEntryPageComponent },
      { path: 'service', component: ServicePageComponent },
      { path: 'station/:stationId', component: StationPageComponent },
      { path: 'kitchen', redirectTo: 'station/kitchen' },
      { path: 'bar', redirectTo: 'station/bar' },
      { path: 'waiter', redirectTo: 'service' },
      { path: 'counter', redirectTo: 'station/counter' },
    ],
  },

  {
    path: 'studio',
    component: StudioShellComponent,
    children: [
      { path: '', component: StudioHomePageComponent },
      { path: 'welcome', component: StudioWelcomePageComponent },
      { path: 'create', component: StudioCreatePageComponent },
      {
        path: 'setup',
        component: SetupEngineHostPageComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'identity' },
          { path: 'identity', component: SetupIdentityPageComponent },
          { path: 'experience', component: SetupExperienceStepPageComponent },
          { path: 'places', component: SetupPlacesPageComponent },
          { path: 'payments', component: SetupPaymentsPageComponent },
          { path: 'golive', component: SetupGoliveEnginePageComponent },
        ],
      },
      { path: 'operate', component: SetupOperatePageComponent },
      { path: 'operate/staff', redirectTo: '/staff' },
      { path: 'team', component: StudioTeamPageComponent },
      { path: 'grow', component: StudioGrowPageComponent },
      { path: 'organisation', redirectTo: 'setup/identity' },
      // Legacy Studio floor boards → Staff Experience
      {
        path: 'station/:stationId',
        redirectTo: ({ params }) => `/staff/station/${params['stationId']}`,
      },
      { path: 'service', redirectTo: '/staff/service' },
      { path: 'kitchen', redirectTo: '/staff/station/kitchen' },
      { path: 'bar', redirectTo: '/staff/station/bar' },
      { path: 'waiter', redirectTo: '/staff/service' },
      { path: 'counter', redirectTo: '/staff/station/counter' },

      // Legacy guided routes → Experience Engine
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
