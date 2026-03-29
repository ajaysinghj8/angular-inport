import { Component, NgZone, ChangeDetectorRef, OnDestroy, ApplicationRef } from '@angular/core';
import { Subscription } from 'rxjs';

interface BenchResult {
  label: string;
  items: number;
  events: number;
  cdCycles: number;
  durationMs: number;
  eventsPerSec: number;
  cdPerEvent: string;
}

@Component({
  selector: 'benchmark-comp',
  templateUrl: './benchmark.component.html',
  styleUrls: ['./benchmark.component.css'],
  standalone: false,
})
export class BenchmarkComponent implements OnDestroy {
  itemCounts = [10, 50, 100, 500];
  selectedCount = 50;
  items: number[] = [];
  results: BenchResult[] = [];
  running = false;
  eventCount = 0;
  cdCycles = 0;

  private _cdSub?: Subscription;

  constructor(
    private _zone: NgZone,
    private _cdr: ChangeDetectorRef,
    private _appRef: ApplicationRef,
  ) {
    // Count every completed CD tick via zone onStable
    this._cdSub = this._zone.onMicrotaskEmpty.subscribe(() => {
      this.cdCycles++;
    });
  }

  ngOnDestroy() {
    this._cdSub?.unsubscribe();
  }

  onInview(_event: any) {
    this.eventCount++;
  }

  setupItems(count: number) {
    this.selectedCount = count;
    this.items = Array.from({ length: count }, (_, i) => i);
    this.eventCount = 0;
    this.cdCycles = 0;
  }

  async runBenchmark() {
    this.running = true;
    this.results = [];

    for (const count of this.itemCounts) {
      this.setupItems(count);

      // Let Angular render the new items and IO observe them
      await this._wait(300);

      this.eventCount = 0;
      this.cdCycles = 0;

      // The scrollable element is the one with in-view-container on it
      const container = document.getElementById('bench-scroll-area');
      if (!container) continue;

      const t0 = performance.now();
      const SCROLL_STEPS = 30;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (maxScroll <= 0) {
        // Not enough items to scroll — skip
        this.results.push({
          label: `${count} items`,
          items: count,
          events: 0,
          cdCycles: 0,
          durationMs: 0,
          eventsPerSec: 0,
          cdPerEvent: '—',
        });
        continue;
      }

      const step = maxScroll / SCROLL_STEPS;

      // Scroll down
      for (let i = 1; i <= SCROLL_STEPS; i++) {
        container.scrollTop = i * step;
        await this._wait(50); // IO fires async — give it time per step
      }
      // Scroll back up
      for (let i = SCROLL_STEPS - 1; i >= 0; i--) {
        container.scrollTop = i * step;
        await this._wait(50);
      }

      // Final settle
      await this._wait(200);

      const elapsed = performance.now() - t0;
      const eventsPerSec = elapsed > 0 ? Math.round((this.eventCount / elapsed) * 1000) : 0;
      const cdPerEvent = this.eventCount > 0
        ? (this.cdCycles / this.eventCount).toFixed(1)
        : '—';

      this.results.push({
        label: `${count} items`,
        items: count,
        events: this.eventCount,
        cdCycles: this.cdCycles,
        durationMs: Math.round(elapsed),
        eventsPerSec,
        cdPerEvent,
      });
    }

    this.running = false;
  }

  private _wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
