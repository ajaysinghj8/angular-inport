import { Directive, ContentChildren, QueryList, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ElementRef, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';

import { InviewItemDirective } from './inview-item.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
import { OffsetResolverFactory } from './utils/offset-resolver';
import { PositionResolver } from './utils/position-resolver';
import { ElementBoundingPositions } from './utils/models';
// allmost same configuration as child
// child will not have inview property? to trigger changes
// will use scroll on this or window
// will check wheather the child is in view port
// will start checking from last inview child and with direction of scroll until a child is not visible
// can return all inview children
// or best match case
// if container is used then first check if container itself is in the viewport of the window.
// then only the futher calculation should take place

@Directive({
  selector: '[in-view-container]'
})
export class InviewContainerDirective implements OnInit, OnDestroy, AfterViewInit {
  private _scrollSuscription: Subscription;
  private _throttleType: string = 'debounce';
  private _offset: Array<number> = [0, 0, 0, 0];
  private _viewPortOffset: Array<number> = [0, 0, 0, 0];
  private _throttle: number = 0;
  private _scrollWindow: boolean = true;
  private _data: any;
  private _bestMatch: boolean;

  @Input()
  set offset(offset: Array<number> | number) {
    this._offset = OffsetResolverFactory.create(offset).normalizeOffset();
  }
  @Input()
  set viewPortOffset(offset: Array<number> | number) {
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
  @ContentChildren(InviewItemDirective) private _inviewChildren: QueryList<InviewItemDirective>;

  constructor(
    private _element: ElementRef,
    private _scrollObservable: ScrollObservable,
    private _windowRuler: WindowRuler,
    private _zone: NgZone
  ) { }

  ngOnInit() { }
  ngAfterViewInit() {
    this._scrollSuscription = this._scrollObservable.scrollObservableFor(window)
    [this._throttleType](() => Observable.timer(this._throttle))
      .filter(() => true)
      .mergeMap((event: any) => Observable.of(this._getViewPortRuler()))
      .subscribe((containersBounds: ElementBoundingPositions) => this.handleOnScroll(containersBounds));

  }
  private _getViewPortRuler() {
    return this._scrollWindow ? this._windowRuler.getWindowViewPortRuler() : PositionResolver.getBoundingClientRect(this._element.nativeElement);
  }
  ngOnDestroy() {
    if (this._scrollSuscription) {
      this._scrollSuscription.unsubscribe();
    }
  }

  handleOnScroll(containersBounds: ElementBoundingPositions) {
    // check of scroll up or down
    // Note:: check all children from parent if it is in view or not
    // for cache of less iterations start from the last visible  item then based on scroll up and down check list futher
    let viewPortOffsetRect = PositionResolver.offsetRect(containersBounds, this._viewPortOffset);
    let visibleChildren: Array<any> = [];
    if (this._inviewChildren) {
      visibleChildren = this._inviewChildren.toArray().filter((child: InviewItemDirective) => {
        let elementOffsetRect = PositionResolver.offsetRect(child.getELementRect(), this._offset);
        return child.isVisible() && PositionResolver.intersectRect(elementOffsetRect, viewPortOffsetRect);
      });
      if (this._bestMatch) {
        let bestMatchChild: InviewItemDirective;
        if (visibleChildren.length) {
          visibleChildren.reduce((distance: number, currChild: InviewItemDirective) => {
            let _distance = PositionResolver.distance(viewPortOffsetRect, PositionResolver.offsetRect(currChild.getELementRect(), this._offset));
            if (distance > _distance) {
              bestMatchChild = currChild;
              return _distance;
            }
            return distance;
          }, Infinity);
        }
        this._zone.run(() => this.inview.emit(
          bestMatchChild ? bestMatchChild.getData() : null
        ));
      } else {
        this._zone.run(() => this.inview.emit(
          visibleChildren.map((vc: InviewItemDirective) => vc.getData())
        ));
      }

    }
  }

}


//  inview-container -> inview-item ->

//  scrollWindow =  true -> will test it against the window scroll event with container.
//  scrollWindow = false -> means we need to attach scroll event on this container.

// inview ->  directly used against the window.
