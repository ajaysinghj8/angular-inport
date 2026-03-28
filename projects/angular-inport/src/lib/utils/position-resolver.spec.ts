import { PositionResolver } from './position-resolver';
import { ElementClientRect } from './models';

function rect(top: number, left: number, bottom: number, right: number): ElementClientRect {
  return { top, left, bottom, right, height: bottom - top, width: right - left };
}

describe('PositionResolver', () => {
  describe('intersectRect', () => {
    const viewport = rect(0, 0, 768, 1024);

    it('should return true for overlapping rects', () => {
      expect(PositionResolver.intersectRect(viewport, rect(100, 100, 400, 400))).toBeTrue();
    });

    it('should return true for a rect fully inside the viewport', () => {
      expect(PositionResolver.intersectRect(viewport, rect(10, 10, 200, 200))).toBeTrue();
    });

    it('should return false when rect is above viewport', () => {
      expect(PositionResolver.intersectRect(viewport, rect(-200, 0, -10, 200))).toBeFalse();
    });

    it('should return false when rect is below viewport', () => {
      expect(PositionResolver.intersectRect(viewport, rect(800, 0, 1000, 200))).toBeFalse();
    });

    it('should return false when rect is to the left of viewport', () => {
      expect(PositionResolver.intersectRect(viewport, rect(0, -300, 200, -10))).toBeFalse();
    });

    it('should return false when rect is to the right of viewport', () => {
      expect(PositionResolver.intersectRect(viewport, rect(0, 1100, 200, 1300))).toBeFalse();
    });

    it('should return true for partially overlapping rect', () => {
      expect(PositionResolver.intersectRect(viewport, rect(700, 900, 900, 1100))).toBeTrue();
    });
  });

  describe('offsetRect', () => {
    const base = rect(100, 50, 300, 250);

    it('should return the original rect when no offset provided', () => {
      const result = PositionResolver.offsetRect(base, null as any);
      expect(result).toBe(base);
    });

    it('should apply zero offsets and return the same values', () => {
      const result = PositionResolver.offsetRect(base, [0, 0, 0, 0]);
      expect(result.top).toBe(100);
      expect(result.left).toBe(50);
      expect(result.bottom).toBe(300);
      expect(result.right).toBe(250);
    });

    it('should shrink the rect with positive pixel offsets', () => {
      const result = PositionResolver.offsetRect(base, [10, 20, 10, 20]);
      expect(result.top).toBe(90);    // top - offset
      expect(result.left).toBe(30);   // left - offset
      expect(result.bottom).toBe(310); // bottom + offset
      expect(result.right).toBe(270); // right + offset
    });

    it('should apply percentage offsets relative to rect dimensions', () => {
      // base height = 200, width = 200
      const result = PositionResolver.offsetRect(base, ['10%', '10%', '10%', '10%']);
      expect(result.top).toBe(100 - 20);   // 10% of 200
      expect(result.bottom).toBe(300 + 20);
      expect(result.left).toBe(50 - 20);   // 10% of 200
      expect(result.right).toBe(250 + 20);
    });

    it('should update height and width based on offsets', () => {
      const result = PositionResolver.offsetRect(base, [10, 10, 10, 10]);
      expect(result.height).toBe(200 + 10 + 10); // original + top offset + bottom offset
      expect(result.width).toBe(200 + 10 + 10);
    });
  });

  describe('distance', () => {
    it('should return 0 when element center matches container center', () => {
      const container = rect(0, 0, 200, 200); // center: x=100, y=100
      const element = rect(50, 50, 150, 150); // center: x=100, y=100
      expect(PositionResolver.distance(container, element)).toBe(0);
    });

    it('should return positive distance for offset centers', () => {
      const container = rect(0, 0, 100, 100);
      const element = rect(0, 0, 50, 50);
      const d = PositionResolver.distance(container, element);
      expect(d).toBeGreaterThan(0);
    });
  });

  describe('isElementOutsideView', () => {
    const viewport = rect(0, 0, 768, 1024);

    it('should return false for element inside viewport', () => {
      expect(PositionResolver.isElementOutsideView(rect(100, 100, 400, 400), viewport)).toBeFalse();
    });

    it('should return true when element is above viewport', () => {
      expect(PositionResolver.isElementOutsideView(rect(-100, 0, -10, 100), viewport)).toBeTrue();
    });

    it('should return true when element is below viewport', () => {
      expect(PositionResolver.isElementOutsideView(rect(800, 0, 900, 100), viewport)).toBeTrue();
    });

    it('should return true when element is to the left of viewport', () => {
      expect(PositionResolver.isElementOutsideView(rect(0, -200, 100, -10), viewport)).toBeTrue();
    });

    it('should return true when element is to the right of viewport', () => {
      expect(PositionResolver.isElementOutsideView(rect(0, 1100, 100, 1300), viewport)).toBeTrue();
    });
  });

  describe('isElementClipped', () => {
    const viewport = rect(0, 0, 768, 1024);

    it('should return false for element fully inside viewport', () => {
      expect(PositionResolver.isElementClipped(rect(10, 10, 400, 400), viewport)).toBeFalse();
    });

    it('should return true when element is clipped above', () => {
      expect(PositionResolver.isElementClipped(rect(-10, 10, 100, 200), viewport)).toBeTrue();
    });

    it('should return true when element is clipped below', () => {
      expect(PositionResolver.isElementClipped(rect(600, 10, 800, 200), viewport)).toBeTrue();
    });

    it('should return true when element is clipped on the left', () => {
      expect(PositionResolver.isElementClipped(rect(10, -10, 200, 100), viewport)).toBeTrue();
    });

    it('should return true when element is clipped on the right', () => {
      expect(PositionResolver.isElementClipped(rect(10, 900, 200, 1100), viewport)).toBeTrue();
    });
  });

  describe('clippedStatus', () => {
    const viewport = rect(0, 0, 768, 1024);

    it('should return isClipped=false, isOutsideView=false for fully visible element', () => {
      const result = PositionResolver.clippedStatus(rect(10, 10, 400, 400), viewport);
      expect(result.isClipped).toBeFalse();
      expect(result.isOutsideView).toBeFalse();
    });

    it('should return isClipped=true for partially clipped element', () => {
      const result = PositionResolver.clippedStatus(rect(-10, 10, 100, 200), viewport);
      expect(result.isClipped).toBeTrue();
    });

    it('should return isOutsideView=true for completely outside element', () => {
      const result = PositionResolver.clippedStatus(rect(-200, 0, -10, 200), viewport);
      expect(result.isOutsideView).toBeTrue();
    });
  });

  describe('inViewPercentage', () => {
    const container = rect(0, 0, 200, 200);

    it('should return 100% for element fully inside container', () => {
      const result = PositionResolver.inViewPercentage(container, rect(0, 0, 200, 200));
      expect(result.vertical).toBe(100);
      expect(result.horizontal).toBe(100);
    });

    it('should return less than 100% for partially visible element', () => {
      // element extends below container
      const result = PositionResolver.inViewPercentage(container, rect(100, 0, 400, 200));
      expect(result.vertical).toBeLessThan(100);
    });
  });

  describe('inViewParts', () => {
    const container = rect(0, 0, 768, 1024);

    it('should return all true for element fully inside container', () => {
      const result = PositionResolver.inViewParts(container, rect(10, 10, 400, 400));
      expect(result.top).toBeTrue();
      expect(result.left).toBeTrue();
      expect(result.bottom).toBeTrue();
      expect(result.right).toBeTrue();
    });

    it('should return top=false for element clipped above', () => {
      const result = PositionResolver.inViewParts(container, rect(-10, 10, 200, 200));
      expect(result.top).toBeFalse();
    });

    it('should return bottom=false for element clipped below', () => {
      const result = PositionResolver.inViewParts(container, rect(10, 10, 800, 200));
      expect(result.bottom).toBeFalse();
    });
  });
});
