import { OffsetResolver } from './offset-resolver';

describe('OffsetResolver', () => {
  describe('normalizeOffset', () => {
    it('should expand a scalar number to [n, n, n, n]', () => {
      expect(new OffsetResolver(10).normalizeOffset()).toEqual([10, 10, 10, 10]);
    });

    it('should expand a scalar string to [s, s, s, s]', () => {
      expect(new OffsetResolver('5%').normalizeOffset()).toEqual(['5%', '5%', '5%', '5%']);
    });

    it('should expand a 2-element array [a, b] to [a, b, a, b]', () => {
      expect(new OffsetResolver([10, 20]).normalizeOffset()).toEqual([10, 20, 10, 20]);
    });

    it('should expand a 3-element array [a, b, c] to [a, b, c, b]', () => {
      expect(new OffsetResolver([10, 20, 30]).normalizeOffset()).toEqual([10, 20, 30, 20]);
    });

    it('should return a 4-element array as-is', () => {
      expect(new OffsetResolver([10, 20, 30, 40]).normalizeOffset()).toEqual([10, 20, 30, 40]);
    });

    it('should return array with more than 4 elements as-is', () => {
      const offset = [1, 2, 3, 4, 5] as any;
      expect(new OffsetResolver(offset).normalizeOffset()).toEqual([1, 2, 3, 4, 5]);
    });
  });
});

describe('OffsetResolver.create', () => {
  it('should create an OffsetResolver instance via static create()', () => {
    const resolver = OffsetResolver.create(10);
    expect(resolver).toBeInstanceOf(OffsetResolver);
    expect(resolver.normalizeOffset()).toEqual([10, 10, 10, 10]);
  });
});
