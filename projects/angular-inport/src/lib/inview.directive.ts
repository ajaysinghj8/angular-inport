import {
	Directive,
	Input,
	Output,
	OnDestroy,
	EventEmitter,
	ElementRef,
	NgZone,
	AfterViewInit,
} from '@angular/core';
import { Subscription, timer, of as _of } from 'rxjs';
import { ScrollObservable } from './utils/scroll-observable';
import { OffsetResolver } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { WindowRuler } from './utils/viewport-ruler';
import { debounce, map } from 'rxjs/operators';

@Directive({
	selector: '[in-view]',
	standalone: false,
})
export class InviewDirective implements OnDestroy, AfterViewInit {
	private _offset: Array<number | string> = [0, 0, 0, 0];
	private _viewPortOffset: Array<number | string> = [0, 0, 0, 0];
	private _throttle: number = 0;
	private _scrollElement!: HTMLElement;
	private _lazy: boolean = false;
	private _tooLazy: boolean = false;
	private _previousState!: boolean;
	private _data: any;
	private _triggerOnInit: boolean = false;

	@Input()
	set triggerOnInit(triggerOnInit: boolean) {
		this._triggerOnInit = !!triggerOnInit;
	}
	@Input()
	set offset(offset: Array<number | string> | number | string) {
		this._offset = OffsetResolver.create(offset).normalizeOffset();
	}
	@Input()
	set viewPortOffset(offset: Array<number | string> | number | string) {
		this._viewPortOffset = OffsetResolver.create(offset).normalizeOffset();
	}
	@Input()
	set throttle(throttle: number) {
		this._throttle = throttle;
	}
	@Input()
	set scrollELement(sw: HTMLElement) {
		this._scrollElement = sw;
	}
	@Input()
	set lazy(lzy: boolean) {
		this._lazy = lzy;
	}
	@Input()
	set tooLazy(lzy: boolean) {
		this._tooLazy = lzy;
	}
	@Input()
	set data(_d: any) {
		this._data = _d;
	}

	@Output() private inview: EventEmitter<any> = new EventEmitter();
	private _scrollerSubscription!: Subscription;

	constructor(
		private _scrollObservable: ScrollObservable,
		private _element: ElementRef,
		private _zone: NgZone,
		private _windowRuler: WindowRuler,
	) {}

	ngAfterViewInit() {
		this._scrollerSubscription = this._scrollObservable
			.scrollObservableFor(this._scrollElement || window)
			.pipe(
				debounce(() => timer(this._throttle)),
				map(() => this._getViewPortRuler()),
			)
			.subscribe((containersBounds: ElementClientRect) => this.handleOnScroll(containersBounds));
		if (this._triggerOnInit) return this.handleOnScroll(this._getViewPortRuler());
	}

	private _getViewPortRuler() {
		return this._scrollElement
			? PositionResolver.getBoundingClientRect(this._scrollElement)
			: this._windowRuler.getWindowViewPortRuler();
	}

	ngOnDestroy() {
		if (this._scrollerSubscription) {
			this._scrollerSubscription.unsubscribe();
		}
	}

	handleOnScroll(containersBounds: ElementClientRect) {
		const viewPortOffsetRect = PositionResolver.offsetRect(containersBounds, this._viewPortOffset);
		const elementOffsetRect = PositionResolver.offsetRect(
			PositionResolver.getBoundingClientRect(this._element.nativeElement),
			this._offset,
		);
		const isVisible =
			PositionResolver.isVisible(this._element.nativeElement) &&
			PositionResolver.intersectRect(elementOffsetRect, viewPortOffsetRect);

		if (this._tooLazy && this._previousState !== undefined && this._previousState === isVisible) {
			return;
		}

		const output: any = { status: isVisible };

		if (this._data !== undefined) {
			output.data = this._data;
		}

		if (!this._lazy && !isVisible) {
			output.isClipped = false;
			output.isOutsideView = true;
			output.parts = { top: false, right: false, left: false, bottom: false };
			output.inViewPercentage = { vertical: 0, horizontal: 0 };
			this._zone.run(() => this.inview.emit(output));
		}

		if (!isVisible) {
			this._previousState = isVisible;
			return;
		}

		const { isClipped, isOutsideView } = PositionResolver.clippedStatus(elementOffsetRect, viewPortOffsetRect);
		output.isClipped = isClipped;
		output.isOutsideView = isOutsideView;
		output.parts = PositionResolver.inViewParts(viewPortOffsetRect, elementOffsetRect);
		output.inViewPercentage = PositionResolver.inViewPercentage(viewPortOffsetRect, elementOffsetRect);
		this._zone.run(() => this.inview.emit(output));
		this._previousState = isVisible;
	}
}
