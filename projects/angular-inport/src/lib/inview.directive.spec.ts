import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EMPTY } from 'rxjs';
import { InviewDirective } from './inview.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';

class MockScrollObservable {
  scrollObservableFor() {
    return EMPTY;
  }
}

class MockWindowRuler {
  getWindowViewPortRuler(): ElementClientRect {
    return { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 };
  }
}

const VIEWPORT: ElementClientRect = { top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 };
const IN_VIEW_RECT: ElementClientRect = { top: 100, left: 100, bottom: 300, right: 300, height: 200, width: 200 };
const OUT_OF_VIEW_RECT: ElementClientRect = { top: 900, left: 0, bottom: 1100, right: 200, height: 200, width: 200 };

@Component({
    template: `
    <div in-view
         [lazy]="lazy"
         [tooLazy]="tooLazy"
         [data]="data"
         (inview)="onInview($event)">
    </div>
  `,
    standalone: false
})
class TestHostComponent {
  lazy = false;
  tooLazy = false;
  data: any = undefined;
  lastEvent: any;
  onInview(event: any) {
    this.lastEvent = event;
  }
}

describe('InviewDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: InviewDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent, InviewDirective],
      providers: [
        { provide: ScrollObservable, useClass: MockScrollObservable },
        { provide: WindowRuler, useClass: MockWindowRuler },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = fixture.debugElement.query(By.directive(InviewDirective)).injector.get(InviewDirective);
  });

  describe('visible element', () => {
    beforeEach(() => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(IN_VIEW_RECT);
    });

    it('should emit with status=true when element is in view', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeDefined();
      expect(host.lastEvent.status).toBeTrue();
    });

    it('should include isClipped and isOutsideView in the event', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.isClipped).toBeDefined();
      expect(host.lastEvent.isOutsideView).toBeDefined();
    });

    it('should include parts in the event', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.parts).toBeDefined();
    });

    it('should include inViewPercentage in the event', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.inViewPercentage).toBeDefined();
    });

    it('should include data in the event when data input is set', () => {
      host.data = { id: 1 };
      fixture.detectChanges();
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.data).toEqual({ id: 1 });
    });

    it('should not include data in event when data input is not set', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.data).toBeUndefined();
    });
  });

  describe('element out of view - lazy=false (default)', () => {
    beforeEach(() => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(OUT_OF_VIEW_RECT);
    });

    it('should emit with status=false when element is not intersecting viewport', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.status).toBeFalse();
    });

    it('should include isOutsideView=true in the event', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.isOutsideView).toBeTrue();
    });

    it('should include inViewPercentage of 0 for vertical and horizontal', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.inViewPercentage).toEqual({ vertical: 0, horizontal: 0 });
    });
  });

  describe('element out of view - lazy=true', () => {
    beforeEach(() => {
      host.lazy = true;
      fixture.detectChanges();
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(OUT_OF_VIEW_RECT);
    });

    it('should NOT emit when element is not visible and lazy=true', () => {
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeUndefined();
    });
  });

  describe('tooLazy - suppresses duplicate state', () => {
    beforeEach(() => {
      host.tooLazy = true;
      fixture.detectChanges();
    });

    it('should emit on the first scroll event', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(IN_VIEW_RECT);
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeDefined();
    });

    it('should not re-emit if state has not changed (visible → visible)', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(IN_VIEW_RECT);
      directive.handleOnScroll(VIEWPORT);
      host.lastEvent = undefined;
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeUndefined();
    });

    it('should re-emit when state changes from visible to not visible', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      const getBCR = spyOn(PositionResolver, 'getBoundingClientRect');
      getBCR.and.returnValue(IN_VIEW_RECT);
      directive.handleOnScroll(VIEWPORT);         // visible

      host.lastEvent = undefined;
      getBCR.and.returnValue(OUT_OF_VIEW_RECT);
      directive.handleOnScroll(VIEWPORT);         // now out of view
      expect(host.lastEvent).toBeDefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe on destroy without error', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
