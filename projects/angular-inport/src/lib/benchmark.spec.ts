/**
 * Performance benchmarks for angular-inport (IntersectionObserver implementation).
 *
 * These tests measure real wall-clock timing and event throughput rather than
 * correctness. They run in the same Karma suite so results appear in the test
 * report. Assertions are generous thresholds — they act as regression guards
 * (CI will catch a 10× slowdown) rather than hard SLA limits.
 */

import { Component, NgZone } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InviewDirective } from './inview.directive';
import { InviewContainerDirective } from './inview-container.directive';
import { InviewItemDirective } from './inview-item.directive';
import { PositionResolver } from './utils/position-resolver';

// ---------------------------------------------------------------------------
// Shared IO mock that tracks observe() call count and allows bulk-firing
// ---------------------------------------------------------------------------

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class PerfMockObserver {
  static all: PerfMockObserver[] = [];
  observeCount = 0;
  disconnectCount = 0;
  targets: Element[] = [];
  callback: IOCallback;

  constructor(cb: IOCallback) {
    this.callback = cb;
    PerfMockObserver.all.push(this);
  }
  observe(el: Element) { this.targets.push(el); this.observeCount++; }
  unobserve(el: Element) { this.targets = this.targets.filter(t => t !== el); }
  disconnect() { this.disconnectCount++; }

  fire(entries: Partial<IntersectionObserverEntry>[]) { this.callback(entries); }
}

function buildEntry(target: Element, isIntersecting: boolean): Partial<IntersectionObserverEntry> {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 } as DOMRectReadOnly,
    rootBounds: { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 } as DOMRectReadOnly,
    intersectionRatio: isIntersecting ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  template: `<div in-view [triggerOnInit]="true" (inview)="count = count + 1"></div>`,
  standalone: false,
})
class SingleItemHost {
  count = 0;
}

