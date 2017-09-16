
## Making the DOM Scale.

**`mvdom` is a minimalistic DOM CENTRIC MVC library, which uses the DOM as the foundation for MVC rather than working against it.**

## Hello World (es2015)

```js
// main.js
import { display } from 'mvdom';

class HelloWorld {
  create(data){
    return `<div class='HelloWorld'>Hello ${data.name}</div>`;
  }
}

display(new HelloWorld(), "body", {name: "John"});
```

Seems too simple, but fully async, DOM binding/unbinding, pub/sub, dom push/pull, and more, all for **14kb min and ZERO depedency (beside the DOM)**!


## Example (es2015)

```js
// FirstView.js
class FirstView{
  create(data){ // return string, DOMElement, or DocumentFragment (or promise resolving into those)
    return `<div class='FirstView'>My First View, data: ${data}</div>`
  }
}
```

```js
// main.js
import { display, first, hub } from 'mvdom';
import { FirstView } from './FirstView';

class MainView{

  constructor(){
    this.events = { // dom event binds to view.el, with optional selector
      "click; .MainView > header": () => {
        console.log("header clicked");
      }
    }

    this.winEvents = { // will safely be un-bound on remove (use mvdom.remove or mvdom.empty on parents)
      "resize": () => {
        console.log("Window is resizing")
      }
    }

    this.hubEvents = { // pub/sub with hub. This view will unsubcribe to this hub on remove.
      "presenceHub; change": (isPresent) => {
        console.log(`User is ${isPresent?'':'NOT '}present`);
      }
    }
  }

  create(data){ // return string, DOMElement, or DocumentFragment (or promise resolving into those)
    return `<div class='MainView'>
      <header>${data.header}</header>
      <section class='content'></section>
    </div>`
  }

  postDisplay(data){ // will be called once the MainView div is added (next tick)
    // display by constructor function
    display(data.contentViewClass, first(this.el, 'content'), data.contentData);
  }
}

// display by instance
display(new MainView(), "body", {header: "My First Main View", contentViewClass: OtherView, contentData: "Hello from main view"})
  .then(function(view){
    console.log(`view ${view.name} with unique instance id ${view.id} has been created, init, added to the dom, and postDisplay has been run`);

    // just for this example, after 3 seconds, assume the user is not present
    setTimeout(function(){
      hub("presenceHub").pub("change", false);
    }, 3000)
  });
```

## Concept 

**Key concept:** `ComponentView !== ComponentElement`, use mvdom for composite views (the big ones), regular DOM for component elements with native DOM event model for components intercomunications. Event based architecture always scale better, and the DOM has one for us.

- The DOM is your friend, don't fight it, embrace it. 
- Used right, the DOM can be a great foundation for a simple and scalable MVC model.
- Over componentization is as bad as under componentization.
- Black magic always come with a hidden cost.
- Frameworks come and go, languages and runtimes stay.
- Size is a factor of complexity and starting small and simple will always scale better.
- **Patterns over Frameworks**

**In Short**: Embrace the DOM, start simple, minimalistic, add only what is strictly needed to have a scalable MVC model, componentize only as needed, understand your runtime, avoid high-abstraction frameworks, favor focused libraries over all-in-one frameworks.


## Characteristics

- **Zero dependency**, micro libary (< 15kb minimized, < 6kb gzip).
- Template agnostic (string templating friendly, e.g., Handlebars)
- Dead simple APIs (e.g. display(view, parent), hub, on, first, all, ...)
- Async and Hookable Lifecycle management
- Enhanced DOM eventing (i.e., d.on(el, type, selector, fn, {ns}) and off/trigger a la jquery, without wrappers)
- Simple, extensible, and optimized DOM data exchange (`push(el, data)` & `var data = pull(el)`). 
- Minimalistic but powerful pub/sub (hub) with topic and label selectors. 

## Compatibility

