import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ReportComponent } from './components/report/report';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'report/:buildNumber', component: ReportComponent, canActivate: [authGuard] },
];
