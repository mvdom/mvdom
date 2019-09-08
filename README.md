
## Making the DOM Scale. (**< 5kb gzipped**)

`mvdom` is a minimalistic DOM CENTRIC MVC library, which uses the DOM as the foundation for scalable MVC framework rather than working against it.

Fully based on **Native Web Component** (customElements) with a lightweight but powerful `BaseHTMLElement` base class with some simple and highly productive DOM APIs allowing to uparallel productivity to build simple to big Web frontends. \

- < 13kb minimized (**< 5kb gzipped**) and **ZERO dependency**!

- Use the **DOM AS THE Framework**

- **Simple Scale Better**

- **REAL DOM IS BACK!** 

<br />

> **ZERO IE TAX**! MVDOM **targets modern browsers** (chrome, firefox, safari, tablet/mobile safari/chrome, and Chrominium Edge).

> Version 0.9.x fully embraces **Native DOM Custom Element** model -> **The DOM IS the Framework!** 

> **mvdom 0.9.x** is designed to be a strong foundation for simple to big applications and therefore fully embrace TypeScript types and makes a light but expressive use of TypeScript decorators (JS decorator standard is still way off). However, MVDOM use of decorators is very **LIGHT** (just for event binding and custom element registration), and is optional even for those features.

<br />

_**IMPORTANT** Master is now the 0.9.x branch which deprecates legacy View API in favor of browser native web component / custom element APIs. (see [0.8.x to 0.9.x Migration](#Migration-from-0.8.x-to-0.9.x)).


## Hello World

```sh
# Soon to be out of beta
npm install mvdom@0.9.0-beta.2
```

`BaseHTMLElement` is a simple class that extends the browser native `HTMLElement` and provides expressive binding mechanism and lifecycle methods. 

```ts
// main.ts
import { BaseHTMLElement, onEvent } from 'mvdom';

@customElement('hello-world')
class HelloComponent extends BaseHTMLElement{

  get name() { return this.getAttribute('name') || 'World'}

  @onEvent('click', 'strong') // bind a DOM event from this element instance with a selector
  onStrongClick(){
    console.log(`${this.name} has been clicked`);
  }

  // init() - will be called only once at first connectedCallback 
  init(){
    this.innerHTML = `Hello <strong>${this.name}</strong>`;
  }

  // postDisplay() - will be called at the second requestFrameAnimation (after first paint)
  async postDisplay(){
    // some async and UI update/refresh
  }
}

document.body.innerHTML = '<hello-world name="John"></hello-world>';
```


## Full Web Component Fifecycle 


```ts
// full component
import { BaseHTMLElement, onEvent, onDoc, onWin, onHub } from 'mvdom';

@customElement('full-component')
class FullComponent extends BaseHTMLElement{

  //// DOM Event Bindings
  // bind a method to an element DOM event with an optional selector
  @onEvent('click', 'strong') 
  onStrongClick(){
    console.log('World has been clicked');
  }

  // bind a method to an document DOM event with an optional selector
  // Note: will be correctly unbind when this element is removed from the Document
  @onDoc('click', '.logoff')
  onDocumentLogoff(){
    console.log('.logoff element was clicked somewhere in the document');
  }

  // bind a method to an window DOM event
  // Note: will be correctly unbind when this element is removed from the Document
  @onWin('resize')
  onDocumentLogoff(){
    console.log('Window was resized');
  }

  //// Hub Event Bindings
  @onHub('HUB_NAME', 'TOPIC_1', 'LABEL_A')
  onPubSubTopic1LabelAEvent(message: any, info: HubEventInfo){
    console.log(`hub event message: ${message}, for topic: ${info.topic}, label: ${info.label}`);
  }


  //// Lifecyle Methods
  // init() - will be called only once at first connectedCallback 
  init(){
    super.init(); // best practice, call parent
    this.innerHTML = 'Hello <strong>World</strong>'; // good place to set the innerHTML / appendChild
  }

  // preDisplay() - if defined, will be called once before first paint (i.e. first requestAnimationFrame)
  preDisplay(){ 
    console.log('before first paint');
    // Note: This function can be marked async, but the first paint won't wait until resolve. 
    //       More idiomatic to have async in postDisplay
  }

  // postDisplay() - if defined, will be called once after first paint, before second paint (i.e., second requestAnimationFrame)
  async postDisplay(){
    // good place to do some async and UI update/refresh
  }

  // Native custom element method on "remove". 
  disconnectedCallback(){
    super.disconnectedCallback(); // MUST CALL for bindings (i.e., @onDoc, @onWin, @onHub) cleanup
    // other cleanups as needed
  }

  // Native custome element method
  attributeChangedCallback(attrName: string, oldVal: any, newVal: any){
    // Implement when/as needed.
  }


}
```

## Concept 

**Key concept:** `mvdom` is a LIBRARY which promotes modern DOM implementations (e.g., browsers with native web component) to be used as a scalable framework for building small to big Web frontends.

- **Simple scale better**
- The DOM is your friend, don't fight it, embrace it. 
- Used right, the DOM can be an excellent foundation for a scalable and straightforward MVC model.
- Over componentization is as bad as under componentization.
- Black magic always come with a hidden cost.
- Frameworks come and go, languages and runtimes stay.
- Size is a factor of complexity and starting small and simple will always scale better.
- **Patterns over Frameworks**

**In Short**: Embrace the DOM, start simple, minimalistic, add only what is strictly needed to have a scalable MVC model, componentize only as needed, understand your runtime, avoid high-abstraction frameworks, favor focused libraries over all-in-one frameworks.


## Characteristics

- **Zero dependency**, micro libary (< 15kb minimized, < 6kb gzip).
- Template agnostic (string templating friendly, e.g., JS Template Literals, Handlebars, LitHTML)
- Minimalistic BaseHTMLElement which extends the browser native `HTMLElement`
- Dead simple but powerfull DOM Navigation and Manimuplation wrapper APIs (e.g. on, first, all, style, attr, ...)
- Enhanced DOM eventing (i.e., mvdom.on(el, type, selector, fn, {ns}) and off/trigger a la jquery, without wrappers)
- Simple, extensible, and optimized DOM data exchange (`push(el, data)` & `const data = pull(el)`). 
- Minimalistic but powerful pub/sub (hub) with topic and label selectors. 

## Compatibility

- Tested on all modern browsers (Chrome, Safari, Mobile Safari, Firefox, Chrominium Edge)
- NO LEGACY BROWSER SUPPORT: While many frameworks are held in the past as they still support deprecated browsers, MVDOM focuses on using the DOM as the Framework, and targets modern browsers that are now ubiquitous anyway.  


## Installation

```
npm install mvdom@0.9.0-beta.2
```

Typical usage in source file: 

```js
import {first, all, ...} from 'mvdom'
```

## DOM Navigation & Manipulation APIs Overview


```ts
import {on, off, all, first, prev, next, append, frag, attr, style } from 'mvdom';

// --------- DOM Event Helpers --------- //

// NOTE: this is the underlying API, use @on(type, [selector]) when use @customElement Native Web Component

// register a listener for this event type on one or more elements
on(els, types, listener);
// register a listener for this type and selector on one or more elements (with event.selectTarget when selector).  
on(els, types, selector, listener); 
// register listener with optional namespace or ctx (this)
on(els, types, selector, listener, {ns,ctx});

// unregister a listener
off(els, type, [selector,] listener)
// unregister all listeners matching a type and eventual selector. 
off(els, type[, selector])
// unregister all listeners for a given namespace 'ns'
off(els, {ns})

// trigger a custom event on a given type by default 
trigger(els, "MyCustomEvent", {detail: "cool", cancelable: false});
// --------- DOM Event Helpers --------- //

// --------- DOM Query Shortcuts --------- //
const els = all(el, selector); // shortcut for el.querySelectorAll but HTMLElement[]
const els = all(selector); // shortcut for document.querySelectorAll from document

const el = first(el, selector); // shortcut for el.querySelector
const el = first(selector); // shortcut for document.querySelector from document
const el = first(el); // find firstElementChild (even for fragment for browsers that do not support it)

const el = next(el[, selector]); // shortcut to find the next sibling element matching an optional selector
const el = prev(el[, selector]); // shortcut to find the previous sibling element matching an optional selector
// --------- /DOM Query Shortcuts --------- //

// --------- DOM Helpers --------- //
// Append child, refEl interpreted as parnt
const newEl = append(refEl, newEl); // standard refEl.appendChild(newEl)
const newEl = append(refEl, newEl, "first"); // Insert newEl as first element of refEl.
const newEl = append(refEl, newEl, "last"); // Here for symmetry, refEl.appendChild(newEl)
const newEl = append(refEl, newEl, "empty"); // Will empty refEl before .appendChildrefEl.appendChild(newEL)

// Append sibling, refEl interpreted as sibling
const newEl = append(refEl, newEl, "after"); // Append newEl after the refEl, use appendChild if no next sibling
const newEl = append(refEl, newEl, "before"); // Here for symmetry, refEl.parentNode.insertBefore(newEl, refEl)

const frag = frag("<div>any</div><td>html</td>"); // Create document fragment (use 'template' with fallback )
// --------- /DOM Helpers --------- //

```

## Pub / Sub APIs overview
```ts
import { hub } from 'mvdom';

// --------- Hub (pub/sub) --------- //
const myHub = hub("myHub"); // create a new named hub, and returns the named hub. 

myHub.sub(topics, [labels,] handler[, opts]); // subscribe

myHub.pub(topic, [label,] data); // publish

myHub.unsub(opts.ns); // unsubscribe
// --------- /Hub (pub/sub) --------- //
```


## Dom Data eXchange (push/pull)

`mvdom.push` and `mvdom.pull` provides a simple and extensible way to extract or inject data from and to a DOM subtree. 

```ts
push(el, [selector,] data); // will set the data.property to the matching selector (default ".dx") elements
const data = pull(el[, selector]); // will extract the data from the matching elements (default selector ".dx")

// register custom pushers / pullers (default ones are for html form elements and simple div innerHTML)
pusher(selector, pusherFn(value){this /* dom element*/}); // pusher function set a value to a matching element
puller(selector, pullerFn(){this /* dom element*/}); // puller function returns the value from a matching element 
```

#### `mvdom.push(el, [selector,] data);` 
Will inject data  to the matching selector (default ".dx") elements. By default, selector is ".dx". 

#### `mvdom.pull(el[, selector]);` 
Will extract the data from the matching elements (default selector ".dx")


##### Example

```html
<div id="myEl">
  <fieldset>
    <input class="dx" name="firstName" value="Mike">
    <input class="dx" name="lastName" value="Donavan">
  </fieldset>
  <div>
    <div class="dx dx-address-street">123 Main Street</div>
    <div class="dx" data-dx="address.city">San Francisco</div>
  </div>
</div>
```

```ts
import {first, push, pull} from 'mvdom';


const myEl = first("#myEl"); // or document.getElementById

// Extract the data from the element. 
//   Will first do a ".dx" select, and for each element extract the property path and value from the element.
const data = pull(myEl); 
// data: {firstName: "Mike", lastName: "Donavan", 
//        address: {street: "123 Main Street", city: "San Francisco"}}

// Update the DOM with some data
const updateData = {address: {street: "124 Second Street"}};
push(myEl, updateData)
```


##### More Info (internals)

`mvdom.push` and `mvdom.pull` work on a four-step flow:

1) First, the selector is used to select all of the dom element candidates for value extraction or injection. By default, we use the `".dx"` class selector, as the class selection is much faster than any other attributes. A custom selector can be provided.
2) Second, for each element candidate, mvdom extract the property path from the element, `name` attribute, or class name with the `dx-` prefix ('-' be translate to '.'), or with the html attribute `data-dx`. (see example above for an example of each).
3) Third, it looks default and registered for the appropriate pusher or puller function to inject or extract the value. Default pushers/pullers support html form elements (input, textarea, checkbox, radio) and basic innerHTML set and get, but custom ones can be registered (and will take precedence) by specifying the element matching selector. 
    + `d.pusher(selector, pusherFun(value){this /* dom element*/});` Register pusher function set a value to a matching dom element
    + `d.puller(selector, pullerFun(){this /* dom element*/});` Register puller function returns the value from a matching dom 