- Written and tested on all modern browsers (Chrome, Safari, Mobile Safari, Firefox, Edge)
- Requires Promise, Array.forEach (for IE11, can be polyfill with https://polyfill.io or core.js)
- Using javascript syntax compatible with IE9+ (no transpilling needed)


## Installation

```
npm install mvdom
```

Typical usage in source file: 

```js
import {display, first, all, ...} from 'mvdom'
```

or if still in common js

```js
// common js way
var mvdom = require("mvdom");

mvdom.display ...
```

> Note 1: While mvdom is written in pure js, it does provide typescript types. See [Typescript and/or Intellisense Support](#Type-Support)


See [building](#building) to build the distribution manually. 

## API Overview

```js
// --------- View APIs --------- //
// display a view in this DOM element el 
mvdom.display(viewInstance, parentEl [, data,  config]); 
mvdom.display(viewConstructor, parentEl [, data,  config]); 

// register a hook at a specific stage (willCreate, didCreate, willInit, ...)
mvdom.hook("willCreate", fn(view){}); 

mvdom.empty(el); // will empty all children of an element, and also "destroy" the eventual views
mvdom.remove(el); // will remove this element, and also "destroy" the eventual attached view and the sub views

// register a view controller (async lifecycle)
mvdom.register("ViewName", {create,init,postDisplay,destroy}[, config])
mvdom.register(ViewConstructor, [, config]); 
mvdom.display("ViewName", parentEl [, config]); 
// --------- /View APIs --------- //

// --------- DOM Event Helpers --------- //
// register a listener for this event type on one or more elements
mvdom.on(els, types, listener);
// register a listener for this type and selector on one or more elements (with event.selectTarget when selector).  
mvdom.on(els, types, selector, listener); 
// register listener with optional namespace or ctx (this)
mvdom.on(els, types, selector, listener, {ns,ctx});

// unregister a listener
mvdom.off(els, type, [selector,] listener)
// unregister all listeners matching a type and eventual selector. 
mvdom.off(els, type[, selector])
// unregister all listeners for a given namespace 'ns'
mvdom.off(els, {ns})

// trigger a custom event on a given type by default 
mvdom.trigger(els, "MyCustomEvent", {detail: "cool", cancelable: false});
// --------- DOM Event Helpers --------- //

// --------- DOM Query Shortcuts --------- //
var nodeList = mvdom.all(el, selector); // shortcut for el.querySelectorAll
var nodeList = mvdom.all(selector); // shortcut for document.querySelectorAll from document

var element = mvdom.first(el, selector); // shortcut for el.querySelector
var element = mvdom.first(selector); // shortcut for document.querySelector from document
var element = mvdom.first(el); // find firstElementChild (even for fragment for browsers that do not support it)

var element = mvdom.next(el[, selector]); // shortcut to find the next sibling element matching an optional selector
var element = mvdom.prev(el[, selector]); // shortcut to find the previous sibling element matching an optional selector
// --------- /DOM Query Shortcuts --------- //

// --------- DOM Helpers --------- //
// Append child, refEl interpreted as parnt
var newEl = mvdom.append(refEl, newEl); // standard refEl.appendChild(newEl)
var newEl = mvdom.append(refEl, newEl, "first"); // Insert newEl as first element of refEl.
var newEl = mvdom.append(refEl, newEl, "last"); // Here for symmetry, refEl.appendChild(newEl)
var newEl = mvdom.append(refEl, newEl, "empty"); // Will empty refEl before .appendChildrefEl.appendChild(newEL)

// Append sibling, refEl interpreted as sibling
var newEl = mvdom.append(refEl, newEl, "after"); // Append newEl after the refEl, use appendChild if no next sibling
var newEl = mvdom.append(refEl, newEl, "before"); // Here for symmetry, refEl.parentNode.insertBefore(newEl, refEl)

var frag = mvdom.frag("<div>any</div><td>html</td>"); // Create document fragment (use 'template' with fallback )
// --------- /DOM Helpers --------- //

// --------- DOM Data eXchange (dx) push/pull --------- //
mvdom.push(el, [selector,] data); // will set the data.property to the matching selector (default ".dx") elements
var data = mvdom.pull(el[, selector]); // will extract the data from the matching elements (default selector ".dx")

// register custom pushers / pullers (default ones are for html form elements and simple div innerHTML)
mvdom.pusher(selector, pusherFn(value){this /* dom element*/}); // pusher function set a value to a matching element
mvdom.puller(selector, pullerFn(){this /* dom element*/}); // puller function returns the value from a matching element 
// --------- /DOM Data eXchange (dx) push/pull --------- //

// --------- Hub (pub/sub) --------- //
var myHub = mvdom.hub("myHub"); // create a new named hub, and returns the named hub. 

myHub.sub(topics, [labels,] handler[, opts]); // subscribe

myHub.pub(topic, [label,] data); // publish

myHub.unsub(opts.ns); // unsubscribe
// --------- /Hub (pub/sub) --------- //
```

For full API spec, see [Typescript index.d.ts](types/index.d.ts)


## View Display

#### `mvdom.display(viewInstance, refEl: string | HTMLElement, data?: any, config?: {append}])`
```js
import { display } from 'mvdom';

class MyView{
  create(data){ // return string, DOMElement, or DocumentFragment (or promise resolving into those)
    return `<div class='MyView'>${data.title}</div>`
  }
}

// display by instance
display(new MyView(), "body", {title: "My First View"})
```

#### `mvdom.display(viewConstructorFunction, refEl: string | HTMLElement, data?: any, config?: {append}])`

```js
display(MyView, "body", {title: "My First View"})
```

#### `mvdom.display(viewName, refEl, [data, config])`

Display a view by name `mvdom.display` (view definition must have been registered beforehand) for example: 

```js
// mvdom.display(viewName, refEl, data)
display("MainView", mvdom.first("body"), {message:"hello from mvdom"});
// Note: mvdom.first is just a shortcut to document.querySelector
```

## View Register

Note: Register is only require when display by name is needed than display by function constructor or instance

#### `mvdom.register(viewName, archetype [, config])`

Register a new view "archetype" (i.e js object that will be clone for each instantiation) by name `mvdom.register`. The "controller" part of a view definition, see below, will be called during the lifecycle of the view ( everything is asynchronous based). The only required method is `.create([data, config])` which is reponsible to return the HTML.

```js

// register a view archetype
mvdom.register("MainView",{
    // Returns a HTML String, Document Element, or Document Fragment
    // Can return a Promise that resolve in one of those three object time
    // Must be one Dome Element
    create: function(data, config){
        return `<div class='MainView'>
                  <div class=".but">${data.message}</div>
                </div>`;
    }, 

    // (optional) init() will be called after the component element is created
    // but before it is added to the screen (i.e. added to the parent)
    init: function(data, config){
        var view = this; // best practice
        view.el; // this is the top parent element created for this view
        // if return a Promise, the flow will wait until the promise is resolved
    }, 

    // (optional) postDisplay() will be called after the component element is added to the dom
    // and in another event (used a setTimeout 0). 
    // Best Practice: This is a good place to add bindings that are not related to UI layout, or need to be done
    // after the component is displayed
    postDisplay: function(data, config){
        // some non UI layout related, or actions that need to be performed after the component is displaye

        // if return a promise, the mvdom.display(...).then will resolve when the return promise will be resolve. 
        // however, the mvdom.display(...) promise resolution will always be this view, regardless of the object or promise returns by this function.
    }, 

    // (optional) will be called when this view is deleted (from d.remove or d.empty on a parent)
    // will be called after the view.el is removed from parent.
    // info: {parentEl} Simple js object containing the parentEl property.
    destroy: function(info){
        
    }

    // (optional) events: {eventSelector: handlerFunction} | 
    //                    {eventSelector: handlerFunction}[]
    // 
    // Can be an array of eventBinding as well
    events: {
        "click; .but": function(evt){
            var view = this; // this is the view
            console.log("click on .but", evt, view);
        }
    }, 

    // (optional) same format as above, but bind on document 
    // - support array of bindings as well)
    // - will unbind on destroy when calling d.remove on this element or parents or d.empty on any parent
    docEvents: {
        "click; .do-logoff": function(evt){
            var view = this;            
        }
    }, 

    // (optional) same as docEvents but on window object. 
    winEvents: {
        "resize": function(evt){
            // do something when window is resize
        }
    }, 

    // (optional) subscribe to a hub by hub name, topic(s), and optional label(s)
    // - support array of bindings as well.
    hubEvents: {
        dataServiceHub: {
            // subscribe on the dataServiceHub on the topic Task and any labels "create" "update" or "delete"
            "Task; create, update, delete": function(data, info){
                var view = this; // the this is this view object
                console.log("Task has been " + info.label + "d");
                // if d.hub("dataServiceHub").pub("Task","create",taskEntity)
                // this will print "Task has been created"
            }
        }, 
        // also support flat notation
        "dataServiceHub; Task; create, update, delete": function(){
           // same binding as above
        }
    }

})
```

#### `mvdom.register(viewConstructorFunction [, config])`

Can also register a constructorFunction, and the `constructorFunction.name` will become the name of this registered view definition. 

```js
import { register } from 'mvdom';
class MyView{
  create(data){ // return string, DOMElement, or DocumentFragment (or promise resolving into those)
    return `<div class='MyView'>${data.title}</div>`
  }
}

register(MyView, {append: first});
```


## View Config

The optional mvdom view `config` argument allow to customize the way the view is handled. It can be set at the registration phase, as well as overriden for each display. For now, it is a single property config, `.append`, which tells how to add the new view.el to the DOM.

- append: ("last", "first", "before", "empty", "after"). 
    + **"last"**: The __refEl__ is interpreted as the parent, and the append will use `refEl.appendChild(view.el)`
    + **"first"**: The __refEl__ is interpreted as the parent, and the append will use the `.insertBefore` the `.firstChild` of the __refEl__. If no firstElement, then, will do a normal appendChild.
    + **"empty"**: The __refEl__ is interpreted as the parent, first, `mvdom.empty(refEl)` is called and then `refEl.appendChild(view.el)`.
    + **"before"**: The __refEl__ is interepreted as a sibling, and the append will use the `.insertBefore` the __refEl__.
    + **"after"**: The __refEl__ is interepreted as a sibling, and we `.insertBefore` the next sibling of the __refEl__. If the next sibling is null, use the `refEl.parentNode.appendChild(view.el)` to add it last.

By default, the `config.append = "last"` which means the refEl will be the parent and the view element will be added at the end (using `refEl.appendChild(view.el)`)

If no data, but config, pass null like `mvdom.display("MainView", parentEl, null, {append:"first"})`

In the context of `mvdom.display`, `config` can be a string, and in this case it will be interpreted as the `append` property. So the line above is equivalent to `mvdom.display("MainView", parentEl, null, "first")`.


## Dom Event Binding

#### `mvdom.on([el,] eventType, [selector,] eventHander(evt){}[, opts])`

Bind a eventHandler to a dom element(s) for an event type and optional selector. It also support name spacing, and custom context at binding time (i.e. the "this" of the eventHandler) 

- el: (optional) (default document) The base document element to bind the event to. Can also be an array or nodeList of element. 
- eventType: (required) Multiple are supported with "," (e.g., "webkitTransitionEnd, transitionend")
- selector: (optional) HTML5 selector, if set, only target matching this selector will trigger the eventHandler
- eventHandler: (required) The event hander. "this" can be configured via `opts.ctx`
- opts: (optional)
    + ctx: eventHandler context (i.e. this)
    + ns: Binding namespace

Note: Similar to jquery.on, except that the event object (evt) are the native ones, and that the selector are plain HTML5 selectors. 

###### Examples

```html
<div class="item">
   <div class="sub-item">text</div>
</div>
```


```js
var baseEl = document;
mvdom.on(document, "click", ".item", function(evt){
  evt.target; // can be the .sub-item or .item depending where the click occurs
  evt.currentTarget; // baseEl or document if not specified
  evt.selectTarget; // will always be .item element (even when .sub-item get clicked)
});
```

Note: `.selectTarget` is only set when we have a selector.

Multi events bind can be done with ","

```js
mvdom.on(someEl, "webkitTransitionEnd, transitionend", ...)
```

#### `mvdom.off(els, [type, selector, listener][, opts])`

Unbind event binding that have been bound by `mvdom.on`. 

- `.off(els)` Unbind all bindings added via .on
- `.off(els, type)` Unbind all bindings of type added via .on
- `.off(els, type, selector)` Unbind all bindings of type and selector added via .on
- `.off(els, type, selector, listener)` Unbind all bindings of this type, selector, and listener
- `.off(els,{ns})` Unbind all bindings from the namespace ns (recommended).

## Dom Data eXchange (push/pull)

`mvdom.push` and `mvdom.pull` provides a simple and extensible way to extract or inject data from and to a DOM sub tree. 

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

```js
var myEl = mvdom.first("#myEl"); // or document.getElementById

// Extract the data from the element. 
//   Will first do a ".dx" select, and for each element extract the property path and value from the element.
var data = mvdom.pull(myEl); 
// data: {firstName: "Mike", lastName: "Donavan", 
//        address: {street: "123 Main Street", city: "San Francisco"}}

// Update the DOM with some data
var updateData = {address: {street: "124 Second Street"}};
mvdom.push(myEl, updateData)
```


##### More Info (internals)

`mvdom.push` and `mvdom.pull` work on a four step flow:

1) First, the selector is used to select all of the dom element candidates for value extraction or injection. By default, we use the `".dx"` class selector, as class selection is much faster than any other attributes. Custom selector can be provided.
2) Second, for each element candidate, mvdom extract the property path from the element, `name` attribute, or class name with the `dx-` prefix ('-' be translate to '.'), or with the html attribute `data-dx`. (see example above for an example of each).
3) Third, it looks default and registered for the appropriate pusher or puller function to inject or extract the value. Default pushers/pullers support html form elements (input, textarea, checkbox, radio) and basic innerHTML set and get, but custom ones can be registered (and will take precedence) by specifying the element matching selector. 
    + `d.pusher(selector, pusherFun(value){this /* dom element*/});` Register pusher function set a value to a matching dom element
    + `d.puller(selector, pullerFun(){this /* dom element*/});` Register puller function returns the value from a matching dom 
