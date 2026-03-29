import {
	Directive,
	Output,
	EventEmitter,
	ElementRef,
	NgZone,
	AfterViewInit,
	DestroyRef,
	inject,
	input,
	computed,
	PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OffsetResolver } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { InviewEvent } from './utils/events';

@Directive({
	selector: '[in-view]',
	standalone: true,
})
export class InviewDirective implements AfterViewInit {
	private readonly _element = inject(ElementRef);
	private readonly _zone = inject(NgZone);
	private readonly _destroyRef = inject(DestroyRef);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	readonly offset = input<Array<number | string> | number | string>([0, 0, 0, 0]);
	readonly viewPortOffset = input<Array<number | string> | number | string>([0, 0, 0, 0]);
	/** @deprecated No-op with IntersectionObserver — fires only on actual visibility changes. */
	readonly throttle = input(0);
	readonly scrollElement = input<HTMLElement | undefined>(undefined);
	readonly lazy = input(false);
	readonly tooLazy = input(false);
	readonly data = input<unknown>(undefined);
	readonly triggerOnInit = input(false);

	private readonly _rootMargin = computed(() => {
		const off = OffsetResolver.create(this.offset()).normalizeOffset();
		const vp = OffsetResolver.create(this.viewPortOffset()).normalizeOffset();
		// Combine: positive offset expands element → equivalent rootMargin; same for viewPortOffset.
		const combined = off.map((v, i) => {
			const a = typeof v === 'string' ? parseFloat(v) : v;
			const b = typeof vp[i] === 'string' ? parseFloat(vp[i] as string) : vp[i] as number;
			const pct = (typeof v === 'string' && v.endsWith('%')) || (typeof vp[i] === 'string' && (vp[i] as string).endsWith('%'));
			return pct ? `${a + b}%` : `${a + b}px`;
		});
		return combined.join(' ');
	});

	private _previousState!: boolean;
	private _initialized = false;

	@Output() private inview: EventEmitter<InviewEvent> = new EventEmitter();

	ngAfterViewInit() {
		if (!this._isBrowser) return;

		const observer = new IntersectionObserver(
			(entries) => this._onIntersection(entries[0]),
			{
				root: this.scrollElement() ?? null,
				rootMargin: this._rootMargin(),
				threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
			},
		);

		observer.observe(this._element.nativeElement);
		this._destroyRef.onDestroy(() => observer.disconnect());
	}

	private _onIntersection(entry: IntersectionObserverEntry) {
		// IO always fires once on initial observe — suppress unless triggerOnInit=true
		if (!this._initialized) {
			this._initialized = true;
			if (!this.triggerOnInit()) return;
		}

		const isVisible = entry.isIntersecting;

		if (this.tooLazy() && this._previousState !== undefined && this._previousState === isVisible) {
			return;
		}

		if (!isVisible) {
			if (!this.lazy()) {
				const output: InviewEvent = {
					status: false,
					isClipped: false,
					isOutsideView: true,
					parts: { top: false, right: false, left: false, bottom: false },
					inViewPercentage: { vertical: 0, horizontal: 0 },
				};
				if (this.data() !== undefined) output.data = this.data();
				this._zone.run(() => this.inview.emit(output));
			}
			this._previousState = false;
			return;
		}

		const elementRect = entry.boundingClientRect as unknown as ElementClientRect;
		const rootRect = (entry.rootBounds ?? entry.boundingClientRect) as unknown as ElementClientRect;
		const { isClipped, isOutsideView } = PositionResolver.clippedStatus(elementRect, rootRect);
		const output: InviewEvent = {
			status: true,
			isClipped,
			isOutsideView,
			parts: PositionResolver.inViewParts(rootRect, elementRect),
			inViewPercentage: PositionResolver.inViewPercentage(rootRect, elementRect),
		};
		if (this.data() !== undefined) output.data = this.data();
		this._zone.run(() => this.inview.emit(output));
		this._previousState = true;
	}
}
