import {
	Directive,
	ContentChildren,
	QueryList,
	AfterViewInit,
	Output,
	EventEmitter,
	ElementRef,
	NgZone,
	DestroyRef,
	inject,
	input,
	computed,
	PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InviewItemDirective } from './inview-item.directive';
import { OffsetResolver } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { InviewContainerEvent, InviewBestMatchEvent, InviewItemData } from './utils/events';

@Directive({
	selector: '[in-view-container]',
	standalone: true,
})
export class InviewContainerDirective implements AfterViewInit {
	private readonly _element = inject(ElementRef);
	private readonly _zone = inject(NgZone);
	private readonly _destroyRef = inject(DestroyRef);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	readonly offset = input<Array<number | string> | number | string>([0, 0, 0, 0]);
	readonly viewPortOffset = input<Array<number> | number | string>([0, 0, 0, 0]);
	/** @deprecated No-op with IntersectionObserver — fires only on actual visibility changes. */
	readonly throttle = input(0);
	readonly scrollWindow = input(true);
	readonly data = input<unknown>(undefined);
	readonly bestMatch = input(false);
	readonly triggerOnInit = input(false);

	private readonly _rootMargin = computed(() => {
		const off = OffsetResolver.create(this.offset()).normalizeOffset();
		const vp = OffsetResolver.create(this.viewPortOffset()).normalizeOffset();
		const combined = off.map((v, i) => {
			const a = typeof v === 'string' ? parseFloat(v) : v;
			const b = typeof vp[i] === 'string' ? parseFloat(vp[i] as string) : vp[i] as number;
			const pct = (typeof v === 'string' && v.endsWith('%')) || (typeof vp[i] === 'string' && (vp[i] as string).endsWith('%'));
			return pct ? `${a + b}%` : `${a + b}px`;
		});
		return combined.join(' ');
	});

	private _lastScrollY = 0;
	private _scrollDirection: 'up' | 'down' = 'down';
	private _observer?: IntersectionObserver;
	private _visibleChildren = new Map<Element, InviewItemDirective>();
	private _initialized = false;

	@Output() inview: EventEmitter<InviewContainerEvent | InviewBestMatchEvent> = new EventEmitter();
	@ContentChildren(InviewItemDirective, { descendants: true, emitDistinctChangesOnly: false })
	private _inviewChildren!: QueryList<InviewItemDirective>;

	ngAfterViewInit() {
		if (!this._isBrowser) return;

		this._createObserver();

		// Re-sync when projected children change
		this._inviewChildren.changes
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe(() => this._syncObservedChildren());

		this._destroyRef.onDestroy(() => this._observer?.disconnect());

		if (this.triggerOnInit()) this._emitCurrentState();
	}

	private _createObserver() {
		this._observer = new IntersectionObserver(
			(entries) => this._onIntersection(entries),
			{
				root: this.scrollWindow() ? null : this._element.nativeElement,
				rootMargin: this._rootMargin(),
			},
		);
		this._inviewChildren.forEach(child =>
			this._observer!.observe(child._element.nativeElement),
		);
	}

	private _syncObservedChildren() {
		this._observer?.disconnect();
		this._visibleChildren.clear();
		this._inviewChildren.forEach(child =>
			this._observer!.observe(child._element.nativeElement),
		);
	}

	private _updateScrollDirection() {
		const y = window.scrollY ?? 0;
		this._scrollDirection = y >= this._lastScrollY ? 'down' : 'up';
		this._lastScrollY = y;
	}

	private _onIntersection(entries: IntersectionObserverEntry[]) {
		// Suppress initial fire (one per observed element) unless triggerOnInit
		if (!this._initialized) {
			this._initialized = true;
			if (!this.triggerOnInit()) return;
		}

		this._updateScrollDirection();

		for (const entry of entries) {
			const child = this._inviewChildren.find(
				c => c._element.nativeElement === entry.target,
			);
			if (!child) continue;
			if (entry.isIntersecting) {
				this._visibleChildren.set(entry.target, child);
			} else {
				this._visibleChildren.delete(entry.target);
			}
		}

		this._emitCurrentState();
	}

	private _emitCurrentState() {
		const visible = Array.from(this._visibleChildren.values());

		if (!this.bestMatch()) {
			const event: InviewContainerEvent = {
				inview: visible.map(c => c.getData()),
				direction: this._scrollDirection,
			};
			this._zone.run(() => this.inview.emit(event));
			return;
		}

		// bestMatch: pick the child closest to the centre of the root rect
		const rootRect = this.scrollWindow()
			? { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth, height: window.innerHeight, width: window.innerWidth } as ElementClientRect
			: PositionResolver.getBoundingClientRect(this._element.nativeElement);

		const withDistance = visible.map(child => {
			const rect = PositionResolver.getBoundingClientRect(child._element.nativeElement) as ElementClientRect;
			return { child, distance: PositionResolver.distance(rootRect, rect) };
		});

		withDistance.sort((a, b) => a.distance - b.distance);
		const best = withDistance[0];
		const itemData: InviewItemData = best ? best.child.getData() : { id: undefined, data: undefined };
		const event: InviewBestMatchEvent = { ...itemData, direction: this._scrollDirection };
		this._zone.run(() => this.inview.emit(event));
	}
}
