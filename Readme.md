# Ng2 Inview 



```html
<div in-view (inview)="inview($event)">
</div>    


```


```html
<div in-view
          (inview)="inview($event)"
          [offset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
          [viewPortOffset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
          [throttle]="[Number in ms to limit the inview event]"
          [scrollELement]="parent element reference on which scrolling applied" 
          >
          .......
</div>
```


```html

<div in-view-container 
                    (inview)="inview($event)"
                    [offset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
                    [viewPortOffset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
                    [throttle]="[Number in ms to limit the inview event]"
                    [bestMatch]="when true, inview will return only one element closet to viewport center"
                    >
   <div in-view-item *ngFor="let item of items; let i = index;" [id]="index" [data]="item">
     .......
   </div>
</div>
```
