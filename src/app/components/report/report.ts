import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LiveFeedService, TestCaseHistory } from '../../services/live-feed.service';
import { TestCase, TestRun } from '../../models/test-case.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="report-layout" [class.panel-open]="inspectedTestCase()">
      <div class="main-content">
        <div class="report-container" *ngIf="run()">
          <header class="report-header glass-card">
            <div class="header-main">
              <div class="build-info">
                <h1 class="tech-font">{{ run()?.buildNumber }}</h1>
                <span class="env-tag">{{ run()?.environment }}</span>
              </div>
              <div class="status-badge" [ngClass]="run()?.status?.toLowerCase()">
                {{ run()?.status }}
              </div>
            </div>

            <div class="tabs">
              <button (click)="activeTab = 'summary'" [class.active]="activeTab === 'summary'" class="tech-font">SUMMARY</button>
              <button (click)="activeTab = 'failures'" [class.active]="activeTab === 'failures'" class="tech-font">FAILURES</button>
              <button (click)="activeTab = 'history'" [class.active]="activeTab === 'history'" class="tech-font">HISTORY</button>
            </div>
          </header>

          <main class="report-content">
            <div *ngIf="activeTab === 'summary'" class="tab-pane summary-pane anim-fade-in">
              <div class="stats-overview">
                <div class="stat-card glass-card">
                  <span class="label">PASSED</span>
                  <span class="value pass">{{ run()?.totalPass }}</span>
                </div>
                <div class="stat-card glass-card">
                  <span class="label">FAILED</span>
                  <span class="value fail">{{ run()?.totalFail }}</span>
                </div>
                <div class="stat-card glass-card">
                  <span class="label">TOTAL BATCHES</span>
                  <span class="value">{{ run()?.batches?.length }}</span>
                </div>
              </div>

              <div class="batches-timeline">
                <h2 class="tech-font">EXECUTION TIMELINE</h2>
                <div class="timeline">
                  <div *ngFor="let batch of run()?.batches" class="timeline-item glass-card">
                    <div class="batch-head">
                      <span class="batch-id tech-font">{{ batch.batchId }}</span>
                      <span class="duration">{{ (batch.durationMs / 1000).toFixed(2) }}s</span>
                    </div>
                    <div class="batch-stats">
                      {{ batch.testCases.length }} Test Cases
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="activeTab === 'failures'" class="tab-pane failures-pane anim-fade-in">
              <div class="failures-list" *ngIf="getFailures().length > 0; else noFailures">
                <div *ngFor="let fail of getFailures()" 
                     class="failure-card glass-card" 
                     [class.active]="inspectedTestCase() === fail"
                     (click)="inspectTestCase(fail)">
                  <div class="fail-info">
                    <span class="suite-name">{{ fail.suiteName }}</span>
                    <h3 class="case-name">{{ fail.caseName }}</h3>
                  </div>
                  <div class="fail-meta">
                    <span class="fingerprint tech-font">{{ fail.errorFingerprint?.substring(0, 12) }}</span>
                    <span class="triage-btn">VIEW DETAILS →</span>
                  </div>
                </div>
              </div>
              <ng-template #noFailures>
                <div class="empty-state">
                  <p class="tech-font">NO FAILURES DETECTED</p>
                </div>
              </ng-template>
            </div>

            <div *ngIf="activeTab === 'history'" class="tab-pane history-pane anim-fade-in">
              <div class="history-list">
                <div *ngFor="let h of historicalRuns()" class="history-card glass-card" [routerLink]="['/report', h.buildNumber]">
                  <div class="h-info">
                    <span class="h-build tech-font">{{ h.buildNumber }}</span>
                    <span class="h-env">{{ h.environment }}</span>
                  </div>
                  <div class="h-stats">
                    <span class="pass">{{ h.totalPass }} P</span>
                    <span class="fail">{{ h.totalFail }} F</span>
                  </div>
                </div>
                <div *ngIf="historicalRuns().length === 0" class="empty-state">
                  <p class="tech-font">NO PREVIOUS RUNS FOUND</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <aside class="side-panel glass-card" *ngIf="inspectedTestCase()">
        <header class="panel-header">
          <div class="panel-title">
            <span class="status-icon" [class.pass]="inspectedTestCase()?.status === 'PASS'" [class.fail]="inspectedTestCase()?.status === 'FAIL'">●</span>
            <div>
              <span class="suite-label">{{ inspectedTestCase()?.suiteName }}</span>
              <h2 class="tech-font">{{ inspectedTestCase()?.caseName }}</h2>
            </div>
          </div>
          <button class="close-btn" (click)="inspectedTestCase.set(null)">✕</button>
        </header>

        <div class="panel-tabs">
          <button (click)="activePanelTab = 'steps'" [class.active]="activePanelTab === 'steps'">STEPS</button>
          <button (click)="activePanelTab = 'details'" [class.active]="activePanelTab === 'details'">DETAILS</button>
          <button (click)="activePanelTab = 'retries'" [class.active]="activePanelTab === 'retries'">RETRIES</button>
          <button (click)="activePanelTab = 'history'" [class.active]="activePanelTab === 'history'">HISTORY</button>
        </div>

        <div class="panel-content">
          <div *ngIf="activePanelTab === 'steps'" class="panel-pane anim-fade-in">
            <div class="steps-timeline" *ngIf="inspectedTestCase()?.steps?.length; else noSteps">
              <div *ngFor="let step of inspectedTestCase()?.steps" class="step-item">
                <div class="step-indicator" [class.pass]="step.status === 'PASS'" [class.fail]="step.status === 'FAIL'">
                  <span class="dot"></span>
                  <span class="line"></span>
                </div>
                <div class="step-content">
                  <div class="step-header">
                    <span class="step-name">{{ step.name }}</span>
                    <span class="step-duration">{{ step.durationMs }}ms</span>
                  </div>
                  <div class="step-error" *ngIf="step.errorMessage">{{ step.errorMessage }}</div>
                </div>
              </div>
            </div>
            <ng-template #noSteps>
              <div class="empty-panel-state">
                <p>No granular steps recorded for this test.</p>
              </div>
            </ng-template>
          </div>

          <div *ngIf="activePanelTab === 'details'" class="panel-pane anim-fade-in">
            <div class="error-block" *ngIf="inspectedTestCase()?.errorMessage">
              <label class="tech-font">ERROR MESSAGE</label>
              <div class="error-msg">{{ inspectedTestCase()?.errorMessage }}</div>
            </div>
            
            <div class="stack-block" *ngIf="inspectedTestCase()?.rawStackTrace">
              <label class="tech-font">STACK TRACE</label>
              <pre class="stack-trace"><code>{{ sanitizeStack(inspectedTestCase()!.rawStackTrace!) }}</code></pre>
            </div>
          </div>

          <div *ngIf="activePanelTab === 'retries'" class="panel-pane anim-fade-in">
            <div class="empty-panel-state">
              <p>No retry data available.</p>
            </div>
          </div>

          <div *ngIf="activePanelTab === 'history'" class="panel-pane anim-fade-in">
            <div class="case-history-list">
              <div *ngFor="let hist of testCaseHistory()" class="history-item">
                <span class="hist-status" [class.pass]="hist.status === 'PASS'" [class.fail]="hist.status === 'FAIL'">●</span>
                <span class="hist-build tech-font">{{ hist.buildNumber }}</span>
                <span class="hist-env">{{ hist.environment }}</span>
              </div>
              <div *ngIf="testCaseHistory().length === 0" class="empty-panel-state">
                <p>No history found.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .report-layout { display: flex; height: 100vh; overflow: hidden; }
    .main-content { flex: 1; overflow-y: auto; padding: 2rem; }
    .panel-open .main-content { margin-right: 400px; }
    .report-container { max-width: 1000px; margin: 0 auto; }
    .report-header { padding: 2rem; margin-bottom: 2rem; border-radius: 16px; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .build-info h1 { font-size: 2.5rem; margin: 0; }
    .env-tag { color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; }
    .status-badge { padding: 0.5rem 1rem; border-radius: 100px; font-size: 0.75rem; font-weight: bold; border: 1px solid currentColor; }
    .status-badge.in_progress { color: var(--color-accent); }
    .status-badge.completed { color: var(--color-pass); }
    .tabs { display: flex; gap: 2rem; border-top: 1px solid var(--border-color); padding-top: 1rem; }
    .tabs button { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.5rem 0; font-size: 0.8rem; }
    .tabs button.active { color: var(--color-accent); border-bottom: 2px solid var(--color-accent); }
    .side-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; background: #0f172a; border-left: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 1000; box-shadow: -10px 0 30px rgba(0,0,0,0.5); }
    .panel-header { padding: 1.5rem; display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); }
    .status-icon.pass { color: var(--color-pass); }
    .status-icon.fail { color: var(--color-fail); }
    .panel-tabs { display: flex; border-bottom: 1px solid var(--border-color); }
    .panel-tabs button { flex: 1; padding: 1rem; background: none; border: none; color: var(--text-secondary); font-size: 0.7rem; }
    .panel-tabs button.active { color: var(--color-accent); border-bottom: 2px solid var(--color-accent); }
    .panel-content { flex: 1; overflow-y: auto; padding: 1.5rem; }
    
    .steps-timeline { display: flex; flex-direction: column; gap: 0; }
    .step-item { display: flex; gap: 1rem; min-height: 50px; }
    .step-indicator { display: flex; flex-direction: column; align-items: center; width: 20px; }
    .step-indicator .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-secondary); margin-top: 6px; z-index: 1; }
    .step-indicator .line { flex: 1; width: 2px; background: rgba(255,255,255,0.1); margin: 2px 0; }
    .step-item:last-child .step-indicator .line { display: none; }
    
    .step-indicator.pass .dot { background: var(--color-pass); box-shadow: 0 0 8px var(--color-pass); }
    .step-indicator.fail .dot { background: var(--color-fail); box-shadow: 0 0 8px var(--color-fail); }
    
    .step-content { flex: 1; padding-bottom: 1.5rem; }
    .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .step-name { font-size: 0.85rem; color: var(--text-primary); }
    .step-duration { font-size: 0.7rem; color: var(--text-secondary); }
    .step-error { font-size: 0.75rem; color: var(--color-fail); background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; }

    .stack-trace { background: #020617; padding: 1rem; border-radius: 8px; font-size: 0.75rem; overflow-x: auto; }
    .history-item { display: flex; gap: 1rem; align-items: center; padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .stats-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
    .stat-card { padding: 1.5rem; }
    .failure-card { padding: 1.5rem; margin-bottom: 1rem; cursor: pointer; border: 1px solid var(--border-color); border-radius: 8px; }
    .failure-card.active { border-color: var(--color-accent); }
    .history-card { padding: 1rem 1.5rem; margin-bottom: 0.75rem; cursor: pointer; border: 1px solid var(--border-color); border-radius: 8px; }
    .anim-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ReportComponent implements OnInit, OnDestroy {
  run = signal<TestRun | null>(null);
  historicalRuns = signal<TestRun[]>([]);
  inspectedTestCase = signal<TestCase | null>(null);
  testCaseHistory = signal<TestCaseHistory[]>([]);
  activeTab: 'summary' | 'failures' | 'history' = 'summary';
  activePanelTab: 'steps' | 'details' | 'retries' | 'history' = 'steps';
  private sub?: Subscription;
  private streamSub?: Subscription;

  constructor(private route: ActivatedRoute, private liveFeedService: LiveFeedService) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      const buildNumber = params['buildNumber'];
      this.loadReport(buildNumber);
    });
    this.streamSub = this.liveFeedService.getLiveStream().subscribe(update => {
      const current = this.run();
      if (current && current.buildNumber === update.buildNumber) {
        this.loadReport(update.buildNumber);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.streamSub?.unsubscribe();
  }

  loadReport(buildNumber: string) {
    this.liveFeedService.getReportDetails(buildNumber).subscribe(details => {
      this.run.set(details);
      this.loadHistory();
    });
  }

  loadHistory() {
    const current = this.run();
    if (current) {
      this.liveFeedService.getHistoricalReports(current.environment).subscribe(runs => {
        this.historicalRuns.set(runs);
      });
    }
  }

  inspectTestCase(testCase: TestCase) {
    this.inspectedTestCase.set(testCase);
    this.activePanelTab = testCase.status === 'FAIL' ? 'details' : 'steps';
    const current = this.run();
    if (current) {
      this.liveFeedService.getTestCaseHistory(testCase.suiteName, testCase.caseName, current.environment)
        .subscribe(history => this.testCaseHistory.set(history));
    }
  }

  getFailures(): TestCase[] {
    const current = this.run();
    if (!current) return [];
    return current.batches.flatMap(b => b.testCases).filter(t => t.status === 'FAIL');
  }

  sanitizeStack(stack: string): string {
    return stack;
  }
}
