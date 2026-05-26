import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/create-request/create-request.component').then(m => m.CreateRequestComponent)
  },
  {
    path: 'request/:id',
    loadComponent: () => import('./components/request-detail/request-detail.component').then(m => m.RequestDetailComponent)
  },
  {
    path: 'edit/:token',
    loadComponent: () => import('./components/edit-request/edit-request.component').then(m => m.EditRequestComponent)
  },
  {
    path: 'delete/:token',
    loadComponent: () => import('./components/delete-request/delete-request.component').then(m => m.DeleteRequestComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
