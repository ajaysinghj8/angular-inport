export interface InviewParts {
	top: boolean;
	right: boolean;
	bottom: boolean;
	left: boolean;
}

export interface InviewPercentage {
	vertical: number;
	horizontal: number;
}

/** Event emitted by InviewDirective */
export interface InviewEvent {
	status: boolean;
	/** Present only when the `data` input is set */
	data?: unknown;
	isClipped: boolean;
	isOutsideView: boolean;
	parts: InviewParts;
	inViewPercentage: InviewPercentage;
}

/** Shape returned by InviewItemDirective.getData() */
export interface InviewItemData {
	id: unknown;
	data: unknown;
}

/** Event emitted by InviewContainerDirective when bestMatch=false (default) */
export interface InviewContainerEvent {
	inview: InviewItemData[];
	direction: 'up' | 'down';
}

/** Event emitted by InviewContainerDirective when bestMatch=true */
export interface InviewBestMatchEvent extends InviewItemData {
	direction: 'up' | 'down';
}
