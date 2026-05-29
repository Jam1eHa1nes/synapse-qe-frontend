import { Injectable, signal } from '@angular/core';

export type WidgetType = 'pie' | 'trend' | 'metrics';

@Injectable({
  providedIn: 'root'
})
export class DashboardLayoutService {
  private readonly STORAGE_KEY = 'synapse-qe-summary-layout';
  private readonly DEFAULT_LAYOUT: WidgetType[] = ['pie', 'trend', 'metrics'];

  layout = signal<WidgetType[]>(this.loadLayout());

  setLayout(newLayout: WidgetType[]) {
    this.layout.set(newLayout);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newLayout));
  }

  private loadLayout(): WidgetType[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved layout', e);
      }
    }
    return [...this.DEFAULT_LAYOUT];
  }
}
