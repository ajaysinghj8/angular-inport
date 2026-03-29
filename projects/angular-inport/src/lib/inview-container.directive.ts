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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { map, tap, debounce } from 'rxjs/operators';

import { InviewItemDirective } from './inview-item.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
import { OffsetResolver } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { InviewContainerEvent, InviewBestMatchEvent } from './utils/events';

type IChildWithReact = [InviewItemDirective, ElementClientRect, number];

@Directive({
	selector: '[in-view-container]',
	standalone: true,
})
export class InviewContainerDirective implements AfterViewInit {
	private readonly _element = inject(ElementRef);
	private readonly _scrollObservable = inject(ScrollObservable);
	private readonly _windowRuler = inject(WindowRuler);
	private readonly _zone = inject(NgZone);
	private readonly _destroyRef = inject(DestroyRef);

	readonly offset = input<Array<number | string> | number | string>([0, 0, 0, 0]);
	readonly viewPortOffset = input<Array<number> | number | string>([0, 0, 0, 0]);
	readonly throttle = input(0);
	readonly scrollWindow = input(true);
	readonly data = input<any>(undefined);
	readonly bestMatch = input(false);
	readonly triggerOnInit = input(false);

	private readonly _normalizedOffset = computed(() =>
		OffsetResolver.create(this.offset()).normalizeOffset()
	);
	private readonly _normalizedViewPortOffset = computed(() =>
		OffsetResolver.create(this.viewPortOffset()).normalizeOffset()
	);

	private _lastScrollY = 0;
	private _scrollDirection = 'down';

	@Output() inview: EventEmitter<InviewContainerEvent | InviewBestMatchEvent> = new EventEmitter();
	@ContentChildren(InviewItemDirective, { descendants: true, emitDistinctChangesOnly: false })
	private _inviewChildren!: QueryList<InviewItemDirective>;

	ngAfterViewInit() {
		this._scrollObservable
			.scrollObservableFor(this.scrollWindow() ? window : this._element.nativeElement)
			.pipe(
				debounce(() => timer(this.throttle())),
				map(() => this._getViewPortRuler()),
				tap(() => this._checkScrollDirection()),
				takeUntilDestroyed(this._destroyRef),
			)
			.subscribe((containersBounds: ElementClientRect) => this.handleOnScroll(containersBounds));
		if (this.triggerOnInit()) return this.handleOnScroll(this._getViewPortRuler());
	}

	private _checkScrollDirection() {
		if (this.scrollWindow()) {
			this._scrollDirection = window.scrollY > this._lastScrollY ? 'down' : 'up';
			this._lastScrollY = window.scrollY;
		} else {
			this._scrollDirection = this._element.nativeElement.scrollTop > this._lastScrollY ? 'down' : 'up';
			this._lastScrollY = this._element.nativeElement.scrollTop;
		}
	}

	private _getViewPortRuler() {
		return this.scrollWindow()
			? this._windowRuler.getWindowViewPortRuler()
			: PositionResolver.getBoundingClientRect(this._element.nativeElement);
	}

	handleOnScroll(containersBounds: ElementClientRect) {
		if (!this._inviewChildren || this._inviewChildren.length === 0) return;

		const viewPortOffsetRect = PositionResolver.offsetRect(containersBounds, this._normalizedViewPortOffset());
		const visibleChildren: Array<IChildWithReact> = this._inviewChildren
			.toArray()
			.map((child: InviewItemDirective): IChildWithReact => {
				const elementRect = PositionResolver.offsetRect(child.getELementRect(), this._normalizedOffset());
				return [child, elementRect, PositionResolver.distance(viewPortOffsetRect, elementRect)];
			})
			.filter(([child, rect]) => child.isVisible() && PositionResolver.intersectRect(rect, viewPortOffsetRect));

		if (!this.bestMatch()) {
			const event: InviewContainerEvent = {
				inview: visibleChildren.map(([child]) => child.getData()),
				direction: this._scrollDirection as 'up' | 'down',
			};
			this._zone.run(() => this.inview.emit(event));
			return;
		}

		const bestMatch = visibleChildren.sort(([, , distanceA], [, , distanceB]) => {
			if (distanceA > distanceB) return 1;
			else if (distanceA < distanceB) return -1;
			return 0;
		})[0];
		const itemData = bestMatch ? bestMatch[0].getData() : { id: undefined, data: undefined };
		const event: InviewBestMatchEvent = { ...itemData, direction: this._scrollDirection as 'up' | 'down' };
		this._zone.run(() => this.inview.emit(event));
	}
}
