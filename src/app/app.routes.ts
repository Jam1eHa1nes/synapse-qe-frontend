import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ReportComponent } from './components/report/report';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'report/:buildNumber', component: ReportComponent },
  { path: '**', redirectTo: '' }
];
