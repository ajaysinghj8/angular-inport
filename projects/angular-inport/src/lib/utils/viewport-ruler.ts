import { Injectable } from '@angular/core';
import { ElementClientRect } from './models';

@Injectable({ providedIn: 'root' })
export class WindowRuler {
	private _windowRect!: ElementClientRect;

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
		const height = window.innerHeight;
		const width = window.innerWidth;
		this._windowRect = { top: 0, left: 0, bottom: height, right: width, height, width };
	}
}
