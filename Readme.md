# Ng2 Inview 



```html
<ng-inview (inview)="inview($event)">
</ng-inview>    


```


```html
<ng-inview 
          (inview)="inview()"
          [offset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
          [viewPortOffset]="[top, right, bottom, left]" or "[top/bottom, left/right]" or "[top/bottom/left/right]"
          [throttle]="[Number in ms to limit the inview event]"
          [scrollELement]="parent element reference on which scrolling applied" 
          >
</ng-inview>
```


