## Roadmap

- **v0.9.x**, winter 2019
  - Move to native web component model from the current custom view model (see [cloud-starter Web UI Architecture &amp; Patterns](https://github.com/BriteSnow/cloud-starter/blob/master/doc/ui.md)).
  - Add the `mvdom-xp` [BaseHTMLElement](https://github.com/mvdom/mvdom-xp/blob/master/src/c-base.ts) base web component class to `mvdom`.
  - Move view related types and methods, e.g., `display(...)` `remove(...)` `empty(...)` and `View` types to `mvdom-legacy` which can be imported on top of `mvdom` 0.9.x for deprecated view methods and types.
  - Might move the `mvdom-xp` typescript decorators `@onEvent, @onDocEvent, @onWinEvent, @onHub` to `mvdom` (or might leave them on `mvdom-xp` as typescript decorators won't be standard, but the standard might take too long)


## releases

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
