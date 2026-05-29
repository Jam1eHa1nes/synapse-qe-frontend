import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-layout">
      <div class="login-card glass-card">
        <h1 class="tech-font">SYNAPSE<span class="accent">QE</span></h1>
        <p class="subtitle tech-font">DOMAIN AUTHENTICATION</p>
        
        <form (ngSubmit)="login()" #loginForm="ngForm">
          <div class="input-group">
            <label class="tech-font">EMAIL</label>
            <input type="email" name="email" [(ngModel)]="email" required />
          </div>
          <div class="input-group">
            <label class="tech-font">PASSWORD</label>
            <input type="password" name="password" [(ngModel)]="password" required />
          </div>

          <div *ngIf="authService.authError()" class="error-msg tech-font">
            {{ authService.authError() }}
          </div>

          <button type="submit" class="tech-font" [disabled]="!loginForm.form.valid || loading">
            {{ loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-layout { display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--bg-color); }
    .login-card { padding: 4rem; width: 100%; max-width: 450px; display: flex; flex-direction: column; gap: 2rem; }
    h1 { font-size: 2rem; text-align: center; margin: 0; letter-spacing: 0.1em; .accent { color: var(--color-accent); } }
    .subtitle { text-align: center; color: var(--text-secondary); font-size: 0.8rem; letter-spacing: 0.2em; margin-bottom: 1rem; }
    
    .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
    label { font-size: 0.75rem; color: var(--text-secondary); letter-spacing: 0.1em; }
    input { 
      background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary); 
      padding: 1rem; border-radius: 8px; font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
      &:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 15px rgba(129, 140, 248, 0.2); }
    }
    
    button {
      width: 100%; padding: 1.25rem; background: var(--color-accent); color: white; border: none; 
      border-radius: 8px; font-weight: 800; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;
      margin-top: 1rem;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(129, 140, 248, 0.4); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    
    .error-msg { color: var(--color-fail); font-size: 0.75rem; padding: 1rem; background: rgba(244, 63, 94, 0.1); border-radius: 8px; text-align: center; }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  email = '';
  password = '';
  loading = false;

  async login() {
    this.loading = true;
    const { data, error } = await this.authService.signIn(this.email, this.password);
    
    if (data) {
      // 1. Successful Neon Login.
      // 2. Now verify domain access with the backend
      this.http.get('/api/v1/auth/verify', { responseType: 'text' }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/']); // Go to dashboard
        },
        error: async (err) => {
          this.loading = false;
          await this.authService.signOut();
          if (err.status === 403) {
            this.authService.authError.set("ACCESS DENIED: You do not have permission for this domain.");
          } else {
            this.authService.authError.set("Backend verification failed.");
          }
        }
      });
    } else {
      this.loading = false;
    }
  }
}
