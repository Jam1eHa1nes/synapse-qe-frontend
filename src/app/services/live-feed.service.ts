import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { LiveUpdate } from '../models/live-update.model';

@Injectable({
  providedIn: 'root'
})
export class LiveFeedService {
  private baseUrl = 'http://localhost:8080/api/v1/stream';

  constructor(private ngZone: NgZone) {}

  getLiveStream(): Observable<LiveUpdate> {
    return new Observable<LiveUpdate>(observer => {
      const eventSource = new EventSource(`${this.baseUrl}/live`);

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
}
