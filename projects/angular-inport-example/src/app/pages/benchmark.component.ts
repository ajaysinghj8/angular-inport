import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

interface BenchResult {
  label: string;
  items: number;
  events: number;
  cdCycles: number;
  durationMs: number;
  eventsPerSec: number;
}

@Component({
  selector: 'benchmark-comp',
  templateUrl: './benchmark.component.html',
  styleUrls: ['./benchmark.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BenchmarkComponent {
  itemCounts = [10, 50, 100, 500, 1000];
  selectedCount = 100;
  items: number[] = [];
  results: BenchResult[] = [];
  running = false;
  eventCount = 0;
  cdCycles = 0;
  scrollContainer?: HTMLElement;

  constructor(private _zone: NgZone, private _cdr: ChangeDetectorRef) {}

  get opsPerSec(): number {
    const last = this.results[this.results.length - 1];
    return last ? last.eventsPerSec : 0;
  }

  onInview(_event: any) {
    this.eventCount++;
  }

  ngDoCheck() {
    this.cdCycles++;
  }

  setupItems(count: number) {
    this.items = Array.from({ length: count }, (_, i) => i);
    this.eventCount = 0;
    this.cdCycles = 0;
    this._cdr.markForCheck();
  }

  async runBenchmark() {
    this.running = true;
    this.results = [];
    this._cdr.markForCheck();

    for (const count of this.itemCounts) {
      this.setupItems(count);
      // Let Angular render the items
      await this._wait(100);

      this.eventCount = 0;
      this.cdCycles = 0;

      const container = document.getElementById('bench-scroll-container');
      if (!container) continue;

      const t0 = performance.now();
      const SCROLL_STEPS = 20;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const step = maxScroll / SCROLL_STEPS;

      // Scroll down then back up
      for (let i = 0; i <= SCROLL_STEPS; i++) {
        container.scrollTop = i * step;
        await this._wait(16); // ~1 frame
      }
      for (let i = SCROLL_STEPS; i >= 0; i--) {
        container.scrollTop = i * step;
        await this._wait(16);
      }

      const elapsed = performance.now() - t0;
      const eventsPerSec = Math.round((this.eventCount / elapsed) * 1000);

      this.results.push({
        label: `${count} items`,
        items: count,
        events: this.eventCount,
        cdCycles: this.cdCycles,
        durationMs: Math.round(elapsed),
        eventsPerSec,
      });
    }

    this.running = false;
    this._cdr.markForCheck();
  }

  private _wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
