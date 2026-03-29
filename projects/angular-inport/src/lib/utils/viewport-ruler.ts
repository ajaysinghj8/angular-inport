import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ElementClientRect } from './models';

const SSR_RECT: ElementClientRect = { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };

@Injectable({ providedIn: 'root' })
export class WindowRuler {
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private _windowRect: ElementClientRect = SSR_RECT;

	constructor() {
		this._updateWindowRect();
	}

	onChange() {
		this._updateWindowRect();
	}

	getWindowViewPortRuler(): ElementClientRect {
		return this._windowRect;
	}

	private _updateWindowRect() {
		if (!this._isBrowser) return;
		const height = window.innerHeight;
		const width = window.innerWidth;
		this._windowRect = { top: 0, left: 0, bottom: height, right: width, height, width };
	}
}
