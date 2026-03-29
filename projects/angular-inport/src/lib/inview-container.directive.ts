import {
	Directive,
	ContentChildren,
	QueryList,
	OnDestroy,
	AfterViewInit,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	NgZone,
} from '@angular/core';
import { Subscription, timer } from 'rxjs';

import { InviewItemDirective } from './inview-item.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
import { OffsetResolver } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { map, tap, debounce } from 'rxjs/operators';

type IChildWithReact = [InviewItemDirective, ElementClientRect, number];

@Directive({
	selector: '[in-view-container]',
	standalone: false,
})
export class InviewContainerDirective implements OnDestroy, AfterViewInit {
	private _scrollSuscription!: Subscription;
	private _offset: Array<number | string> = [0, 0, 0, 0];
	private _viewPortOffset: Array<number | string> = [0, 0, 0, 0];
	private _throttle: number = 0;
	private _scrollWindow: boolean = true;
	private _data: any;
	private _bestMatch!: boolean;
	private _lastScrollY: number = 0;
	private _scrollDirection: string = 'down';
	private _triggerOnInit!: boolean;

	@Input()
	set offset(offset: Array<number | string> | number | string) {
		this._offset = OffsetResolver.create(offset).normalizeOffset();
	}
	@Input()
	set triggerOnInit(triggerOnInit: boolean) {
		this._triggerOnInit = !!triggerOnInit;
	}
	@Input()
	set viewPortOffset(offset: Array<number> | number | string) {
		this._viewPortOffset = OffsetResolver.create(offset).normalizeOffset();
	}
	@Input()
	set throttle(throttle: number) {
		this._throttle = throttle;
	}
	@Input()
	set scrollWindow(sw: boolean) {
		this._scrollWindow = !!sw;
	}
	@Input()
	set data(_d: any) {
		this._data = _d;
	}
	@Input()
	set bestMatch(bm: any) {
		this._bestMatch = !!bm;
	}

	@Output() inview: EventEmitter<any> = new EventEmitter();
	@ContentChildren(InviewItemDirective, { descendants: true, emitDistinctChangesOnly: false })
	private _inviewChildren!: QueryList<InviewItemDirective>;

	constructor(
		private _element: ElementRef,
		private _scrollObservable: ScrollObservable,
		private _windowRuler: WindowRuler,
		private _zone: NgZone,
	) {}

	ngAfterViewInit() {
		this._scrollSuscription = this._scrollObservable
			.scrollObservableFor(this._scrollWindow ? window : this._element.nativeElement)
			.pipe(
				debounce(() => timer(this._throttle)),
				map(() => this._getViewPortRuler()),
				tap(() => this._checkScrollDirection()),
			)
			.subscribe((containersBounds: ElementClientRect) => this.handleOnScroll(containersBounds));
		if (this._triggerOnInit) return this.handleOnScroll(this._getViewPortRuler());
	}

	private _checkScrollDirection() {
		if (this._scrollWindow) {
			this._scrollDirection = window.scrollY > this._lastScrollY ? 'down' : 'up';
			this._lastScrollY = window.scrollY;
		} else {
			this._scrollDirection = this._element.nativeElement.scrollTop > this._lastScrollY ? 'down' : 'up';
			this._lastScrollY = this._element.nativeElement.scrollTop;
		}
	}

	private _getViewPortRuler() {
		return this._scrollWindow
			? this._windowRuler.getWindowViewPortRuler()
			: PositionResolver.getBoundingClientRect(this._element.nativeElement);
	}

	ngOnDestroy() {
		if (this._scrollSuscription) {
			this._scrollSuscription.unsubscribe();
		}
	}

	handleOnScroll(containersBounds: ElementClientRect) {
		if (!this._inviewChildren || this._inviewChildren.length === 0) return;

		const viewPortOffsetRect = PositionResolver.offsetRect(containersBounds, this._viewPortOffset);
		const visibleChildren: Array<IChildWithReact> = this._inviewChildren
			.toArray()
			.map((child: InviewItemDirective): IChildWithReact => {
				const elementRect = PositionResolver.offsetRect(child.getELementRect(), this._offset);
				return [child, elementRect, PositionResolver.distance(viewPortOffsetRect, elementRect)];
			})
			.filter(([child, rect]) => child.isVisible() && PositionResolver.intersectRect(rect, viewPortOffsetRect));

		if (!this._bestMatch) {
			const data: any = {};
			data.inview = visibleChildren.map(([child]) => child.getData());
			data.direction = this._scrollDirection;
			this._zone.run(() => this.inview.emit(data));
			return;
		}

		const bestMatch = visibleChildren.sort(([, , distanceA], [, , distanceB]) => {
			if (distanceA > distanceB) return 1;
			else if (distanceA < distanceB) return -1;
			return 0;
		})[0];
		const data: any = bestMatch ? bestMatch[0].getData() : {};
		data.direction = this._scrollDirection;
		this._zone.run(() => this.inview.emit(data));
	}
}
