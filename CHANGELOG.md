# Changelog

## [Unreleased] - Phase 5 IntersectionObserver Migration (refactor/phase5-intersection-observer)

### Refactor
- Replaced the entire scroll/resize pipeline in both directives with the browser-native `IntersectionObserver` API
- `ScrollObservable` and `WindowRuler` deleted — no longer needed
- `OffsetResolver.toRootMargin()` added — converts normalized offset to a CSS `rootMargin` string
- `offset` + `viewPortOffset` inputs are combined into a single `rootMargin` value passed to `IntersectionObserver`
- `throttle` input marked `@deprecated` — IO fires natively only on actual visibility changes, no debouncing needed
- `InviewContainerDirective` tracks visible children in a `Map` and reacts to `QueryList.changes` to re-sync observed targets dynamically
- `scrollWindow=false` uses the container element as the IO `root`
- All directive specs rewritten to use a `MockIntersectionObserver` — no more mocking `ScrollObservable` / `WindowRuler`

### Performance impact
- Zero scroll/resize event listeners — IO runs off the main thread
- No `NgZone` leakage — CD only triggered at the emit site
- SSR safe — IO is gated on `isPlatformBrowser` (returns `EMPTY` on server)

---

## [Unreleased] - Phase 4 Performance & SSR Safety (refactor/phase4-performance)

### Refactor
- Wrapped scroll subscriptions in `NgZone.runOutsideAngular()` in both directives — scroll/resize events no longer trigger Angular change detection on every tick; `zone.run()` is called only at the emit site
- Added `isPlatformBrowser` guard to `WindowRuler` — returns a zero rect on SSR instead of crashing on `window.innerHeight` / `window.innerWidth`
- Added `isPlatformBrowser` guard to `ScrollObservable` — returns `EMPTY` on SSR instead of crashing on `fromEvent(window, ...)` / `fromEvent(document, ...)`

---

## [Unreleased] - Phase 3 Type Safety (refactor/phase3-type-safety)

### Refactor
- Added `events.ts` with typed interfaces: `InviewEvent`, `InviewContainerEvent`, `InviewBestMatchEvent`, `InviewItemData`, `InviewParts`, `InviewPercentage`
- Typed `EventEmitter` outputs in `InviewDirective` (`EventEmitter<InviewEvent>`) and `InviewContainerDirective` (`EventEmitter<InviewContainerEvent | InviewBestMatchEvent>`) — replaces `any`
- Typed `getData()` return value in `InviewItemDirective` — returns `InviewItemData` instead of `any`
- Reconstructed `handleOnScroll` output objects as typed structs — no more `any` mutation
- Exported all event interfaces from public API (`index.ts`) — consumers can now import and type their event handlers

---

## [Unreleased] - Phase 2 Angular 21 Modernization (refactor/phase2-angular21-modernization)

### Refactor
- Converted all three directives to `standalone: true` — no NgModule declaration needed
- Replaced constructor dependency injection with `inject()` in all directives and `ScrollObservable`
- Replaced `@Input()` decorators with signal inputs (`input()`, `computed()`) in all directives
- Fixed public API typo: `scrollELement` → `scrollElement` in `InviewDirective`
- Replaced `takeUntil(destroy$)` + `ngOnDestroy` with `takeUntilDestroyed(destroyRef)` — no manual subscription management
- Moved `WindowRuler` and `ScrollObservable` to `providedIn: 'root'` — no NgModule providers needed
- `NgInviewModule` kept as `@deprecated` backward-compat shim (imports standalone directives, no providers)
- Updated all spec files: standalone directives moved from `declarations` to `imports`

---

## [Unreleased] - Phase 1 Cleanups (refactor/phase1-cleanups)

### Refactor
- Removed dead `filter(() => true)` no-op operator from `InviewDirective` and `InviewContainerDirective`
- Replaced `mergeMap(event => _of(...))` with `map()` in both directives — equivalent behavior, cleaner intent
- Removed unused imports (`Subject`, `merge`, `Observable`, `OnInit`) from `InviewDirective`
- Removed empty `ngOnInit()` bodies from all three directives
- Removed dead `_throttleType` private field from `InviewDirective` and `InviewContainerDirective` (declared but never read)
- Renamed `_previous_state` → `_previousState` in `InviewDirective` to follow camelCase convention
- Eliminated `WindowRulerStatic` indirection — state moved directly into `WindowRuler` service instance
- Collapsed `OffsetResolverFactory` into a static `OffsetResolver.create()` method — factory added no value
- Removed dead `inviewPercentage()` (lowercase v) from `PositionResolver` — duplicate of `inViewPercentage()`, never called internally

---

## [5.0.0] - 2026-03-29

**Angular 21 compatibility release**

### What's New

#### Angular 21 Support
Full upgrade from Angular 13 to Angular 21, migrated one major version at a time with all official Angular migration schematics applied.

#### TypeScript 6.0
Updated to TypeScript 6.0 with all deprecated compiler options resolved.

#### Comprehensive Test Suite
72 unit tests added covering all library code — previously untested:
- `OffsetResolver` — offset normalization (scalar, 2/3/4-element arrays, percentage strings)
- `PositionResolver` — all static methods (`intersectRect`, `offsetRect`, `distance`, `inViewPercentage`, `isElementClipped`, `isElementOutsideView`, etc.)
- `InviewDirective` — visible/hidden states, `lazy`, `tooLazy`, `data` output
- `InviewContainerDirective` — all children mode, `bestMatch` mode, empty container
- `InviewItemDirective` — `getData()`, `isVisible()`, `getELementRect()`

#### Updated peer dependencies
```json
"@angular/common": "^21.0.0"
"@angular/core": "^21.0.0"
"rxjs": "^7.8.0"
```

### Breaking Changes
- **Requires Angular 21+** (previously Angular 13)
- **Requires TypeScript 5.9+**
- **Requires RxJS 7.8+**
