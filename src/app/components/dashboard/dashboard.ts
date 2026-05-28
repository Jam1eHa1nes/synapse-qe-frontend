import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveFeedService } from '../../services/live-feed.service';
import { LiveUpdate } from '../../models/live-update.model';
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
          <div *ngFor="let update of updates" class="glass-card run-card">
            <div class="run-header">
              <div class="build-info">
                <h3 class="tech-font">{{ update.buildNumber }}</h3>
                <span class="env-tag">{{ update.environment }}</span>
              </div>
              <span class="badge" [ngClass]="update.status.toLowerCase()">
                {{ update.status }}
              </span>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">PASSED</span>
                <span class="value pass">{{ update.totalPass }}</span>
              </div>
              <div class="stat-item">
                <span class="label">FAILED</span>
                <span class="value fail">{{ update.totalFail }}</span>
              </div>
              <div class="stat-item">
                <span class="label">BATCHES</span>
                <span class="value">{{ update.batchCount }}</span>
              </div>
            </div>

            <div class="progress-bar-bg">
              <div class="progress-bar-fill" [style.width.%]="calculateProgress(update)"></div>
            </div>
          </div>
        </div>

        <div *ngIf="updates.length === 0" class="empty-state">
          <p class="tech-font">WAITING FOR INBOUND TEST STREAMS...</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 800;
        .accent { color: var(--color-accent); }
      }
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
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

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .run-card {
      padding: 1.5rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        border-color: rgba(99, 102, 241, 0.3);
      }
    }

    .run-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .build-info {
      h3 { font-size: 1.25rem; margin-bottom: 0.25rem; }
      .env-tag { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      .label { display: block; font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; }
      .value { font-size: 1.5rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
      .value.pass { color: var(--color-pass); }
      .value.fail { color: var(--color-fail); }
    }

    .progress-bar-bg {
      height: 4px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--color-accent);
      box-shadow: 0 0 10px var(--color-accent);
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .empty-state {
      text-align: center;
      padding: 5rem;
      color: var(--text-secondary);
      border: 2px dashed var(--border-color);
      border-radius: 12px;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  updates: LiveUpdate[] = [];
  private subscription?: Subscription;

  constructor(private liveFeedService: LiveFeedService) {}

  ngOnInit() {
    this.subscription = this.liveFeedService.getLiveStream().subscribe({
      next: (update) => {
        const index = this.updates.findIndex(u => u.buildNumber === update.buildNumber);
        if (index > -1) {
          this.updates[index] = update;
        } else {
          this.updates.unshift(update);
        }
      },
      error: (err) => console.error('SSE Error:', err)
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  calculateProgress(update: LiveUpdate): number {
    const total = update.totalPass + update.totalFail;
    if (total === 0) return 0;
    return Math.min(100, (total / (total + 10)) * 100); // Mock progress logic since we don't have "total expected"
  }
}
