## Concept

mvDom is a minimalistic DOM CENTRIC MVC library, which uses the DOM as the foundation for MVC rather than working against it. 

- The DOM is your friend, don't fight it, embrace it. 
- Used right, the DOM can be a great foundation for a simple and scalable MVC model.
- Over componentization is as bad as under componentization.
- Black magic always come with a hidden cost.
- Frameworks come and go, languages and runtimes stay.
- Size is a factor of complexity and starting simple will always scale better.

**Conclusion**: For maximum mileage, start simple and minimalistic, embrace the DOM, add only what is strictly need to have a scalable MVC model, componentize only as needed, understand your runtime, avoid high-abstraction frameworks, favor focused libraries over all-in-one frameworks.

## Characteristics

- Zero dependency, micro libary (< 10kb min, < 5kb gzip).
- Template agnostic (string templating friendly, e.g., Handlebars)
- Dead simple APIs (e.g. d.register(name, controller), d.display(name, parent))
- Async Lifecycle management (hookable)
- Enhanced DOM eventing (i.e., d.on(el, type, selector, fn, {ns}) and off/trigger a la jquery, without wrappers)
- Simple, extensible, and optimized DOM data exchange (`d.push(el, data)` & `var data = d.pull(el)`). 

Coming soon:
- Hookable routing

## Installation
```
npm install mvdom --save
```

## APIs

```js
var d = require('mvdom'); // d is the new $

// --------- View APIs --------- //
// register a view controller (async lifecycle)
d.register("ViewName", {createFn,initFn,postDisplayFn,detachFn}, config); 
// display a view in this DOM element el 
d.display(parentEl, "ViewName"); 
// register a hook at a specific stage (willCreate, didCreate, willInit, ...)
d.hook("willCreate", fn(view){}); 
// --------- /View APIs --------- //

// --------- DOM Event Helpers --------- //
// register a listener for this event type on one or more elements
d.on(els, type, listener);
// register a listener for this type and selector on one or more elements.  
d.on(els, type, selector, listener); 
// register listener with optional namespace or context (this)
d.on(els, type, [selector,] {ns,context});

// unregister a listener
d.off(els, type, [selector,] listener);
// unregister all listeners matching a type and eventual selector. 
d.off(els, type[, selector]);
// unregister all listeners for a given namespace 'ns'
d.off(els, {ns});

// trigger a custom event on a given type by default 
d.trigger(els, "MyCustomEvent", {detail: "cool", cancelable: false});
// --------- DOM Event Helpers --------- //

// --------- DOM Query Shortcuts --------- //
d.all(el, selector); // shortcut for el.querySelectorAll
d.all(selector); // shortcut for document.querySelectorAll

d.first(el, selector); // shortcut for el.querySelector
d.first(selector); // shortcut for document.querySelector
// --------- /DOM Query Shortcuts --------- //
```