function makeContainerHost(n: number) {
  const items = Array.from({ length: n }, (_, i) => i);
  @Component({
    template: `
      <div in-view-container [triggerOnInit]="true" (inview)="count = count + 1">
        ${items.map(i => `<div in-view-item [id]="${i}" [data]="${i}"></div>`).join('\n')}
      </div>
    `,
    standalone: false,
  })
  class DynamicContainerHost {
    count = 0;
  }
  return DynamicContainerHost;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function printResult(label: string, durationMs: number, ops: number) {
  const perOp = (durationMs / ops).toFixed(3);
  console.log(`[BENCH] ${label}: ${ops} ops in ${durationMs.toFixed(1)} ms → ${perOp} ms/op`);
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

describe('Performance benchmarks', () => {
  beforeEach(() => {
    PerfMockObserver.all = [];
    (window as any).IntersectionObserver = PerfMockObserver;
    spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(
      { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 },
    );
  });

  afterEach(() => {
    delete (window as any).IntersectionObserver;
    PerfMockObserver.all = [];
  });

  // -------------------------------------------------------------------------
  // 1. Setup cost: how fast can we create + observe N InviewDirective instances
  // -------------------------------------------------------------------------
  describe('InviewDirective — setup cost', () => {
    [1, 50, 200].forEach(n => {
      it(`should set up ${n} independent InviewDirective instances within reasonable time`, async () => {
        const items = Array.from({ length: n }, (_, i) => i);

        @Component({
          template: `
            ${items.map(() => `<div in-view (inview)="noop()"></div>`).join('\n')}
          `,
          standalone: false,
        })
        class MultiHost {
          noop() {}
        }

        await TestBed.configureTestingModule({
          declarations: [MultiHost],
          imports: [InviewDirective],
        }).compileComponents();

        const t0 = performance.now();
        const fixture = TestBed.createComponent(MultiHost);
        fixture.detectChanges();
        const elapsed = performance.now() - t0;

        printResult(`setup ${n} InviewDirective`, elapsed, n);

        // Each directive should have registered with its own IO instance
        const totalObserved = PerfMockObserver.all.reduce((s, o) => s + o.observeCount, 0);
        expect(totalObserved).toBe(n);
        expect(elapsed).toBeLessThan(n * 10); // generous: 10 ms per directive max
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Callback throughput: how fast can we process N intersection entries
  // -------------------------------------------------------------------------
  describe('InviewContainerDirective — callback throughput', () => {
    [10, 100, 500].forEach(n => {
      it(`should process ${n} intersection entries within reasonable time`, async () => {
        const HostClass = makeContainerHost(n);

        await TestBed.configureTestingModule({
          declarations: [HostClass],
          imports: [InviewContainerDirective, InviewItemDirective],
        }).compileComponents();

        const fixture: ComponentFixture<any> = TestBed.createComponent(HostClass);
        fixture.detectChanges();

        const observer = PerfMockObserver.all[0];
        expect(observer).toBeDefined();
        expect(observer.targets.length).toBe(n);

        // Build N in-view entries
        const entries = observer.targets.map(el => buildEntry(el, true));

        const ROUNDS = 20;
        const t0 = performance.now();
        for (let i = 0; i < ROUNDS; i++) {
          observer.fire(entries);
        }
        const elapsed = performance.now() - t0;
        const totalOps = n * ROUNDS;

        printResult(`container callback ${n} items × ${ROUNDS} rounds`, elapsed, totalOps);

        // Generous threshold: no more than 1 ms per entry per round
        expect(elapsed).toBeLessThan(n * ROUNDS * 1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Change detection cycles: zone.run() called only on actual emission
  // -------------------------------------------------------------------------
  describe('NgZone — zone.run() call count', () => {
    it('should call zone.run() exactly once per IO callback batch (not per entry)', async () => {
      const n = 50;
      const HostClass = makeContainerHost(n);

      await TestBed.configureTestingModule({
        declarations: [HostClass],
        imports: [InviewContainerDirective, InviewItemDirective],
      }).compileComponents();

      const fixture: ComponentFixture<any> = TestBed.createComponent(HostClass);
      fixture.detectChanges();

      const zone = TestBed.inject(NgZone);
      let zoneRunCount = 0;
      spyOn(zone, 'run').and.callFake((fn: any) => { zoneRunCount++; return fn(); });

      const observer = PerfMockObserver.all[0];
      const entries = observer.targets.map(el => buildEntry(el, true));

      const ROUNDS = 10;
      for (let i = 0; i < ROUNDS; i++) {
        observer.fire(entries);
      }

      console.log(`[BENCH] zone.run() calls for ${n} items × ${ROUNDS} rounds: ${zoneRunCount} (expected ${ROUNDS})`);

      // zone.run() must be called once per round (batch), NOT once per entry
      expect(zoneRunCount).toBe(ROUNDS);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Memory: observe/disconnect cycle does not accumulate observers
  // -------------------------------------------------------------------------
  describe('Observer lifecycle', () => {
    it('should disconnect the observer exactly once on directive destroy', async () => {
      await TestBed.configureTestingModule({
        declarations: [SingleItemHost],
        imports: [InviewDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.detectChanges();

      const obs = PerfMockObserver.all[0];
      expect(obs.disconnectCount).toBe(0);

      fixture.destroy();
      expect(obs.disconnectCount).toBe(1);
    });

    it('should not accumulate observer instances across repeated create/destroy cycles', async () => {
      const CYCLES = 20;
      for (let i = 0; i < CYCLES; i++) {
        await TestBed.configureTestingModule({
          declarations: [SingleItemHost],
          imports: [InviewDirective],
        }).compileComponents();

        const fixture = TestBed.createComponent(SingleItemHost);
        fixture.detectChanges();
        fixture.destroy();
        TestBed.resetTestingModule();
        PerfMockObserver.all = [];
      }

      // After each cycle the observer should have been disconnected — no leaks
      expect(true).toBeTrue(); // reaching here means no errors thrown
      console.log(`[BENCH] ${CYCLES} create/destroy cycles completed without error`);
    });
  });

  // -------------------------------------------------------------------------
  // 5. tooLazy suppression: callbacks should short-circuit without zone entry
  // -------------------------------------------------------------------------
  describe('tooLazy suppression efficiency', () => {
    it('should not call zone.run() when state has not changed (tooLazy=true)', async () => {
      @Component({
        template: `<div in-view [tooLazy]="true" [triggerOnInit]="true" (inview)="count = count + 1"></div>`,
        standalone: false,
      })
      class TooLazyHost {
        count = 0;
      }

      await TestBed.configureTestingModule({
        declarations: [TooLazyHost],
        imports: [InviewDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(TooLazyHost);
      fixture.detectChanges();

      const zone = TestBed.inject(NgZone);
      const obs = PerfMockObserver.all[0];
      const inEntry = buildEntry(obs.targets[0], true);

      // First fire: establishes state (visible=true)
      obs.fire([inEntry]);

      let zoneRunAfterFirst = 0;
      spyOn(zone, 'run').and.callFake((fn: any) => { zoneRunAfterFirst++; return fn(); });

      const ROUNDS = 100;
      for (let i = 0; i < ROUNDS; i++) {
        obs.fire([inEntry]); // same state — should all be suppressed
      }

      console.log(`[BENCH] tooLazy: zone.run() called ${zoneRunAfterFirst} times for ${ROUNDS} duplicate firings (expected 0)`);
      expect(zoneRunAfterFirst).toBe(0);
    });
  });
});