4) Fourth, it set the value to the appropriate property path (support nested properties as shown above)


## Hub (pub/sub)

```js
import { hub } from 'mvdom';

// get (create if necessary) a hub instance with unique name "myHub"
const myHub = hub("myHub");

// Subcribe to a topic
// sub(topic,[labels,] handlerFunction, namespace)
myHub.sub("Task",function(data, info){
    console.log("topic: ", info.topic, ", label: ", info.label, ", data: ", data);
},{ns:"namespace"});

// pub(topic, [label,] data)
const newTask = {id: 123, title: "A first task"};
myHub.pub("Task", "create", newTask);
// will print: 'topic: Task,label: create, data: {id: 123, title: "A first task"}'

// or can subscribe only to the create label (here info.label will always be "create")
myHub.sub("Task", "create", function(data, info){...});

// unsubscribe
myHub.unsub(ns); // if no namespace provided, the ns will be the function, and used as Key

// Multiple labels, with common namespace
myHub.sub("Task", "create, delete", function(data){...}, "ns1");
myHub.sub("Project", function(data){...}, "ns1");

// Then, to remove all subscription with ns1
myHub.unsub("ns1");

const obj = {name: "myObject"};

myHub.sub("Project", function(data){
    this.name; // "myObject"
}, {ns:"ns1", ctx: obj});


```


