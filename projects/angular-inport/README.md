# angular-inport

Angular directives for detecting when elements enter or leave the viewport, powered by the native **IntersectionObserver** API.

[![npm](https://img.shields.io/npm/v/angular-inport)](https://www.npmjs.com/package/angular-inport)
[![Angular](https://img.shields.io/badge/Angular-21%2B-red)](https://angular.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Native IntersectionObserver** — zero scroll/resize listeners, runs off the main thread
- **Angular 21+** with standalone directives, signal inputs, `inject()`, `takeUntilDestroyed`
- **SSR safe** — `isPlatformBrowser` guards on all browser API access
- **Fully typed** — exported event interfaces for all directive outputs
- **Tree-shakeable** — import only what you need

## Installation

```bash
npm install angular-inport
```

## Quick start

Import the directives directly (recommended):

```ts
import { InviewDirective, InviewContainerDirective, InviewItemDirective } from 'angular-inport';

@Component({
  imports: [InviewDirective],
  template: `<div in-view (inview)="onInview($event)"></div>`,
})
export class MyComponent {
  onInview(event: InviewEvent) {
    console.log(event.status, event.inViewPercentage);
  }
}
```

Or use the backwards-compatible `NgInviewModule` (deprecated, will be removed in a future major):

```ts
import { NgInviewModule } from 'angular-inport';

@NgModule({ imports: [NgInviewModule] })
export class AppModule {}
```

---

## Directives

### `[in-view]`

Tracks a single element's visibility in the window (or a custom scroll container).

```html
<div
  in-view
  [offset]="[0, 0, 0, 0]"
  [viewPortOffset]="[0, 0, 0, 0]"
  [scrollElement]="myScrollableDiv"
  [lazy]="false"
  [tooLazy]="false"
  [triggerOnInit]="false"
  [data]="myPayload"
  (inview)="onInview($event)"
></div>
```

**Output event — `InviewEvent`:**

```ts
interface InviewEvent {
  status: boolean;           // true = in view
  isClipped: boolean;        // element is partially cut off
  isOutsideView: boolean;    // element is fully outside viewport
  parts: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  inViewPercentage: {
    vertical: number;        // 0–100
    horizontal: number;      // 0–100
  };
  data?: unknown;            // echoes the [data] input, if set
}
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `offset` | `number \| string \| Array` | `[0,0,0,0]` | Shrink/expand the element's effective rect. CSS-margin shorthand — `[top, right, bottom, left]`, 2-value, or scalar. Supports `%`. |
| `viewPortOffset` | `number \| string \| Array` | `[0,0,0,0]` | Same shorthand applied to the viewport rect. |
| `scrollElement` | `HTMLElement` | `undefined` | Custom scroll container (uses window by default). |
| `lazy` | `boolean` | `false` | When `true`, does not emit when the element leaves the viewport. |
| `tooLazy` | `boolean` | `false` | When `true`, only emits when visibility *changes* (suppresses duplicate state). |
| `triggerOnInit` | `boolean` | `false` | Emit immediately on element load without waiting for a scroll. |
| `data` | `unknown` | `undefined` | Arbitrary payload echoed back in every event. |
| `throttle` | `number` | `0` | *Deprecated* — no-op with IntersectionObserver. |

---

### `[in-view-container]` + `[in-view-item]`

Tracks multiple child items, emitting a list of every currently visible item on each change.

```html
<div
  in-view-container
  [scrollWindow]="true"
  [bestMatch]="false"
  [offset]="[0,0,0,0]"
  [viewPortOffset]="[0,0,0,0]"
  [triggerOnInit]="false"
  (inview)="onContainerInview($event)"
>
  @for (item of items; track item.id) {
    <div in-view-item [id]="item.id" [data]="item"></div>
  }
</div>
```

**Output event — `InviewContainerEvent`** (when `bestMatch=false`, default):

```ts
interface InviewContainerEvent {
  inview: Array<{ id: unknown; data: unknown }>;
  direction: 'up' | 'down';
}
```

**Output event — `InviewBestMatchEvent`** (when `bestMatch=true`):

```ts
interface InviewBestMatchEvent {
  id: unknown;
  data: unknown;
  direction: 'up' | 'down';
}
```

**`[in-view-container]` inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `scrollWindow` | `boolean` | `true` | `true` = track against window. `false` = track against the container element itself (IO root). |
| `bestMatch` | `boolean` | `false` | Emit only the single item closest to the centre of the viewport/container. |
| `offset` | `number \| string \| Array` | `[0,0,0,0]` | Offset applied to each item's rect. |
| `viewPortOffset` | `number \| string \| Array` | `[0,0,0,0]` | Offset applied to the viewport/root rect. |
| `triggerOnInit` | `boolean` | `false` | Emit the current visible set immediately on load. |
| `data` | `unknown` | `undefined` | Arbitrary payload (available in the component for your own use). |
| `throttle` | `number` | `0` | *Deprecated* — no-op with IntersectionObserver. |

**`[in-view-item]` inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `id` | `unknown` | `undefined` | Identifier echoed in every container event. |
| `data` | `unknown` | `undefined` | Payload echoed in every container event. |

---

## Typed event imports

All event interfaces are exported from the public API:

```ts
import {
  InviewEvent,
  InviewContainerEvent,
  InviewBestMatchEvent,
  InviewItemData,
  InviewParts,
  InviewPercentage,
} from 'angular-inport';
```

---

## Migrating from v4

| v4 | v5 |
|---|---|
| `@Input() scrollELement` | `scrollElement` (typo fixed — **breaking**) |
| `@Input()` decorators | Signal inputs (`input()`) — no behaviour change for consumers |
| NgModule required | Standalone directives — import directly |
| `NgInviewModule` | Still available, marked `@deprecated` |
| Scroll/resize events | IntersectionObserver — eliminates all scroll listeners |
| `trigger` input | Removed — use `triggerOnInit` or re-render the element |

---

## Browser support

IntersectionObserver is supported in all modern browsers (97%+ global coverage). For older targets, add the [`intersection-observer` polyfill](https://www.npmjs.com/package/intersection-observer).

---

## License

MIT © [Ajay Singh](https://github.com/ajaysinghj8)
