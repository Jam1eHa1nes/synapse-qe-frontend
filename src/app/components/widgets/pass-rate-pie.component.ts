import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NgApexchartsModule, 
  ApexChart, 
  ApexLegend, 
  ApexPlotOptions, 
  ApexTooltip, 
  ApexStroke, 
  ApexDataLabels 
} from 'ng-apexcharts';
import { TestRun } from '../../models/test-case.model';

@Component({
  selector: 'app-pass-rate-pie',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="widget-card glass-card">
      <div class="widget-header">
        <span class="drag-handle">⠿</span>
        <h3 class="tech-font">STATUS DISTRIBUTION</h3>
      </div>
      <div class="chart-container">
        <apx-chart
          [series]="chartSeries()"
          [chart]="chartOptions.chart"
          [labels]="chartOptions.labels"
          [colors]="chartOptions.colors"
          [stroke]="chartOptions.stroke"
          [legend]="chartOptions.legend"
          [dataLabels]="chartOptions.dataLabels"
          [plotOptions]="chartOptions.plotOptions"
          [tooltip]="chartOptions.tooltip"
        ></apx-chart>
      </div>
    </div>
  `,
  styles: [`
    .widget-card { padding: 1.5rem; height: 100%; display: flex; flex-direction: column; }
    .widget-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .drag-handle { cursor: grab; color: var(--text-secondary); opacity: 0.5; font-size: 1.2rem; }
    .drag-handle:active { cursor: grabbing; }
    .chart-container { flex: 1; min-height: 250px; }
  `]
})
export class PassRatePieComponent {
  run = input<TestRun | null>(null);

  chartSeries = computed(() => {
    const r = this.run();
    if (!r) return [0, 0];
    return [r.totalPass, r.totalFail];
  });

  chartOptions: {
    chart: ApexChart;
    labels: string[];
    colors: string[];
    stroke: ApexStroke;
    legend: ApexLegend;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    tooltip: ApexTooltip;
  } = {
    chart: {
      type: 'donut',
      height: 280,
      animations: { enabled: true, speed: 800 }
    },
    labels: ['PASSED', 'FAILED'],
    colors: ['#10b981', '#f43f5e'],
    stroke: { show: false },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontFamily: 'JetBrains Mono',
      labels: { colors: '#94a3b8' }
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontFamily: 'Inter', fontWeight: 600, color: '#94a3b8' },
            value: { show: true, fontSize: '24px', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#f8fafc' },
            total: {
              show: true,
              label: 'TOTAL',
              color: '#94a3b8',
              formatter: (w: any) => {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    tooltip: { theme: 'dark' }
  };
}
