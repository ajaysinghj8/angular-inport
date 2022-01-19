import {
	Directive,
	ContentChildren,
	QueryList,
	OnInit,
	OnDestroy,
	AfterViewInit,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	NgZone,
} from '@angular/core';
import { Subject, Subscription, timer, of as _of } from 'rxjs';

import { InviewItemDirective } from './inview-item.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
import { OffsetResolverFactory } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementClientRect } from './utils/models';
import { filter, mergeMap, tap, debounce } from 'rxjs/operators';

// allmost same configuration as child
// child will not have inview property? to trigger changes
// will use scroll on this or window
// will check wheather the child is in view port
// will start checking from last inview child and with direction of scroll until a child is not visible
// can return all inview children
// or best match case
// if container is used then first check if container itself is in the viewport of the window.
// then only the futher calculation should take place

type IChildWithReact = [InviewItemDirective, ElementClientRect, number];

@Directive({
	selector: '[in-view-container]',
})
export class InviewContainerDirective implements OnInit, OnDestroy, AfterViewInit {
	private _scrollSuscription!: Subscription;
	private _throttleType: string = 'debounce';
	private _offset: Array<number | string> = [0, 0, 0, 0];
	private _viewPortOffset: Array<number | string> = [0, 0, 0, 0];
	private _throttle: number = 0;
	private _scrollWindow: boolean = true;
	private _data: any;
	private _bestMatch!: boolean;
	private _lastScrollY: number = 0;
	private _scrollDirection: string = 'down';
	private _triggerOnInit!: boolean;

	@Input() trigger!: Subject<any>;
	@Input()
	set offset(offset: Array<number | string> | number | string) {
		this._offset = OffsetResolverFactory.create(offset).normalizeOffset();
	}
	@Input()
	set triggerOnInit(triggerOnInit: boolean) {
		this._triggerOnInit = !!triggerOnInit;
	}
	@Input()
	set viewPortOffset(offset: Array<number> | number | string) {
		this._viewPortOffset = OffsetResolverFactory.create(offset).normalizeOffset();
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

	ngOnInit() {}
	ngAfterViewInit() {
		this._scrollSuscription = this._scrollObservable
			.scrollObservableFor(this._scrollWindow ? window : this._element.nativeElement)
			.pipe(
				debounce(() => timer(this._throttle)),
				filter(() => true),
				mergeMap((event: any) => _of(this._getViewPortRuler())),
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

		// check of scroll up or down
		// Note:: check all children from parent if it is in view or not
		// for cache of less iterations start from the last visible  item then based on scroll up and down check list further
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

		// let bestMatchChild: InviewItemDirective;
		// if (visibleChildren.length) {
		// 	visibleChildren.reduce((distance: number, [child, rect]: IChildWithReact) => {
		// 		const _distance = ;
		// 		if (distance > _distance) {
		// 			bestMatchChild = child;
		// 			return _distance;
		// 		}
		// 		console.log('distance', distance);
		// 		return distance;
		// 	}, Infinity);
		// }
		console.log(visibleChildren);
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

//  inview-container -> inview-item ->

//  scrollWindow =  true -> will test it against the window scroll event with container.
//  scrollWindow = false -> means we need to attach scroll event on this container.

// inview ->  directly used against the window.
