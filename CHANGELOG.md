# Changelog

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
