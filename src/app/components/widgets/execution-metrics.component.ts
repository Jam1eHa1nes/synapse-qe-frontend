import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestRun } from '../../models/test-case.model';

@Component({
  selector: 'app-execution-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card glass-card">
      <div class="widget-header">
        <span class="drag-handle">⠿</span>
        <h3 class="tech-font">EXECUTION METRICS</h3>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="label">TOTAL DURATION</span>
          <span class="value">{{ totalDuration() }}s</span>
        </div>
        <div class="metric-item">
          <span class="label">AVG BATCH TIME</span>
          <span class="value">{{ avgBatchTime() }}s</span>
        </div>
        <div class="metric-item">
          <span class="label">PARALLEL BATCHES</span>
          <span class="value">{{ run()?.batches?.length || 0 }}</span>
        </div>
        <div class="metric-item">
          <span class="label">SUCCESS RATE</span>
          <span class="value" [class.pass]="successRate() > 90" [class.fail]="successRate() < 50">
            {{ successRate() }}%
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .widget-card { padding: 1.5rem; height: 100%; display: flex; flex-direction: column; }
    .widget-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .drag-handle { cursor: grab; color: var(--text-secondary); opacity: 0.5; font-size: 1.2rem; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; flex: 1; }
    .metric-item { display: flex; flex-direction: column; gap: 0.5rem; justify-content: center; }
    .label { font-size: 0.6rem; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.1em; }
    .value { font-size: 1.75rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    .value.pass { color: var(--color-pass); }
    .value.fail { color: var(--color-fail); }
  `]
})
export class ExecutionMetricsComponent {
  run = input<TestRun | null>(null);

  totalDuration = computed(() => {
    const r = this.run();
    if (!r) return '0.00';
    const totalMs = r.batches.reduce((acc, b) => acc + b.durationMs, 0);
    return (totalMs / 1000).toFixed(2);
  });

  avgBatchTime = computed(() => {
    const r = this.run();
    if (!r || r.batches.length === 0) return '0.00';
    const totalMs = r.batches.reduce((acc, b) => acc + b.durationMs, 0);
    return (totalMs / (r.batches.length * 1000)).toFixed(2);
  });

  successRate = computed(() => {
    const r = this.run();
    if (!r) return 0;
    const total = r.totalPass + r.totalFail;
    if (total === 0) return 0;
    return Math.round((r.totalPass / total) * 100);
  });
}
