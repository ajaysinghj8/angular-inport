import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY, merge, fromEvent } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { WindowRuler } from './viewport-ruler';
import { WindowElement } from './models';

@Injectable({ providedIn: 'root' })
export class ScrollObservable {
	static _globalObservable: Observable<any>;
	static _elementObservableReferences: WeakMap<WindowElement, Observable<any>> = new WeakMap();

	private readonly _windowRuler = inject(WindowRuler);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	static isWindow(windowElement: WindowElement) {
		return Object.prototype.toString.call(windowElement).includes('Window');
	}

	constructor() {
		if (this._isBrowser && !ScrollObservable._globalObservable) {
			ScrollObservable._globalObservable = this._getGlobalObservable();
		}
	}

	private _getGlobalObservable(): Observable<any> {
		return merge(fromEvent(window.document, 'scroll'), fromEvent(window, 'resize')).pipe(
			tap(() => this._windowRuler.onChange()),
			share(),
		);
	}

	scrollObservableFor(windowElement: WindowElement): Observable<any> {
		if (!this._isBrowser) return EMPTY;

		if (ScrollObservable.isWindow(windowElement)) {
			return ScrollObservable._globalObservable;
		}
		if (ScrollObservable._elementObservableReferences.has(windowElement)) {
			return ScrollObservable._elementObservableReferences.get(windowElement)!;
		}
		const ref = this._createElementObservable(windowElement);
		ScrollObservable._elementObservableReferences.set(windowElement, ref);
		return ref;
	}

	private _createElementObservable(windowElement: WindowElement): Observable<any> {
		return fromEvent(windowElement, 'scroll').pipe(share());
	}
}