4) Fourth, it set the value to the appropriate property path (support nested properties as shown above)


## Hub (pub/sub)

```js
import { hub } from 'mvdom';

// get (create if necessary) a hub instance with unique name "myHub"
var myHub = hub("myHub");

// Subcribe to a topic
// sub(topic,[labels,] handlerFunction, namespace)
myHub.sub("Task",function(data, info){
    console.log("topic: ", info.topic, ", label: ", info.label, ", data: ", data);
},{ns:"namespace"});

// pub(topic, [label,] data)
var newTask = {id: 123, title: "A first task"};
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

var obj = {name: "myObject"};

myHub.sub("Project", function(data){
    this.name; // "myObject"
}, {ns:"ns1", ctx: obj});


```


## Building

This library uses a gulp-and-webpack-free way of building distribution file, and requires node.js >= 8.0.0.

- `npm run build` to generate the distrubtion files: `dist/mvdom.js` `dist/mvdom.js.map` and `dist/mvdom.min.js`
- `npm run watch` for repl development which will automatically recompile the distribution files on any src js change.


## Type Support

While `mvdom` is written in pure JS, it does provide typescript types for typescript, flow, and intellisense supports. See `types/` folder. 

#### In a TypeScript project. 

```ts
import { display, remove, View } from "mvdom";

class MyView implements View{
  id: string; // will be set by mvdom (will be unique)
  name: string; // will be set as well (will be MyView)
  el?: HTMLElement; // will be set by mvdom

  create(){
    return `<div>My First mvdom View <span class="but">click to remove me</span></div>`;
  }, 

  events = {
    "click; .but": () => {
      console.log("This button has been clicked");
      mvdom.remove(this.el); // this will remove the div and unbind
    }
  }
}

display(MyView, "body");
```




