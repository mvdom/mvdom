
## Making the DOM Scale.

`mvdom` is a minimalistic DOM CENTRIC MVC library, which uses the DOM as the foundation for scalable MVC rather than working against it.

Fully **async view lifecycle**, simple but powerful **View DOM binding/unbinding**, dom push/pull, **pub/sub**, and more, all for < 15kb minimized (**< 7kb gzipped**) and **ZERO dependency**!

- **Simple Scale Better**.

- **Small is a statement of simplicity**.

- **Embrace the DOM, Don't Fight it**.

- **REAL DOM IS BACK!** 

- Embrace **Native Web Components** in your **MVDOM Views**.

<br />

> **No IE11 tax**! MVDOM **targets modern browsers** (chrome, firefox, safari, tablet/mobile safari/chrome, and Edge).

> Version 0.8.0 source as been upgraded to TypeScript (more accurate typing)

> Version 0.7.0 removed the deprecated `mvdom.register` and simplified the `mvdom.display` to `mvdom.display(instance, refElement, config | appendString)` (doc below updated). _"Keep It Simple"_ is about continuous simplification._


## Hello World

```js
// main.js

import { display } from 'mvdom';

class HelloView {
  constructor(userName){
    this.userName = userName;
  }
  create(opts){
    return `<div class='HelloView'>
      <h1>Hello ${this.userName}. Here your todos:<h2>
      <todo-list></todo-list>
    </div>`;
  }
}

display(new HelloWorld('John'), 'body'); // by default will append last ('last') to body

// or to empty the parent (here 'body') container 
display(new HelloWorld('John'), 'body', 'empty'); 

```


## Example 

```js
// SubView.js

class SubView{
  create(){ // return string, DOMElement, or DocumentFragment (or promise resolving into any of those)
    return `<div class='SubView'>My Sub View</div>`; // here just a best practice, css class name == js class name
  }
}
```

```js
// main.js

import { display, first, hub } from 'mvdom';
import { SubView } from './SubView';

class MainView{

  constructor(data){
    this.header = (data && data.header) ? data.header : 'No Header';

    this.events = { // bind dom events to view.el (i.e., .MainView), with optional selector (using event bubling)
      'click; .MainView > header': () => {
        console.log("header clicked");
      }
    }

    this.winEvents = { // bind dome events to dinwo, with optional selector (will unbind on remove)
      'resize': () => {
        console.log('Window is resizing')
      }
    }

    this.hubEvents = { // subscribe to a hub/topic[/label] message (will unsubscribe on remove)
      'presenceHub; change': (isPresent) => {
        console.log(`User is ${isPresent?'':'NOT '}present`);
      }
    }
  }

  create(){ // (required) must return string, DOMElement, or DocumentFragment (or a Promise resolving into one of those)
    return `<div class="MainView">
      <header>${this.header}</header>
      <section class="content"></section>
    </div>`
  }

  init(){ // (optional) called whe this.el, this.name and this.id has been set, but before it is added in the DOM. 
    this.el; // manipulate the this.el before it get added,
    // Can return a promise if some async work are needed to be done before adding to DOM
  }

  postDisplay(){ // (optional) called after the view.el is added to the dom (in the next event loop)
    // Good place to do non UI post work, or loading/displaying async sub views.
    display(new SubView(), first(this.el, 'content'), 'empty');
  }

  destroy(){ // (optinal) will be called in case cleanup are needed.
    // Note: the eventual winEvents, docEvents, and hubEvents, bindings will be unbound by mvdom (assuming mvdom.remove or mvdom.empty was called on their respective parent),
    //       no need to unbind them.
  }
}

// display by instance
var p = display(new MainView({header: 'My First Main View'}), 'body', 'empty'); // "empty" will empty the body before adding the MainView (default is 'append', can be 'first' to append first)

// display returns a promise that is resolved with the view created and displayed, after postDisplay is performed. 
p.then(function(view){
  console.log(`view ${view.name} with unique instance id ${view.id} has been created, 
                initialized, added to the dom`);

  // just for this example, after 3 seconds, assume the user is not present
  setTimeout(function(){
    hub("presenceHub").pub("change", false);
  }, 3000)
});
```

## Concept 

**Key concept:** `ComponentView !== ComponentElement`, use mvdom for composite views (the big ones), regular DOM for component elements with native DOM event model for components intercommunications. Event-based architecture always scale better, and the DOM has one for us.

