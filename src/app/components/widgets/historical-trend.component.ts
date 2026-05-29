import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NgApexchartsModule, 
  ApexChart, 
  ApexXAxis, 
  ApexYAxis, 
  ApexStroke, 
  ApexFill, 
  ApexDataLabels, 
  ApexTooltip, 
  ApexGrid, 
  ApexLegend 
} from 'ng-apexcharts';
import { TestRun } from '../../models/test-case.model';

@Component({
  selector: 'app-historical-trend',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="widget-card glass-card">
      <div class="widget-header">
        <span class="drag-handle">⠿</span>
        <h3 class="tech-font">HISTORICAL TREND</h3>
      </div>
      <div class="chart-container">
        <apx-chart
          [series]="chartData().series"
          [chart]="chartOptions.chart"
          [xaxis]="chartData().xaxis"
          [yaxis]="chartOptions.yaxis"
          [colors]="chartOptions.colors"
          [stroke]="chartOptions.stroke"
          [fill]="chartOptions.fill"
          [dataLabels]="chartOptions.dataLabels"
          [tooltip]="chartOptions.tooltip"
          [grid]="chartOptions.grid"
          [legend]="chartOptions.legend"
        ></apx-chart>
      </div>
    </div>
  `,
  styles: [`
    .widget-card { padding: 1.5rem; height: 100%; display: flex; flex-direction: column; }
    .widget-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .drag-handle { cursor: grab; color: var(--text-secondary); opacity: 0.5; font-size: 1.2rem; }
    .chart-container { flex: 1; min-height: 250px; }
  `]
})
export class HistoricalTrendComponent {
  history = input<TestRun[]>([]);

  chartData = computed(() => {
    const data = [...this.history()].reverse(); // Show oldest to newest
    return {
      series: [
        { name: 'PASSED', data: data.map(r => r.totalPass) },
        { name: 'FAILED', data: data.map(r => r.totalFail) }
      ],
      xaxis: {
        categories: data.map(r => r.buildNumber),
        labels: { style: { colors: '#94a3b8', fontFamily: 'JetBrains Mono' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      } as ApexXAxis
    };
  });

  chartOptions: {
    chart: ApexChart;
    colors: string[];
    stroke: ApexStroke;
    fill: ApexFill;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    yaxis: ApexYAxis;
    legend: ApexLegend;
    tooltip: ApexTooltip;
  } = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      foreColor: '#94a3b8'
    },
    colors: ['#10b981', '#f43f5e'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100]
      }
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#334155',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8', fontFamily: 'JetBrains Mono' } }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'JetBrains Mono',
      labels: { colors: '#94a3b8' }
    },
    tooltip: { theme: 'dark' }
  };
}
