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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { ScrollObservable } from './utils/scroll-observable';
import { OffsetResolver } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { InviewEvent } from './utils/events';
import { WindowRuler } from './utils/viewport-ruler';
import { debounce, map } from 'rxjs/operators';

@Directive({
	selector: '[in-view]',
	standalone: true,
})
export class InviewDirective implements AfterViewInit {
	private readonly _scrollObservable = inject(ScrollObservable);
	private readonly _element = inject(ElementRef);
	private readonly _zone = inject(NgZone);
	private readonly _windowRuler = inject(WindowRuler);
	private readonly _destroyRef = inject(DestroyRef);

	readonly offset = input<Array<number | string> | number | string>([0, 0, 0, 0]);
	readonly viewPortOffset = input<Array<number | string> | number | string>([0, 0, 0, 0]);
	readonly throttle = input(0);
	readonly scrollElement = input<HTMLElement | undefined>(undefined);
	readonly lazy = input(false);
	readonly tooLazy = input(false);
	readonly data = input<any>(undefined);
	readonly triggerOnInit = input(false);

	private readonly _normalizedOffset = computed(() =>
		OffsetResolver.create(this.offset()).normalizeOffset()
	);
	private readonly _normalizedViewPortOffset = computed(() =>
		OffsetResolver.create(this.viewPortOffset()).normalizeOffset()
	);

	private _previousState!: boolean;

	@Output() private inview: EventEmitter<InviewEvent> = new EventEmitter();

	ngAfterViewInit() {
		this._zone.runOutsideAngular(() => {
			this._scrollObservable
				.scrollObservableFor(this.scrollElement() || window)
				.pipe(
					debounce(() => timer(this.throttle())),
					map(() => this._getViewPortRuler()),
					takeUntilDestroyed(this._destroyRef),
				)
				.subscribe((containersBounds: ElementClientRect) => this.handleOnScroll(containersBounds));
		});
		if (this.triggerOnInit()) return this.handleOnScroll(this._getViewPortRuler());
	}

	private _getViewPortRuler() {
		const el = this.scrollElement();
		return el
			? PositionResolver.getBoundingClientRect(el)
			: this._windowRuler.getWindowViewPortRuler();
	}

	handleOnScroll(containersBounds: ElementClientRect) {
		const viewPortOffsetRect = PositionResolver.offsetRect(containersBounds, this._normalizedViewPortOffset());
		const elementOffsetRect = PositionResolver.offsetRect(
			PositionResolver.getBoundingClientRect(this._element.nativeElement),
			this._normalizedOffset(),
		);
		const isVisible =
			PositionResolver.isVisible(this._element.nativeElement) &&
			PositionResolver.intersectRect(elementOffsetRect, viewPortOffsetRect);

		if (this.tooLazy() && this._previousState !== undefined && this._previousState === isVisible) {
			return;
		}

		if (!this.lazy() && !isVisible) {
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

		if (!isVisible) {
			this._previousState = isVisible;
			return;
		}

		const { isClipped, isOutsideView } = PositionResolver.clippedStatus(elementOffsetRect, viewPortOffsetRect);
		const output: InviewEvent = {
			status: true,
			isClipped,
			isOutsideView,
			parts: PositionResolver.inViewParts(viewPortOffsetRect, elementOffsetRect),
			inViewPercentage: PositionResolver.inViewPercentage(viewPortOffsetRect, elementOffsetRect),
		};
		if (this.data() !== undefined) output.data = this.data();
		this._zone.run(() => this.inview.emit(output));
		this._previousState = isVisible;
	}
}
