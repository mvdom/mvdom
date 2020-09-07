# CHANGELOG

> Legend: `.` minor; `-` fix; `!` change; `+` enhancement; 

## Releases 0.9.x - Native Web Components

### [v0.9.10](https://github.com/mvdom/mvdom/compare/v0.9.9...v0.9.10) Sept 6, 2020

- `!!!` DEPRECATION NOTICE - NEW NAME - Please upgrade to [dom-native](https://www.npmjs.com/package/dom-native) - drop-in replacement

### [v0.9.9](https://github.com/mvdom/mvdom/compare/v0.9.8...v0.9.9) May 13th 2020

- `-` type - added `Document` type to `first` and `all` to match `@types/node` 14.x and above

### [v0.9.8](https://github.com/mvdom/mvdom/compare/v0.9.7...v0.9.8) May 10th 2020

- `-` className() - add className to convenient set/toggle multiple css class names.
- `.!` style() - made it null-passthrough (i.e., return el as is if null or undefined)

### [v0.9.8](https://github.com/mvdom/mvdom/compare/v0.9.7...v0.9.8) May 10th 2020

- `+` className() - add className to convenient set/toggle multiple css class names.
- `.!` style() - made it null-passthrough (i.e., return el as is if null or undefined)

### [v0.9.7](https://github.com/mvdom/mvdom/compare/v0.9.6...v0.9.7) Apr 13th 2020

- `+` append() - export AppendPosition

### [v0.9.6](https://github.com/mvdom/mvdom/compare/v0.9.5...v0.9.6) Nov 10th 2019

- `+` elem() - added the document.createElement shortcut `elem(...tagNames): HTMLElement | HTMLElement[]`
- `.!` append() - changed append(el,string | fragment) to return HTMLElement[] children (rather than first children or null)

### [v0.9.5](https://github.com/mvdom/mvdom/compare/v0.9.4...v0.9.5) Oct 20th 2019

- dx - add support for DocumentFragment for push/push

### [v0.9.4](https://github.com/mvdom/mvdom/compare/v0.9.2...v0.9.4) Oct 19th 2019

- [#47 append - fix first HTML Element for DocumentFragment and add support HTML string as newEl](https://github.com/mvdom/mvdom/issues/47)

### [v0.9.2](https://github.com/mvdom/mvdom/compare/v0.9.1...v0.9.2) Oct 6th 2019

- `on(...)` - Allow event type mapping  `on(el, 'click', (evt: MouseEvent) => {})` or `on(el, 'dragstart', (evt: DragStart) => {})` (work with selector as well. Only work when for single event type at a time)

### [v0.9.1](https://github.com/mvdom/mvdom/compare/v0.9.0...v0.9.1) Sept 29th 2019

- Made `OnEvent<T = any | undefined>` rather than making `.detail` always optional even when generically defined. 

### [v0.9.0](https://github.com/mvdom/mvdom/compare/v0.8.7...v0.9.0) Sept 8th 2019

- Full deprecation of the View APIs, to align with browsers **Native Web Component** model.
- Add the `BaseHTMLElement` that extends the DOM native `HTMLElement` adding
  - Simple lifecycle methods (e.g., `init` `preDisplay` `postDisplay`)
  - Simple event (DOM and Hub) bindings (e.g., `@onEvent` `@onDoc` `@onWin` `@onHub`)
- Removed 0.8.x View apis (e.g., `remove/removeView` `empty/emptyView`, `display/displayView` and other types) (see [migrating from 0.8.x to 0.9.x](https://github.com/mvdom/mvdom#migration-from-08x-to-09x))
- Added new DOM convenience APIS beyond 0.8.x first, all, ..., such as `attr(...)` and `style(...)` APIs.


## Releases 0.8.x branch (legacy View Apis)

0.9.x is a major refactorization on the "view apis" side as mvdom now fully embraces the native DOM Web Component model (i.e., `customElement`) and should be used for new project. Most of the other APIs, such as `first`, `all`, `on`, `hub`, remained unchanged and 0.9.x even as some new convenient DOM manipulation light APIs such as `attr()` and `style()`. However, the old 0.8.x is still available and requested patches will be apply as deemed necessary. 

### [v0.8.7](https://github.com/mvdom/mvdom/compare/v0.8.6...v0.8.7) Sept 6th 2019

- Added deprecation nodice for `display -> displayView` `remove -> removeView` `empty -> emptyView`

### [v0.8.6](https://github.com/mvdom/mvdom/compare/v0.8.4...v0.8.6) Aug 3rd 2019
- Expose `SelectTarget` to be combined with other standard events when binding. 

```ts
import {SelectTarget} from 'mvdom';
import { customElement, onEvent} from 'mvdom-xp';

@customElement('my-component')
class MyComponent{
  @onEvent('click') 
  clicked(evt: MouseEvent & SelectTarget){ 
    evt.selectTarget
  }
}
```

### [v0.8.4](https://github.com/mvdom/mvdom/compare/v0.8.3...v0.8.4) June 20th 2019

- expose `bindHubEvents` `unbindHubEvents` `HubBindings` (useful to build custom web components)
- ! unexpose `bindDOMEvent` (not worthwhile, use bindDOMEvents or off(...))


### [v0.8.3](https://github.com/mvdom/mvdom/compare/v0.8.2...v0.8.3) June 18th 2019

- expose `bindDOMEvents` `bindDOMEvent` `DOMListenerBySelector` (useful to build custom web components)

size: _mvdom.js 34.42K_ | _mvdom.min.js 12.03K_

### [v0.8.2](https://github.com/mvdom/mvdom/compare/v0.8.1...v0.8.2) June 18th 2019

- made ExtendedEvent wider
- export EventInfo
- optimize asNodeArray to return immutable empty array

size: _mvdom.js 34K_ | _mvdom.min.js 11.99K_

### [v0.8.1](https://github.com/mvdom/mvdom/compare/v0.8.0...v0.8.1) June 18th 2019

- Export `ExtendedEvent` as `Event & { detail?: any, selectTarget: HTMLElement }`
  - 0.7.x change - Removed the `& {[key: string]: any}` from `EventExtended` (too wide).

### [v0.8.0](https://github.com/mvdom/mvdom/compare/v0.7.5...v0.8.0) June 18th 2019

- Moved source code to typescript (API preserved)
  - Removed `types/index.d.ts` (not needed anymore, all `.d.ts` are in the `dist/` directory);
- `frag()` or `frag(null)` is valid now, and returns empty `DocumentFragment`.
- `off(el, nsObj: {ns: string})` Now `off` for namespace must take a NsObject (i.e. `{ns: string}`)
- deprecated `asArray`



### [v0.7.5](https://github.com/mvdom/mvdom/compare/v0.7.4...v0.7.5) May 31st 2019

- Added for CHANGELOG.md
- fix #46 events - namespaced undbinding (off) does not work for events bound without selector

size: _mvdom.js 42K_ | _mvdom.min.js 14K_

### [v0.7.4](https://github.com/mvdom/mvdom/compare/v0.7.3...v0.7.4) May 20th 2019

- fix #45 dx - undefined value or undeclared properties always get push to the puller function

### [older releases](https://github.com/mvdom/mvdom/releases)
