# Angular In Port / Angular In View Port

## Installation

- `npm i -S angular-inport`

- `yarn add angular-inport`

## Importing module 
 
```js
import { NgInviewModule } from 'angular-inport'; 

@NgModule({                                   
    imports: [
        // ...
        NgInviewModule                       
    ],
    declarations: [YourAppComponent],
    exports: [YourAppComponent],
    bootstrap: [YourAppComponent],
})
```

#### Basic Usages

```html
<div in-view (inview)="inview($event)"></div>
```

#### Advanced Usages

```html

<div in-view
          (inview)="inview($event)"
          [offset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
          [viewPortOffset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
          [throttle]="[Number in ms to limit the inview event]"
          [scrollELement]="parent element reference on which scrolling applied" 
          [trigger]="An Observable ex. BehaviorSubject"
          >
          .......
</div>

```

## InviewContainer and InviewItem Directive

#### Basic Usages

```html

<div in-view-container (inview)="inview($event)">
   <div in-view-item *ngFor="let item of items; let i = index;" [id]="index" [data]="item">
     .......
   </div>
</div>

```


#### Advanced Usages

```html

<div in-view-container 
                    (inview)="inview($event)"
                    [offset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
                    [viewPortOffset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
                    [throttle]="[Number in ms to limit the inview event]"
                    [bestMatch]="when true, inview will return only one element closet to viewport center"
                    [trigger]="An Observable ex. BehaviorSubject"
                    >
   <div in-view-item *ngFor="let item of items; let i = index;" [id]="index" [data]="item">
     .......
   </div>
</div>

```

#### InView Props

* `(inview)`: inview event, it will keep to emitting the event on scroll. 
* `[offset]`: offset value can be provided as [top, right, bottom, left] or [top/bottom, left/right] or [top/bottom/left/right]
* `[viewPortOffset]` : offset value from an element or window port.
* `[trigger]`: An Observable ex. BehaviorSubject can be passed to trigger (inview) event.
* `[scrollELement]`: element to check if the content is available in view port with in the element 's view port. default value is window.
* `[data]`: data property can be used to identify the in-view event source, when you have multiple in-view directives in a page attached to same in-view handler.

* `[lazy]`: default  false, set true when you want in-view event to trigger only on visibility of that content. will not trigger when content goes out of view port.
* `[tooLazy]`: default false, set true when you want in-view event to trigger only when visibility state changes.
* `[triggerOnInit]`: default false, set true when you want in-view event to get triggered on element load otherwise it will trigger only on scroll event.

#### InViewContainer Props
* `(inview)`: inview event, it will keep to emitting the event on scroll. 
* `[offset]`: offset value can be provided as [top, right, bottom, left] or [top/bottom, left/right] or [top/bottom/left/right]
* `[viewPortOffset]` : offset value from an element or window port.
* `[scrollWindow]`: default true uses window scroll to check inview status, set false to check from container's scroll. 
* `[bestMatch]` : will return only the centered element from other element. Please check example.
* `[triggerOnInit]`: default false, set true when you want in-view event to get triggered on element load otherwise it will trigger only on scroll event.

