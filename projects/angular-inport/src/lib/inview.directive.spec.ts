import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InviewDirective } from './inview.directive';

// ---- IntersectionObserver mock ----------------------------------------

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class MockIntersectionObserver {
  static instance: MockIntersectionObserver;
  static callback: IOCallback;

  constructor(callback: IOCallback) {
    MockIntersectionObserver.instance = this;
    MockIntersectionObserver.callback = callback;
  }
  observe = jasmine.createSpy('observe');
  disconnect = jasmine.createSpy('disconnect');
}

function fire(entries: Partial<IntersectionObserverEntry>[]) {
  MockIntersectionObserver.callback(entries);
}

const IN_VIEW_ENTRY: Partial<IntersectionObserverEntry> = {
  isIntersecting: true,
  boundingClientRect: { top: 100, left: 100, bottom: 300, right: 300, height: 200, width: 200 } as DOMRectReadOnly,
  rootBounds: { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 } as DOMRectReadOnly,
  intersectionRatio: 1,
};

const OUT_OF_VIEW_ENTRY: Partial<IntersectionObserverEntry> = {
  isIntersecting: false,
  boundingClientRect: { top: 900, left: 0, bottom: 1100, right: 200, height: 200, width: 200 } as DOMRectReadOnly,
  rootBounds: { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 } as DOMRectReadOnly,
  intersectionRatio: 0,
};

// ---- Host components ---------------------------------------------------

@Component({
  template: `<div in-view [triggerOnInit]="true" (inview)="onInview($event)"></div>`,
  standalone: false,
})
class DefaultHostComponent {
  lastEvent: any;
  onInview(e: any) { this.lastEvent = e; }
}

@Component({
  template: `<div in-view [lazy]="true" [triggerOnInit]="true" (inview)="onInview($event)"></div>`,
  standalone: false,
})
class LazyHostComponent {
  lastEvent: any;
  onInview(e: any) { this.lastEvent = e; }
}

@Component({
  template: `<div in-view [tooLazy]="true" [triggerOnInit]="true" (inview)="onInview($event)"></div>`,
  standalone: false,
})
class TooLazyHostComponent {
  lastEvent: any;
  onInview(e: any) { this.lastEvent = e; }
}

@Component({
  template: `<div in-view [data]="payload" [triggerOnInit]="true" (inview)="onInview($event)"></div>`,
  standalone: false,
})
class DataHostComponent {
  payload: any = { id: 1 };
  lastEvent: any;
  onInview(e: any) { this.lastEvent = e; }
}

@Component({
  template: `<div in-view (inview)="onInview($event)"></div>`,
  standalone: false,
})
class NoTriggerHostComponent {
  lastEvent: any;
  onInview(e: any) { this.lastEvent = e; }
}

// ---- Helper -----------------------------------------------------------

async function createFixture<T>(hostType: any): Promise<{ fixture: ComponentFixture<T>; host: T }> {
  await TestBed.configureTestingModule({
    declarations: [hostType],
    imports: [InviewDirective],
  }).compileComponents();

  const fixture = TestBed.createComponent(hostType) as ComponentFixture<T>;
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance };
}

// ---- Tests ------------------------------------------------------------

describe('InviewDirective', () => {
  beforeEach(() => {
    (window as any).IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    delete (window as any).IntersectionObserver;
  });

  describe('visible element', () => {
    let host: DefaultHostComponent;

    beforeEach(async () => {
      ({ host } = await createFixture<DefaultHostComponent>(DefaultHostComponent));
    });

    it('should emit with status=true when element is in view', () => {
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent.status).toBeTrue();
    });

    it('should include isClipped and isOutsideView in the event', () => {
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent.isClipped).toBeDefined();
      expect(host.lastEvent.isOutsideView).toBeDefined();
    });

    it('should include parts in the event', () => {
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent.parts).toBeDefined();
    });

    it('should include inViewPercentage in the event', () => {
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent.inViewPercentage).toBeDefined();
    });

    it('should not include data in event when data input is not set', () => {
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent.data).toBeUndefined();
    });
  });

  describe('element out of view - lazy=false (default)', () => {
    let host: DefaultHostComponent;

    beforeEach(async () => {
      ({ host } = await createFixture<DefaultHostComponent>(DefaultHostComponent));
    });

    it('should emit with status=false when element is not intersecting', () => {
      fire([OUT_OF_VIEW_ENTRY]);
      expect(host.lastEvent.status).toBeFalse();
    });

    it('should include isOutsideView=true in the event', () => {
      fire([OUT_OF_VIEW_ENTRY]);
      expect(host.lastEvent.isOutsideView).toBeTrue();
    });

    it('should include inViewPercentage of 0 for vertical and horizontal', () => {
      fire([OUT_OF_VIEW_ENTRY]);
      expect(host.lastEvent.inViewPercentage).toEqual({ vertical: 0, horizontal: 0 });
    });
  });

  describe('element out of view - lazy=true', () => {
    let host: LazyHostComponent;

    beforeEach(async () => {
      ({ host } = await createFixture<LazyHostComponent>(LazyHostComponent));
    });

    it('should NOT emit when element is not visible and lazy=true', () => {
      fire([OUT_OF_VIEW_ENTRY]);
      expect(host.lastEvent).toBeUndefined();
    });
  });

  describe('tooLazy - suppresses duplicate state', () => {
    let host: TooLazyHostComponent;

    beforeEach(async () => {
      ({ host } = await createFixture<TooLazyHostComponent>(TooLazyHostComponent));
    });

    it('should emit on the first scroll event', () => {
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent).toBeDefined();
    });

    it('should not re-emit if state has not changed (visible → visible)', () => {
      fire([IN_VIEW_ENTRY]);
      host.lastEvent = undefined;
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent).toBeUndefined();
    });

    it('should re-emit when state changes from visible to not visible', () => {
      fire([IN_VIEW_ENTRY]);
      host.lastEvent = undefined;
      fire([OUT_OF_VIEW_ENTRY]);
      expect(host.lastEvent).toBeDefined();
    });
  });

  describe('data input', () => {
    it('should include data in the event when data input is set', async () => {
      const { host } = await createFixture<DataHostComponent>(DataHostComponent);
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent.data).toEqual({ id: 1 });
    });
  });

  describe('triggerOnInit=false (default)', () => {
    it('should NOT emit on initial observation when triggerOnInit is false', async () => {
      const { host } = await createFixture<NoTriggerHostComponent>(NoTriggerHostComponent);
      // The initial IO callback is suppressed when triggerOnInit=false
      fire([IN_VIEW_ENTRY]);
      expect(host.lastEvent).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should disconnect observer on destroy without error', async () => {
      const { fixture } = await createFixture<DefaultHostComponent>(DefaultHostComponent);
      expect(() => fixture.destroy()).not.toThrow();
      expect(MockIntersectionObserver.instance.disconnect).toHaveBeenCalled();
    });
  });
});
