import { Component, NgZone } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EMPTY } from 'rxjs';
import { InviewContainerDirective } from './inview-container.directive';
import { InviewItemDirective } from './inview-item.directive';
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

@Component({
  template: `
    <div in-view-container [bestMatch]="bestMatch" (inview)="onInview($event)">
      <div in-view-item id="item1" [data]="'data1'"></div>
      <div in-view-item id="item2" [data]="'data2'"></div>
    </div>
  `,
})
class TestHostComponent {
  bestMatch = false;
  lastEvent: any;
  onInview(event: any) {
    this.lastEvent = event;
  }
}

@Component({
  template: `<div in-view-container (inview)="onInview($event)"></div>`,
})
class EmptyContainerHostComponent {
  lastEvent: any;
  onInview(event: any) {
    this.lastEvent = event;
  }
}

describe('InviewContainerDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: InviewContainerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent, InviewContainerDirective, InviewItemDirective],
      providers: [
        { provide: ScrollObservable, useClass: MockScrollObservable },
        { provide: WindowRuler, useClass: MockWindowRuler },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = fixture.debugElement.query(By.directive(InviewContainerDirective)).injector.get(InviewContainerDirective);
  });

  describe('handleOnScroll - no bestMatch (all visible children)', () => {
    it('should emit an empty inview array when no children are visible', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(false);
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeDefined();
      expect(host.lastEvent.inview).toEqual([]);
    });

    it('should emit all visible children with direction', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(
        { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 }
      );
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeDefined();
      expect(host.lastEvent.inview.length).toBe(2);
      expect(host.lastEvent.direction).toBeDefined();
    });

    it('should emit only the children that are visible and intersect viewport', () => {
      spyOn(PositionResolver, 'isVisible').and.callFake((el: HTMLElement) => {
        return el.getAttribute('id') === 'item1';
      });
      spyOn(PositionResolver, 'getBoundingClientRect').and.callFake((el: HTMLElement) => {
        if (el.getAttribute('id') === 'item1') {
          return { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 };
        }
        // item2 outside viewport
        return { top: 900, left: 0, bottom: 1100, right: 200, height: 200, width: 200 };
      });
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.inview.length).toBe(1);
      expect(host.lastEvent.inview[0].id).toBe('item1');
    });

    it('should emit an empty inview array when no children intersect viewport', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(
        { top: 900, left: 0, bottom: 1100, right: 200, height: 200, width: 200 }
      );
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.inview.length).toBe(0);
    });

    it('should include direction in emitted event', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(
        { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 }
      );
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent.direction).toEqual(jasmine.any(String));
    });
  });

  describe('handleOnScroll - bestMatch', () => {
    beforeEach(() => {
      host.bestMatch = true;
      fixture.detectChanges();
    });

    it('should emit empty object with direction when no children are visible', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(false);
      directive.handleOnScroll(VIEWPORT);
      expect(host.lastEvent).toBeDefined();
      expect(host.lastEvent.id).toBeUndefined();
      expect(host.lastEvent.direction).toBeDefined();
    });

    it('should emit the single closest child when both children are visible', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      let callCount = 0;
      spyOn(PositionResolver, 'getBoundingClientRect').and.callFake(() => {
        callCount++;
        // First child is closer to viewport center (384, 512) than the second
        if (callCount % 2 === 1) {
          return { top: 300, left: 400, bottom: 500, right: 600, height: 200, width: 200 }; // center ~(400,500)
        }
        return { top: 600, left: 800, bottom: 750, right: 1000, height: 150, width: 200 }; // center ~(675,900)
      });
      directive.handleOnScroll(VIEWPORT);
      // should emit a single item (not an array)
      expect(host.lastEvent.inview).toBeUndefined();
      expect(host.lastEvent.id).toBeDefined();
    });

    it('should emit only one result even when multiple children are visible', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(
        { top: 100, left: 0, bottom: 300, right: 200, height: 200, width: 200 }
      );
      directive.handleOnScroll(VIEWPORT);
      // bestMatch emits a single data object, not an array
      expect(Array.isArray(host.lastEvent.inview)).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe on destroy', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});

describe('InviewContainerDirective - empty children', () => {
  it('should not emit when container has no in-view-item children', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [EmptyContainerHostComponent, InviewContainerDirective, InviewItemDirective],
      providers: [
        { provide: ScrollObservable, useClass: MockScrollObservable },
        { provide: WindowRuler, useClass: MockWindowRuler },
      ],
    }).compileComponents();

    const f = TestBed.createComponent(EmptyContainerHostComponent);
    f.detectChanges();
    const dir = f.debugElement.query(By.directive(InviewContainerDirective)).injector.get(InviewContainerDirective);
    dir.handleOnScroll(VIEWPORT);
    expect(f.componentInstance.lastEvent).toBeUndefined();
  });
});
