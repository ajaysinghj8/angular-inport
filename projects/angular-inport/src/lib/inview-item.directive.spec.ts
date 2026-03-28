import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InviewItemDirective } from './inview-item.directive';
import { PositionResolver } from './utils/position-resolver';

@Component({
    template: `<div in-view-item [id]="itemId" [data]="itemData"></div>`,
    standalone: false
})
class TestHostComponent {
  itemId: any = 'test-id';
  itemData: any = { value: 42 };
}

describe('InviewItemDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: InviewItemDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent, InviewItemDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    directive = fixture.debugElement.query(By.directive(InviewItemDirective)).injector.get(InviewItemDirective);
  });

  describe('getData()', () => {
    it('should return the id and data set via inputs', () => {
      const result = directive.getData();
      expect(result.id).toBe('test-id');
      expect(result.data).toEqual({ value: 42 });
    });

    it('should reflect updated id and data after input changes', () => {
      fixture.componentInstance.itemId = 'new-id';
      fixture.componentInstance.itemData = 'new-data';
      fixture.detectChanges();
      const result = directive.getData();
      expect(result.id).toBe('new-id');
      expect(result.data).toBe('new-data');
    });

    it('should return undefined id and data when inputs are not set', () => {
      fixture.componentInstance.itemId = undefined;
      fixture.componentInstance.itemData = undefined;
      fixture.detectChanges();
      const result = directive.getData();
      expect(result.id).toBeUndefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('isVisible()', () => {
    it('should delegate to PositionResolver.isVisible', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(true);
      expect(directive.isVisible()).toBeTrue();
      expect(PositionResolver.isVisible).toHaveBeenCalled();
    });

    it('should return false when PositionResolver.isVisible returns false', () => {
      spyOn(PositionResolver, 'isVisible').and.returnValue(false);
      expect(directive.isVisible()).toBeFalse();
    });
  });

  describe('getELementRect()', () => {
    it('should delegate to PositionResolver.getBoundingClientRect', () => {
      const mockRect = { top: 10, left: 20, bottom: 110, right: 120, height: 100, width: 100 };
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(mockRect);
      expect(directive.getELementRect()).toEqual(mockRect);
      expect(PositionResolver.getBoundingClientRect).toHaveBeenCalled();
    });
  });
});
