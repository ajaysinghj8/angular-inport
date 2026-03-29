export class OffsetResolver {
	constructor(private offset: Array<number | string> | number | string) {}

	normalizeOffset(): Array<number | string> {
		if (!Array.isArray(this.offset)) {
			return [this.offset, this.offset, this.offset, this.offset];
		}
		if (this.offset.length === 2) {
			return this.offset.concat(this.offset);
		} else if (this.offset.length === 3) {
			return this.offset.concat([this.offset[1]]);
		}
		return this.offset;
	}

	/** Convert normalized offset to a CSS rootMargin string for IntersectionObserver. */
	toRootMargin(): string {
		return this.normalizeOffset()
			.map(v => (typeof v === 'string' && v.endsWith('%') ? v : `${v}px`))
			.join(' ');
	}

	static create(offset: Array<number | string> | number | string) {
		return new OffsetResolver(offset);
	}
}
