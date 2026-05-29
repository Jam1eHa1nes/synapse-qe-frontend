import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LiveFeedService, TestCaseHistory } from '../../services/live-feed.service';
import { DashboardLayoutService, WidgetType } from '../../services/dashboard-layout.service';
import { TestCase, TestRun } from '../../models/test-case.model';
import { Subscription } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { PassRatePieComponent } from '../widgets/pass-rate-pie.component';
import { HistoricalTrendComponent } from '../widgets/historical-trend.component';
import { ExecutionMetricsComponent } from '../widgets/execution-metrics.component';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    DragDropModule,
    PassRatePieComponent,
    HistoricalTrendComponent,
    ExecutionMetricsComponent
  ],
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
              <button (click)="activeTab = 'cases'" [class.active]="activeTab === 'cases'" class="tech-font">TEST CASES</button>
              <button (click)="activeTab = 'history'" [class.active]="activeTab === 'history'" class="tech-font">HISTORY</button>
            </div>
          </header>

          <main class="report-content">
            <div *ngIf="activeTab === 'summary'" class="tab-pane summary-pane anim-fade-in">
              <div class="dashboard-grid" cdkDropList cdkDropListOrientation="horizontal" (cdkDropListDropped)="onWidgetDrop($event)">
                <div *ngFor="let widget of layoutService.layout()" cdkDrag class="widget-wrapper">
                  <div class="drag-placeholder" *cdkDragPlaceholder></div>
                  
                  <app-pass-rate-pie *ngIf="widget === 'pie'" [run]="run()"></app-pass-rate-pie>
                  <app-historical-trend *ngIf="widget === 'trend'" [history]="historicalRuns()"></app-historical-trend>
                  <app-execution-metrics *ngIf="widget === 'metrics'" [run]="run()"></app-execution-metrics>
                </div>
              </div>
            </div>

            <div *ngIf="activeTab === 'cases'" class="tab-pane cases-pane anim-fade-in">
              <div class="cases-layout">
                <div class="cases-sidebar">
                  <div class="filter-bar">
                    <button (click)="statusFilter = 'ALL'" [class.active]="statusFilter === 'ALL'">ALL</button>
                    <button (click)="statusFilter = 'PASS'" [class.active]="statusFilter === 'PASS'">PASS</button>
                    <button (click)="statusFilter = 'FAIL'" [class.active]="statusFilter === 'FAIL'">FAIL</button>
                  </div>

                  <div class="suites-list">
                    <div *ngFor="let suite of getGroupedCases()" class="suite-group">
                      <div class="suite-header tech-font">
                        <span class="suite-icon">📁</span>
                        <span class="suite-name">{{ suite.name }}</span>
                        <span class="suite-count">{{ suite.cases.length }}</span>
                      </div>
                      <div class="suite-cases">
                        <div *ngFor="let test of suite.cases" 
                             class="test-item" 
                             [class.active]="inspectedTestCase() === test"
                             [class.pass]="test.status === 'PASS'"
                             [class.fail]="test.status === 'FAIL'"
                             (click)="inspectTestCase(test)">
                          <span class="status-dot"></span>
                          <span class="test-name">{{ test.caseName }}</span>
                          <span class="test-duration" *ngIf="test.steps.length">{{ getTotalDuration(test) }}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ng-template #noCases>
                <div class="empty-state">
                  <p class="tech-font">NO TEST CASES MATCHING FILTER</p>
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
    .report-layout { display: flex; height: 100vh; overflow: hidden; background: var(--bg-color); }
    .main-content { flex: 1; overflow-y: auto; padding: 4rem 2rem; transition: margin-right 0.4s var(--ease-standard); }
    .panel-open .main-content { margin-right: 500px; }
    .report-container { max-width: 1100px; margin: 0 auto; }
    
    .report-header { padding: 3rem; margin-bottom: 3rem; position: relative; overflow: hidden; }
    .report-header::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
    }
    
    .header-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; }
    .build-info h1 { font-size: 3rem; margin: 0; color: var(--text-primary); }
    .env-tag { color: var(--text-secondary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
    
    .status-badge { 
      padding: 0.6rem 1.2rem; border-radius: 100px; font-size: 0.7rem; font-weight: 800; 
      letter-spacing: 0.1em; border: 1px solid currentColor; background: rgba(255,255,255,0.03);
    }
    .status-badge.in_progress { color: var(--color-accent); box-shadow: 0 0 20px rgba(129, 140, 248, 0.2); }
    .status-badge.completed { color: var(--color-pass); box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
    
    .tabs { display: flex; gap: 3rem; border-bottom: 1px solid var(--border-color); }
    .tabs button { 
      background: none; border: none; color: var(--text-secondary); cursor: pointer; 
      padding: 1rem 0; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em;
      transition: all 0.3s var(--ease-standard); position: relative;
    }
    .tabs button::after {
      content: ''; position: absolute; bottom: -1px; left: 0; width: 0; height: 2px;
      background: var(--color-accent); transition: width 0.3s var(--ease-standard);
    }
    .tabs button.active { color: var(--text-primary); }
    .tabs button.active::after { width: 100%; }
    .tabs button:hover { color: var(--text-primary); }

    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; margin-bottom: 4rem; }
    .widget-wrapper { height: 100%; }
    
    .cdk-drag-preview {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      border-radius: 20px;
      opacity: 0.9;
    }
    .cdk-drag-placeholder { opacity: 0.05; }
    .cdk-drag-animating { transition: transform 250ms var(--ease-standard); }
    .dashboard-grid.cdk-drop-list-dragging .widget-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 250ms var(--ease-standard);
    }

    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .filter-bar button { 
      background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); color: var(--text-secondary);
      padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.6rem; font-weight: 800; cursor: pointer; transition: all 0.2s;
    }
    .filter-bar button:hover { border-color: var(--color-accent); color: var(--text-primary); }
    .filter-bar button.active { background: var(--color-accent); color: white; border-color: var(--color-accent); }

    .cases-layout { display: flex; flex-direction: column; }
    .suites-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .suite-group { display: flex; flex-direction: column; }
    .suite-header { 
      display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; 
      border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 0.5rem;
      font-size: 0.75rem; color: var(--text-secondary); letter-spacing: 0.05em;
    }
    .suite-icon { font-size: 0.9rem; opacity: 0.5; }
    .suite-name { font-weight: 700; flex: 1; color: var(--text-primary); }
    .suite-count { font-size: 0.65rem; background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 4px; }

    .suite-cases { display: flex; flex-direction: column; border-left: 1px solid rgba(255,255,255,0.05); margin-left: 0.45rem; }
    .test-item { 
      display: flex; align-items: center; gap: 1rem; padding: 0.6rem 1rem; cursor: pointer;
      transition: all 0.2s var(--ease-standard); border-radius: 0 8px 8px 0; border-left: 2px solid transparent;
      &:hover { background: rgba(255,255,255,0.02); border-left-color: rgba(255,255,255,0.1); }
      &.active { background: rgba(129, 140, 248, 0.08); border-left-color: var(--color-accent); }
    }
    
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; }
    .test-item.pass .status-dot { background: var(--color-pass); box-shadow: 0 0 8px var(--color-pass); }
    .test-item.fail .status-dot { background: var(--color-fail); box-shadow: 0 0 8px var(--color-fail); }
    
    .test-name { font-size: 0.85rem; flex: 1; color: var(--text-primary); }
    .test-duration { font-size: 0.65rem; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; opacity: 0.6; }

    .stats-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 4rem; }

    .side-panel { 
      position: fixed; top: 0; right: 0; bottom: 0; width: 500px; 
      background: #0f172a; border-left: 1px solid var(--border-color); 
      display: flex; flex-direction: column; z-index: 1000; 
      box-shadow: -20px 0 50px rgba(0,0,0,0.5);
      animation: slideIn 0.4s var(--ease-standard);
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    
    .panel-header { padding: 2.5rem; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); }
    .status-icon { font-size: 0.8rem; margin-right: 0.75rem; }
    .panel-tabs { display: flex; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1); }
    .panel-tabs button { 
      flex: 1; padding: 1.25rem; background: none; border: none; color: var(--text-secondary); 
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; transition: all 0.2s;
    }
    .panel-tabs button.active { color: var(--color-accent); background: rgba(255,255,255,0.02); }
    
    .panel-content { flex: 1; overflow-y: auto; padding: 2.5rem; }
    
    .steps-timeline { display: flex; flex-direction: column; }
    .step-item { display: flex; gap: 1.5rem; }
    .step-indicator { display: flex; flex-direction: column; align-items: center; width: 12px; }
    .step-indicator .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-secondary); margin-top: 8px; z-index: 1; }
    .step-indicator .line { flex: 1; width: 1px; background: #334155; margin: 4px 0; }
    .step-indicator.pass .dot { background: var(--color-pass); box-shadow: 0 0 12px var(--color-pass); }
    .step-indicator.fail .dot { background: var(--color-fail); box-shadow: 0 0 12px var(--color-fail); }
    
    .step-content { flex: 1; padding-bottom: 2rem; }
    .step-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .step-duration { font-size: 0.7rem; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
    .step-error { 
      font-size: 0.75rem; color: var(--color-fail); background: rgba(244, 63, 94, 0.1); 
      padding: 1rem; border-radius: 8px; margin-top: 0.75rem; border: 1px solid rgba(244, 63, 94, 0.2);
    }

    .error-block label, .stack-block label { 
      display: block; font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); 
      margin-bottom: 1rem; letter-spacing: 0.1em; 
    }
    .error-msg { font-size: 0.9rem; color: var(--color-fail); margin-bottom: 2.5rem; line-height: 1.6; }
    .stack-trace { 
      background: #020617; padding: 1.5rem; border-radius: 12px; font-size: 0.7rem; 
      line-height: 1.7; overflow-x: auto; border: 1px solid var(--border-color);
      color: #94a3b8; font-family: 'JetBrains Mono', monospace;
      scrollbar-width: thin; scrollbar-color: var(--border-color) transparent;
    }
    
    .close-btn { 
      background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-secondary); 
      width: 32px; height: 32px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
      &:hover { background: var(--color-fail); color: white; border-color: var(--color-fail); }
    }
    
    .anim-fade-in { animation: fadeIn 0.4s var(--ease-standard); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ReportComponent implements OnInit, OnDestroy {
  run = signal<TestRun | null>(null);
  historicalRuns = signal<TestRun[]>([]);
  inspectedTestCase = signal<TestCase | null>(null);
  testCaseHistory = signal<TestCaseHistory[]>([]);
  activeTab: 'summary' | 'cases' | 'history' = 'summary';
  activePanelTab: 'steps' | 'details' | 'retries' | 'history' = 'steps';
  statusFilter: 'ALL' | 'PASS' | 'FAIL' = 'ALL';
  layoutService = inject(DashboardLayoutService);
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

  onWidgetDrop(event: CdkDragDrop<WidgetType[]>) {
    const currentLayout = [...this.layoutService.layout()];
    moveItemInArray(currentLayout, event.previousIndex, event.currentIndex);
    this.layoutService.setLayout(currentLayout);
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

  getAllCases(): TestCase[] {
    const current = this.run();
    if (!current) return [];
    return current.batches.flatMap(b => b.testCases);
  }

  getFilteredCases(): TestCase[] {
    const all = this.getAllCases();
    if (this.statusFilter === 'ALL') return all;
    return all.filter(t => t.status === this.statusFilter);
  }

  getGroupedCases() {
    const filtered = this.getFilteredCases();
    const groups: { name: string, cases: TestCase[] }[] = [];
    
    filtered.forEach(tc => {
      let group = groups.find(g => g.name === tc.suiteName);
      if (!group) {
        group = { name: tc.suiteName, cases: [] };
        groups.push(group);
      }
      group.cases.push(tc);
    });
    
    return groups;
  }

  getTotalDuration(testCase: TestCase): number {
    return testCase.steps?.reduce((acc, step) => acc + step.durationMs, 0) || 0;
  }

  getFailures(): TestCase[] {
    return this.getAllCases().filter(t => t.status === 'FAIL');
  }

  sanitizeStack(stack: string): string {
    return stack;
  }
}

