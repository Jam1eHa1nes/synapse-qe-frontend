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
              <div class="shimmer-bar"></div>
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
    .dashboard-container { padding: 3rem 2rem; max-width: 1400px; margin: 0 auto; }
    .header {
      display: flex; justify-content: space-between; align-items: flex-end;
      margin-bottom: 4rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem;
      h1 { font-size: 1.25rem; font-weight: 800; letter-spacing: 0.2em; .accent { color: var(--color-accent); } }
    }
    .status-indicator {
      display: flex; align-items: center; gap: 0.75rem; font-size: 0.7rem;
      font-weight: 700; color: var(--text-secondary); letter-spacing: 0.15em;
      .pulse-dot {
        width: 10px; height: 10px; background-color: var(--color-pass); border-radius: 50%;
        box-shadow: 0 0 12px var(--color-pass); animation: pulse 2.5s infinite;
      }
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2rem; }
    .run-card {
      padding: 2rem; transition: all 0.3s var(--ease-standard); cursor: pointer;
      &:hover { 
        transform: translateY(-8px); 
        border-color: var(--color-accent); 
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        background: rgba(30, 41, 59, 0.9);
      }
    }
    .run-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .build-info { 
      h3 { font-size: 1.5rem; margin-bottom: 0.25rem; color: var(--text-primary); } 
      .env-tag { font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; letter-spacing: 0.1em; } 
    }
    
    .loading-state {
      height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
      .shimmer-bar {
        width: 100%; height: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; overflow: hidden;
        &::after {
          content: ''; display: block; height: 100%; width: 50%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent);
          animation: shimmer 1.5s infinite;
        }
      }
      .pulsing-text { color: var(--text-secondary); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em; }
    }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; animation: slideUp 0.5s var(--ease-standard); }
    .stat-item {
      .label { display: block; font-size: 0.6rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 0.1em; }
      .value { font-size: 2rem; font-weight: 800; }
      .value.pass { color: var(--color-pass); text-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
      .value.fail { color: var(--color-fail); text-shadow: 0 0 20px rgba(244, 63, 94, 0.3); }
      .value.batches { color: var(--color-batches); }
    }

    .progress-bar-bg { height: 4px; background: rgba(255, 255, 255, 0.03); border-radius: 2px; overflow: hidden; margin-top: 1.5rem; }
    .progress-bar-fill { 
      height: 100%; 
      background: linear-gradient(90deg, var(--color-accent), #a855f7); 
      box-shadow: 0 0 15px rgba(129, 140, 248, 0.4); 
      transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &.fluid-anim {
        width: 100%;
        animation: fluidProgress 4s infinite linear;
        background-size: 200% 100%;
      }
    }

    .empty-state { 
      text-align: center; padding: 8rem 2rem; color: var(--text-secondary); 
      border: 2px dashed var(--border-color); border-radius: 20px;
      p { letter-spacing: 0.2em; font-size: 0.8rem; }
    }

    @keyframes fluidProgress {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes shimmer { 0% { transform: translateX(-150%); } 100% { transform: translateX(250%); } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 70% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); } 100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
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
