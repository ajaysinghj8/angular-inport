# Changelog

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
