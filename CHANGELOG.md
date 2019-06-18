
### [v0.8.0](https://github.com/mvdom/mvdom/compare/v0.7.5...v0.8.0) June 18th 2019

- Moved source code to typescript (API preserved)
  - Removed `types/index.d.ts` (not needed anymore, all `.d.ts` are in the `dist/` directory);
- `frag()` or `frag(null)` is valid now, and returns empty `DocumentFragment`.
- `off(el, nsObj: {ns: string})` Now `off` for namespace must take a NsObject (i.e. `{ns: string}`)
- deprecated `asArray`

### [v0.7.5](https://github.com/mvdom/mvdom/compare/v0.7.4...v0.7.5) May 31st 2019

- Added for CHANGELOG.md
- fix #46 events - namespaced undbinding (off) does not work for events bound without selector

### [v0.7.4](https://github.com/mvdom/mvdom/compare/v0.7.3...v0.7.4) May 20th 2019

- fix #45 dx - undefined value or undeclared properties always get push to the puller function

### [older releases](https://github.com/mvdom/mvdom/releases)
