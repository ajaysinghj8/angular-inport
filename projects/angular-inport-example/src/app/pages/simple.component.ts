import { Component, ViewChild, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JsonBeautyPipe } from '../app.pipes';

@Component({
	selector: 'simple-comp',
	templateUrl: './simple.component.html',
	styleUrls: ['./simple.component.css'],
})
export class SimpleComponent implements OnInit {
	@ViewChild('individualwrapped', { static: true }) individualwrapped: any;

	trigger: any = new BehaviorSubject(0);
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
			this.items.push({
				name: 'Item ' + i,
			});
		}
	}

	ngOnInit() {
		this.elementIndividualWrapped = this.individualwrapped.nativeElement;
		setTimeout(() => (this.ready = true));
	}

	inViewIndividualWrapped($event: Object) {
		this.stateIndividualWrapped = $event;
	}

	inViewIndividual($event: Object) {
		this.stateIndividual = $event;
	}

	inViewContainer($event: Object) {
		this.stateContainer = $event;
	}

	inViewContainerWrapped($event: Object) {
		this.stateContainerWrapped = $event;
	}

	inViewContainerBestWrapped($event: Object) {
		this.stateContainerBestWrapped = $event;
	}

	triggerCustom() {
		this.trigger.next(0);
	}
}
