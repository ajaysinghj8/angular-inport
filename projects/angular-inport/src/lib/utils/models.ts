export interface ElementBoundingPositions {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface ElementClientRect extends ElementBoundingPositions {
	height: number;
	width: number;
}

export type WindowElement = HTMLElement | Window;

export interface Point {
	x: number;
	y: number;
}
