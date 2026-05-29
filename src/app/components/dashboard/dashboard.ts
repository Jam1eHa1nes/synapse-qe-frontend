import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveFeedService } from '../../services/live-feed.service';
import { LiveUpdate } from '../../models/live-update.model';
import { TestCase, TestRun } from '../../models/test-case.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="header">
        <h1 class="tech-font">SYNAPSE<span class="accent">QE</span></h1>
        <div class="status-indicator">
          <div class="pulse-dot"></div>
          <span>LIVE ENGINE ACTIVE</span>
        </div>
      </header>

      <main class="content">
        <div class="grid">
          <div *ngFor="let run of activeRuns()" 
               class="glass-card run-card" 
               (click)="navigateToReport(run)">
            
            <div class="run-header">
              <div class="build-info">
                <h3 class="tech-font">{{ run.buildNumber }}</h3>
                <span class="env-tag">{{ run.environment }}</span>
              </div>
              <span class="badge" [ngClass]="run.status.toLowerCase()">
                {{ run.status }}
              </span>
            </div>

            <!-- IN PROGRESS STATE -->
            <div *ngIf="run.status === 'IN_PROGRESS'" class="loading-state">
              <p class="tech-font pulsing-text">AGGREGATING LIVE PIPELINE STREAMS...</p>
            </div>

            <!-- COMPLETED STATE -->
            <div *ngIf="run.status === 'COMPLETED'" class="stats-grid">
              <div class="stat-item">
                <span class="label">PASSED</span>
                <span class="value pass">{{ run.totalPass }}</span>
              </div>
              <div class="stat-item">
                <span class="label">FAILED</span>
                <span class="value fail">{{ run.totalFail }}</span>
              </div>
              <div class="stat-item">
                <span class="label">BATCHES</span>
                <span class="value batches">{{ run.batches.length || 0 }}</span>
              </div>
            </div>

            <div class="progress-bar-bg">
              <div class="progress-bar-fill" 
                   [class.fluid-anim]="run.status === 'IN_PROGRESS'"
                   [style.width.%]="run.status === 'COMPLETED' ? 100 : 95"></div>
            </div>
          </div>
        </div>

        <div *ngIf="activeRuns().length === 0" class="empty-state">
          <p class="tech-font">WAITING FOR INBOUND TEST STREAMS...</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 3rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;
      h1 { font-size: 1.5rem; font-weight: 800; .accent { color: var(--color-accent); } }
    }
    .status-indicator {
      display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;
      font-weight: 600; color: var(--text-secondary); letter-spacing: 0.1em;
      .pulse-dot {
        width: 8px; height: 8px; background-color: var(--color-pass); border-radius: 50%;
        box-shadow: 0 0 10px var(--color-pass); animation: pulse 2s infinite;
      }
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .run-card {
      padding: 1.5rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
      &:hover { transform: translateY(-4px); border-color: rgba(99, 102, 241, 0.3); }
    }
    .run-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .build-info { h3 { font-size: 1.25rem; } .env-tag { font-size: 0.75rem; color: var(--text-secondary); } }
    
    .loading-state {
      height: 60px; display: flex; align-items: center; justify-content: center;
      .pulsing-text { color: #6B7280; font-size: 0.75rem; letter-spacing: 0.15em; animation: fadeInOut 2s infinite; }
    }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; animation: slideUp 0.4s ease-out; }
    .stat-item {
      .label { display: block; font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
      .value { font-size: 1.5rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
      .value.pass { color: var(--color-pass); }
      .value.fail { color: var(--color-fail); }
      .value.batches { color: #06B6D4; }
    }

    .progress-bar-bg { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; overflow: hidden; margin-top: 1rem; }
    .progress-bar-fill { 
      height: 100%; 
      background: linear-gradient(90deg, #6366f1, #a855f7); 
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.5); 
      transition: width 1s ease-in-out;
      
      &.fluid-anim {
        width: 100%;
        animation: fluidProgress 3s infinite linear;
        background-size: 200% 100%;
      }
    }

    .empty-state { text-align: center; padding: 5rem; color: var(--text-secondary); border: 2px dashed var(--border-color); border-radius: 12px; }

    @keyframes fluidProgress {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes fadeInOut { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeRuns = signal<TestRun[]>([]);
  private subscription?: Subscription;

  constructor(private liveFeedService: LiveFeedService, private router: Router) {}

  ngOnInit() {
    this.liveFeedService.getActiveReports().subscribe(runs => {
      this.activeRuns.set(runs);
    });

    this.subscription = this.liveFeedService.getLiveStream().subscribe({
      next: (update) => {
        const runs = this.activeRuns();
        const index = runs.findIndex(r => r.buildNumber === update.buildNumber);
        if (index > -1) {
          const updatedRuns = [...runs];
          updatedRuns[index] = {
            ...updatedRuns[index],
            totalPass: update.totalPass,
            totalFail: update.totalFail,
            status: update.status
          };
          this.activeRuns.set(updatedRuns);
        } else {
          this.refreshAllRuns();
        }
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  navigateToReport(run: TestRun) {
    this.router.navigate(['/report', run.buildNumber]);
  }

  refreshAllRuns() {
    this.liveFeedService.getActiveReports().subscribe(runs => {
      this.activeRuns.set(runs);
    });
  }
}
