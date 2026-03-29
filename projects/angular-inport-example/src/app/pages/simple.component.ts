import { Component, ViewChild, OnInit } from '@angular/core';

@Component({
    selector: 'simple-comp',
    templateUrl: './simple.component.html',
    styleUrls: ['./simple.component.css'],
    standalone: false
})
export class SimpleComponent implements OnInit {
	@ViewChild('individualwrapped', { static: true }) individualwrapped: any;

	stateIndividual: any = {};
	stateContainer: any = {};
	stateIndividualWrapped: any = {};
	elementIndividualWrapped!: HTMLElement;
	stateContainerWrapped: any = {};
	stateContainerBestWrapped: any = {};
	items: Array<{ name: string }> = [];
	ready = false;

	constructor() {
		for (let i = 0; i < 10; i++) {
			this.items.push({ name: 'Item ' + i });
		}
	}

	ngOnInit() {
		this.elementIndividualWrapped = this.individualwrapped.nativeElement;
		setTimeout(() => (this.ready = true));
	}

	inViewIndividual(e: any) { this.stateIndividual = e; }
	inViewContainer(e: any) { this.stateContainer = e; }
	inViewIndividualWrapped(e: any) { this.stateIndividualWrapped = e; }
	inViewContainerWrapped(e: any) { this.stateContainerWrapped = e; }
	inViewContainerBestWrapped(e: any) { this.stateContainerBestWrapped = e; }

	isInContainer(index: number): boolean {
		return this.stateContainer?.inview?.some((item: any) => item.id === index) ?? false;
	}

	isInWrapped(index: number): boolean {
		return this.stateContainerWrapped?.inview?.some((item: any) => item.id === index) ?? false;
	}
}