## Building

This library uses a gulp-and-webpack-free way of building distribution file, and requires node.js >= 8.0.0.

- `npm run build` to generate the distrubtion files: `dist/mvdom.js` `dist/mvdom.js.map` and `dist/mvdom.min.js`
- `npm run watch` for repl development which will automatically recompile the distribution files on any src js change.


[changlogs](CHANGELOG.md)

## Migration from 0.8.x to 0.9.x 

The wide browser support Native Custom Element / Web Component warrant some API refactoring rather than just contorting old APIs. 

Consequently, mvdom 0.9.x deprecates the View APIs in favor of native Browsers' native custom element APIs. Other mvdom APIs (first, all, hub, push, pull ...) remained unchanged. A `mvdom-compat-view` library will be provided that will run on the latest `0.9.x` while still exposing most of the legacy APIs / types.


In short, the 0.8.x to 0.9.x

- The MVDOM "View" model and APIs (.e.g, `display` `remove` ...) known in version <= 0.8.x are being completely deprecated in favor of browser custom elements. 
- The future library `mvdom-compat-view` will include mvdom > 0.9.x as well as expose those legacy APIs and types for applications needed to use the latest mvdom > 0.9.x while still have the legacy view apis. 
- `mvdom`  also rename/remove the following **types** for consistency reasons (they will still be available via `mvdom-compat-view`)
  - **OnEventOptions**: `EventOptions` is renamed to `OnEventOptions` to be consistent with native binding event type convention. 
  - **CustomEventInit**: Use the lib.dom.d.ts `CustomEventInit` rather than the removed `EventInfo` type. 
  - **OnEventListener**: `ExtendedDOMEventListener` is renamed to `OnEventListener`, and simalarely `DOMListenerBySelector` got renamed to `OnListenerBySelector`
  - **bindOnEvent**: `bindDOMEvents` is rename `binOnEvents`


To keep using 0.8.x, see the [0.8.x branch](https://github.com/mvdom/mvdom/tree/v_08x).