- The DOM is your friend, don't fight it, embrace it. 
- Used right, the DOM can be an excellent foundation for a scalable and straightforward MVC model.
- Over componentization is as bad as under componentization.
- Black magic always come with a hidden cost.
- Frameworks come and go, languages and runtimes stay.
- Size is a factor of complexity and starting small and simple will always scale better.
- **Patterns over Frameworks**
- **Simple scale better**

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

- Syntactically `es5` written (works on IE11 without transpiling)
- Tested on all modern browsers (Chrome, Safari, Mobile Safari, Firefox, Edge)
- IE11 - Requires Promise, Array.forEach (for IE11, can be polyfill with https://polyfill.io or core.js)


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

> **Note:** While mvdom is written in pure js, it does provide typescript types. See Typescript [types/index.d.ts](types/index.d.ts) declaration file. 


See [building](#building) to build the distribution manually. 

## API Overview

See [types/index.d.ts](types/index.d.ts) for full API definition.

```js
// --------- View APIs --------- //
// display a view in this DOM element el 
mvdom.display(viewInstance, parentEl [, config]); 

// register a hook at a specific stage for all views (willCreate, didCreate, willInit, ...)
mvdom.hook("willCreate", fn(view){}); 

mvdom.empty(el); // will empty all children of an element, and also "destroy" the eventual views
mvdom.remove(el); // will remove this element, and also "destroy" the eventual attached view and the sub views


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

#### `mvdom.display(viewInstance, refEl: string | HTMLElement, config?: string | Config)`
```js
import { display } from 'mvdom';

class MyView{
  constructor(title){
    this.title = title;
  }
  create(){ // return string, DOMElement, or DocumentFragment (or promise resolving into those)
    return `<div class='MyView'>${this.title}</div>`
  }
}

// display by instance
display(new MyView('My First View'), 'body')
```

#### View Example

```js
class MyView{
  constructor(data){
    this.data = data;

    // (optional) events: {eventSelector: handlerFunction} | 
    //                    {eventSelector: handlerFunction}[]
    // 
    // Can be an array of eventBinding as well
    this.events = {
        "click; .but": function(evt){
            var view = this; // this is the view
            console.log("click on .but", evt, view);
        }
    }

    // (optional) same format as above, but bind on document. Will be automatically unbound on view destroy.
    // - support array of bindings as well)
    // - will unbind on destroy when calling d.remove on this element or parents or d.empty on any parent
    this.docEvents = {
        "click; .do-logoff": function(evt){
            var view = this;            
        }
    }

    // (optional) same as docEvents but on window object. Will be automatically unbound on view destroy.
    this.winEvents = {
        "resize": function(evt){
            // do something when window is resize
        }
    }

    // (optional) allows to bind to select parent elements, and still have the sub selector capabilities. Will be automatically unbound on view destroy (if the elements still exist)
    this.closestEvents =  { 
      '.container; click': function(evt){}, // this will look for the closest ".conatiner" and bind the click event on it. 
      
      '.container; click; .button.add': function(evt){}, // this will binding to the closest ".container" and tricker only when the target element match ".button.add" (sub selector as event binding).

      '.container': { // closest selectors can be grouped in one object
          'click; .button.add': function(evt){} // same as above 
      }
    }

    // (optional) subscribe to a hub by hub name, topic(s), and optional label(s)
    // - support array of bindings as well.
    this.hubEvents = {
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
  }

  // Returns a HTML String, Document Element, or Document Fragment
  // Can return a Promise that resolve in one of those three object time
  // Must be one Dome Element
  create(){
      return `<div class='MainView'>
                <div class=".but">${data.message}</div>
              </div>`;
  }, 

  // (optional) init() will be called after the component element is created
  // but before it is added to the screen (i.e. added to the parent)
  init(){
      var view = this; // best practice
      view.el; // this is the top parent element created for this view
      // if return a Promise, the flow will wait until the promise is resolved
  }, 

  // (optional) postDisplay() will be called after the component element is added to the dom
  // and in another event (used a setTimeout 0). 
  // Best Practice: This is a good place to add bindings that are not related to UI layout, or need to be done
  // after the component is displayed
  postDisplay(){
      // some non UI layout related, or actions that need to be performed after the component is displaye

      // if return a promise, the mvdom.display(...).then will resolve when the return promise will be resolve. 
      // however, the mvdom.display(...) promise resolution will always be this view, regardless of the object or promise returns by this function.
  }, 

  // (optional) will be called when this view is deleted (from d.remove or d.empty on a parent)
  // will be called after the view.el is removed from parent.
  // info: {parentEl} Simple js object containing the parentEl property.
  destroy(info){
  }
}
```


## View Config

The optional mvdom view `config` argument allows to customize the way the view is handled. It can be set at the registration phase, as well as overridden for each display. For now, it is a single property config, `.append`, which tells how to add the new view.el to the DOM.

- append: ("last", "first", "before", "empty", "after"). 
    + **"last"**: The __refEl__ is interpreted as the parent, and the append will use `refEl.appendChild(view.el)`
    + **"first"**: The __refEl__ is interpreted as the parent, and the append will use the `.insertBefore` the `.firstChild` of the __refEl__. If no firstElement, then, will do a normal appendChild.
    + **"empty"**: The __refEl__ is interpreted as the parent, first, `mvdom.empty(refEl)` is called and then `refEl.appendChild(view.el)`.
    + **"before"**: The __refEl__ is interepreted as a sibling, and the append will use the `.insertBefore` the __refEl__.
    + **"after"**: The __refEl__ is interepreted as a sibling, and we `.insertBefore` the next sibling of the __refEl__. If the next sibling is null, use the `refEl.parentNode.appendChild(view.el)` to add it last.

By default, the `config.append = "last"` which means the refEl will be the parent and the view element will be added at the end (using `refEl.appendChild(view.el)`)

In the context of `mvdom.display`, `config` can be a string, and in this case it will be interpreted as the `append` property. So the line above is equivalent to `mvdom.display("MainView", parentEl, "first")`.


## Dom Event Binding

#### `mvdom.on([el,] eventType, [selector,] eventHander(evt){}[, opts])`

Bind a event handler to a dom element(s) for an event type and optional selector. It also supports namespacing, and custom context at binding time (i.e., the "this" of the eventHandler) 

- el: (optional) (default document) The base document element to bind the event to. Can also be an array or nodeList of element. 
- eventType: (required) Multiple are supported with "," (e.g., "webkitTransitionEnd, transitionend")
- selector: (optional) HTML5 selector, if set, only target matching this selector will trigger the eventHandler
- eventHandler: (required) The event hander. "this" can be configured via `opts.ctx`
- opts: (optional)
    + ctx: eventHandler context (i.e. this)
    + ns: Binding namespace

> **Note:** Similar to jquery.on, except that the event object (evt) are the native ones, and that the selector are plain HTML5 selectors. `.selectTarget` property is added to the original event which point to  the element pointed by the eventual 'selector'. 


###### Examples

```html
<div class="item">
   <div class="sub-item">text</div>
</div>
```


```js
var baseEl = document;
mvdom.on(baseEl, "click", ".item", function(evt){
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

Unbind event binding that has been bound by `mvdom.on`. 

- `.off(els)` Unbind all bindings added via .on
- `.off(els, type)` Unbind all bindings of type added via .on
- `.off(els, type, selector)` Unbind all bindings of type and selector added via .on
- `.off(els, type, selector, listener)` Unbind all bindings of this type, selector, and listener
- `.off(els,{ns})` Unbind all bindings from the namespace ns (recommended).

## Dom Data eXchange (push/pull)

`mvdom.push` and `mvdom.pull` provides a simple and extensible way to extract or inject data from and to a DOM subtree. 

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

While `mvdom` is written in pure JS, it does provide typescript types. See [types/index.d.ts](types/index.d.ts). 


```ts
import { display, remove, View } from "mvdom";

class MyView implements View{
  id!: string; // will be set before .create (will be unique)
  name!: string; // will be set before .create (will be MyView)
  el!: HTMLElement; // will be set after  .create 

  create(){
    return `<div>My First mvdom View <span class="but">click to remove me</span></div>`;
  }, 

  events = {
    "click; .but": (evt) => {
      console.log("This button has been clicked");
      mvdom.remove(this.el); // this will remove the div and unbind
    }
  }
}

display(MyView, "body");
```


> Note: For convenience, we use TypeScript `!` property declaration modifier to specify that those values can be considered as set in the 'construction' phase.  


[changlogs](CHANGELOG.md)