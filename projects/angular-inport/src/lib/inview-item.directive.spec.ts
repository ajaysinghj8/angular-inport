import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InviewItemDirective } from './inview-item.directive';
import { PositionResolver } from './utils/position-resolver';

@Component({
  template: `<div in-view-item [id]="itemId" [data]="itemData"></div>`,
  standalone: false,
})
class TestHostComponent {
  itemId: any = 'test-id';
  itemData: any = { value: 42 };
}

@Component({
  template: `<div in-view-item id="static-id" [data]="'static-data'"></div>`,
  standalone: false,
})
class StaticInputHostComponent {}

@Component({
  template: `<div in-view-item></div>`,
  standalone: false,
})
class NoInputHostComponent {}

describe('InviewItemDirective', () => {
  describe('getData()', () => {
    it('should return the id and data set via inputs', async () => {
      await TestBed.configureTestingModule({
        declarations: [TestHostComponent],
        imports: [InviewItemDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      const directive = fixture.debugElement.query(By.directive(InviewItemDirective)).injector.get(InviewItemDirective);

      const result = directive.getData();
      expect(result.id).toBe('test-id');
      expect(result.data).toEqual({ value: 42 });
    });

    it('should return undefined id and data when inputs are not set', async () => {
      await TestBed.configureTestingModule({
        declarations: [NoInputHostComponent],
        imports: [InviewItemDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(NoInputHostComponent);
      fixture.detectChanges();
      const directive = fixture.debugElement.query(By.directive(InviewItemDirective)).injector.get(InviewItemDirective);

      const result = directive.getData();
      expect(result.id).toBeUndefined();
      expect(result.data).toBeUndefined();
    });

    it('should return static id and data bound directly in template', async () => {
      await TestBed.configureTestingModule({
        declarations: [StaticInputHostComponent],
        imports: [InviewItemDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(StaticInputHostComponent);
      fixture.detectChanges();
      const directive = fixture.debugElement.query(By.directive(InviewItemDirective)).injector.get(InviewItemDirective);

      const result = directive.getData();
      expect(result.id).toBe('static-id');
      expect(result.data).toBe('static-data');
    });
  });

  describe('isVisible()', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let directive: InviewItemDirective;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [TestHostComponent],
        imports: [InviewItemDirective],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      directive = fixture.debugElement.query(By.directive(InviewItemDirective)).injector.get(InviewItemDirective);
    });

    it('should delegate to PositionResolver.isVisible and return true', () => {
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
    it('should delegate to PositionResolver.getBoundingClientRect', async () => {
      await TestBed.configureTestingModule({
        declarations: [TestHostComponent],
        imports: [InviewItemDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      const directive = fixture.debugElement.query(By.directive(InviewItemDirective)).injector.get(InviewItemDirective);

      const mockRect = { top: 10, left: 20, bottom: 110, right: 120, height: 100, width: 100 };
      spyOn(PositionResolver, 'getBoundingClientRect').and.returnValue(mockRect);
      expect(directive.getELementRect()).toEqual(mockRect);
      expect(PositionResolver.getBoundingClientRect).toHaveBeenCalled();
    });
  });
});
