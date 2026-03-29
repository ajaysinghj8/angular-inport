import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InviewContainerDirective } from './inview-container.directive';
import { InviewItemDirective } from './inview-item.directive';

// ---- IntersectionObserver mock ----------------------------------------

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  static lastCallback: IOCallback;

  targets: Element[] = [];
  callback: IOCallback;

  constructor(callback: IOCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
    MockIntersectionObserver.lastCallback = callback;
  }

  observe(el: Element) { this.targets.push(el); }
  disconnect = jasmine.createSpy('disconnect');
  unobserve(el: Element) { this.targets = this.targets.filter(t => t !== el); }
}

function fireOn(observer: MockIntersectionObserver, entries: Partial<IntersectionObserverEntry>[]) {
  observer.callback(entries);
}

function inViewEntry(target: Element): Partial<IntersectionObserverEntry> {
  return {
    target,
    isIntersecting: true,
    boundingClientRect: { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 } as DOMRectReadOnly,
    rootBounds: { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 } as DOMRectReadOnly,
    intersectionRatio: 1,
  };
}

function outViewEntry(target: Element): Partial<IntersectionObserverEntry> {
  return {
    target,
    isIntersecting: false,
    boundingClientRect: { top: 900, left: 0, bottom: 1100, right: 200, height: 200, width: 200 } as DOMRectReadOnly,
    rootBounds: { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 } as DOMRectReadOnly,
    intersectionRatio: 0,
  };
}

// ---- Host components ---------------------------------------------------

@Component({
  template: `
    <div in-view-container [triggerOnInit]="true" (inview)="onInview($event)">
      <div in-view-item id="item1" [data]="'data1'"></div>
      <div in-view-item id="item2" [data]="'data2'"></div>
    </div>
  `,
  standalone: false,
})
class TestHostComponent {
  lastEvent: any;
  onInview(event: any) { this.lastEvent = event; }
}

@Component({
  template: `
    <div in-view-container [bestMatch]="true" [triggerOnInit]="true" (inview)="onInview($event)">
      <div in-view-item id="item1" [data]="'data1'"></div>
      <div in-view-item id="item2" [data]="'data2'"></div>
    </div>
  `,
  standalone: false,
})
class BestMatchHostComponent {
  lastEvent: any;
  onInview(event: any) { this.lastEvent = event; }
}

@Component({
  template: `<div in-view-container [triggerOnInit]="true" (inview)="onInview($event)"></div>`,
  standalone: false,
})
class EmptyContainerHostComponent {
  lastEvent: any;
  onInview(event: any) { this.lastEvent = event; }
}

// ---- Helpers -----------------------------------------------------------

async function setupModule(hostType: any): Promise<{
  fixture: ComponentFixture<any>;
  host: any;
  observer: MockIntersectionObserver;
  directive: InviewContainerDirective;
  itemEls: Element[];
}> {
  await TestBed.configureTestingModule({
    declarations: [hostType],
    imports: [InviewContainerDirective, InviewItemDirective],
  }).compileComponents();

  MockIntersectionObserver.instances = [];
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();

  const observer = MockIntersectionObserver.instances[0];
  const directive = fixture.debugElement
    .query(By.directive(InviewContainerDirective))
    .injector.get(InviewContainerDirective);
  const itemEls = observer?.targets ?? [];

  return { fixture, host: fixture.componentInstance, observer, directive, itemEls };
}

// ---- Tests ------------------------------------------------------------

describe('InviewContainerDirective', () => {
  beforeEach(() => {
    (window as any).IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    delete (window as any).IntersectionObserver;
    MockIntersectionObserver.instances = [];
  });

  describe('handleOnScroll - no bestMatch (all visible children)', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let observer: MockIntersectionObserver;
    let itemEls: Element[];

    beforeEach(async () => {
      ({ fixture, host, observer, itemEls } = await setupModule(TestHostComponent));
    });

    it('should emit an empty inview array when no children are intersecting', () => {
      fireOn(observer, itemEls.map(el => outViewEntry(el)));
      expect(host.lastEvent).toBeDefined();
      expect(host.lastEvent.inview).toEqual([]);
    });

    it('should emit all visible children with direction', () => {
      fireOn(observer, itemEls.map(el => inViewEntry(el)));
      expect(host.lastEvent.inview.length).toBe(2);
      expect(host.lastEvent.direction).toBeDefined();
    });

    it('should emit only children that are intersecting', () => {
      fireOn(observer, [
        inViewEntry(itemEls[0]),
        outViewEntry(itemEls[1]),
      ]);
      expect(host.lastEvent.inview.length).toBe(1);
      expect(host.lastEvent.inview[0].id).toBe('item1');
    });

    it('should include direction in emitted event', () => {
      fireOn(observer, itemEls.map(el => inViewEntry(el)));
      expect(['up', 'down']).toContain(host.lastEvent.direction);
    });

    it('should disconnect the observer on destroy without error', () => {
      const obs = MockIntersectionObserver.instances[0];
      expect(() => fixture.destroy()).not.toThrow();
      expect(obs.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleOnScroll - bestMatch', () => {
    let host: BestMatchHostComponent;
    let observer: MockIntersectionObserver;
    let itemEls: Element[];

    beforeEach(async () => {
      ({ host, observer, itemEls } = await setupModule(BestMatchHostComponent));
    });

    it('should emit empty object with direction when no children are intersecting', () => {
      fireOn(observer, itemEls.map(el => outViewEntry(el)));
      expect(host.lastEvent.inview).toBeUndefined();
      expect(host.lastEvent.direction).toBeDefined();
    });

    it('should emit only one result even when multiple children are intersecting', () => {
      fireOn(observer, itemEls.map(el => inViewEntry(el)));
      expect(Array.isArray(host.lastEvent.inview)).toBeFalse();
      expect(host.lastEvent.direction).toBeDefined();
    });
  });
});

describe('InviewContainerDirective - empty children', () => {
  beforeEach(() => {
    (window as any).IntersectionObserver = MockIntersectionObserver;
    MockIntersectionObserver.instances = [];
  });

  afterEach(() => {
    delete (window as any).IntersectionObserver;
    MockIntersectionObserver.instances = [];
  });

  it('should emit an empty inview array when container has no in-view-item children', async () => {
    const { host } = await setupModule(EmptyContainerHostComponent);
    // triggerOnInit fires _emitCurrentState() immediately with zero visible children
    expect(host.lastEvent).toBeDefined();
    expect(host.lastEvent.inview).toEqual([]);
  });
});
