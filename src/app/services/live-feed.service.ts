import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LiveUpdate } from '../models/live-update.model';
import { TestRun } from '../models/test-case.model';

export interface TestCaseHistory {
  buildNumber: string;
  environment: string;
  status: 'PASS' | 'FAIL';
}

@Injectable({
  providedIn: 'root'
})
export class LiveFeedService {
  private baseApiUrl = environment.apiUrl;

  constructor(private ngZone: NgZone, private http: HttpClient) {}

  getLiveStream(): Observable<LiveUpdate> {
    return new Observable<LiveUpdate>(observer => {
      const eventSource = new EventSource(`${this.baseApiUrl}/stream/live`);

      eventSource.onmessage = event => {
        this.ngZone.run(() => {
          const update: LiveUpdate = JSON.parse(event.data);
          observer.next(update);
        });
      };

      eventSource.onerror = error => {
        this.ngZone.run(() => {
          observer.error(error);
        });
      };

      return () => eventSource.close();
    });
  }

  getActiveReports(): Observable<TestRun[]> {
    return this.http.get<TestRun[]>(`${this.baseApiUrl}/reports/active`);
  }

  getHistoricalReports(environment?: string): Observable<TestRun[]> {
    let url = `${this.baseApiUrl}/reports/history`;
    if (environment) {
      url += `?environment=${environment}`;
    }
    return this.http.get<TestRun[]>(url);
  }

  getReportDetails(buildNumber: string): Observable<TestRun> {
    return this.http.get<TestRun>(`${this.baseApiUrl}/reports/${buildNumber}`);
  }

  getTestCaseHistory(suiteName: string, caseName: string, environment: string): Observable<TestCaseHistory[]> {
    return this.http.get<TestCaseHistory[]>(
      `${this.baseApiUrl}/reports/testcase-history?suiteName=${suiteName}&caseName=${caseName}&environment=${environment}`
    );
  }
}
