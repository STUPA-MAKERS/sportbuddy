import { Routes } from '@angular/router';
import { adminGuard } from './admin/admin.guard';

export const routes: Routes = [
  {
    path: 'admin/anmelden',
    title: 'Anmelden · Sportbuddy Verwaltung',
    loadComponent: () => import('./admin/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'admin/kein-zugriff',
    title: 'Kein Zugriff · Sportbuddy Verwaltung',
    loadComponent: () => import('./admin/admin-forbidden.component').then((m) => m.AdminForbiddenComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'moderation' },
      {
        path: 'moderation',
        title: 'Moderation · Sportbuddy',
        loadComponent: () => import('./admin/moderation.component').then((m) => m.ModerationComponent),
      },
      {
        path: 'moderation/:id',
        title: 'Moderation · Sportbuddy',
        loadComponent: () => import('./admin/moderation.component').then((m) => m.ModerationComponent),
      },
      {
        path: 'einstellungen',
        title: 'Einstellungen · Sportbuddy',
        loadComponent: () => import('./admin/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./public/public-shell.component').then((m) => m.PublicShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Sportbuddy · Sportpartner finden',
        loadComponent: () => import('./public/discover.component').then((m) => m.DiscoverComponent),
      },
      {
        path: 'anfrage/:id',
        title: 'Sportbuddy · Anfrage',
        loadComponent: () => import('./public/discover.component').then((m) => m.DiscoverComponent),
      },
      {
        path: 'erstellen',
        title: 'Anfrage erstellen · Sportbuddy',
        data: { flow: true },
        loadComponent: () => import('./public/create.component').then((m) => m.CreateComponent),
      },
      {
        path: 'verify/:token',
        title: 'E-Mail bestätigen · Sportbuddy',
        data: { flow: true },
        loadComponent: () => import('./public/verify.component').then((m) => m.VerifyComponent),
      },
      {
        path: 'manage/:token',
        title: 'Deine Anfrage · Sportbuddy',
        data: { flow: true },
        loadComponent: () => import('./public/manage.component').then((m) => m.ManageComponent),
      },
      // Older links and emails.
      { path: 'request/:id', redirectTo: 'anfrage/:id' },
      { path: 'create', redirectTo: 'erstellen' },
      { path: 'edit/:token', redirectTo: 'manage/:token' },
      { path: 'delete/:token', redirectTo: 'manage/:token' },
      { path: '**', redirectTo: '' },
    ],
  },
];
