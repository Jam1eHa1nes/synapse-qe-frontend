import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav *ngIf="authService.user()" class="nav-bar glass-card">
      <div class="nav-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="tech-font">LIVE DASHBOARD</a>
      </div>
      <div class="system-status">
        <div class="pulse-dot"></div>
        <span class="tech-font">SYSTEM ONLINE</span>
      </div>
    </nav>
    
    <router-outlet></router-outlet>
  `,
  styles: [`
    .nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      margin: 1rem 2rem 0;
      border-radius: 12px;
      position: sticky;
      top: 1rem;
      z-index: 100;
    }
    
    .nav-links {
      display: flex;
      gap: 2rem;
      
      a {
        text-decoration: none;
        color: var(--text-secondary);
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        transition: all 0.3s ease;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        
        &:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.05); }
        &.active { color: var(--color-pass); background: rgba(16, 185, 129, 0.1); }
      }
    }
    
    .system-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: var(--text-secondary);
      letter-spacing: 0.1em;
      
      .pulse-dot {
        width: 8px;
        height: 8px;
        background-color: var(--color-pass);
        border-radius: 50%;
        box-shadow: 0 0 10px var(--color-pass);
        animation: pulse 2s infinite;
      }
    }
    
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
}
