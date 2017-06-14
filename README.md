## Concept

mvDom is a minimalistic DOM CENTRIC MVC library, which uses the DOM as the foundation for MVC rather than working against it. 

- The DOM is your friend, don't fight it, embrace it. 
- Used right, the DOM can be a great foundation for a simple and scalable MVC model.
- Over componentization is as bad as under componentization.
- Black magic always come with a hidden cost.
- Frameworks come and go, languages and runtimes stay.
- Size is a factor of complexity and starting simple will always scale better.

**Conclusion**: For maximum mileage, start simple, minimalistic, embrace the DOM, add only what is strictly needed to have a scalable MVC model, componentize only as needed, understand your runtime, avoid high-abstraction frameworks, favor focused libraries over all-in-one frameworks.

## Characteristics

- Zero dependency, micro libary (< 12kb min, < 5kb gzip).
- Template agnostic (string templating friendly, e.g., Handlebars)
- Dead simple APIs (e.g. d.register(name, controller), d.display(name, parent))
- Async Lifecycle management (hookable)
- Enhanced DOM eventing (i.e., d.on(el, type, selector, fn, {ns}) and off/trigger a la jquery, without wrappers)
- Simple, extensible, and optimized DOM data exchange (`d.push(el, data)` & `var data = d.pull(el)`). 
- Minimalistic but powerful pub/sub (hub) with topic and label selectors. 


## Installation
```
npm install mvdom --save
```

## API Overview

```js
var d = require('mvdom'); // d is the new $

// --------- View APIs --------- //
// register a view controller (async lifecycle)
d.register("ViewName", {create,init,postDisplay,destroy}[, config]); 
// display a view in this DOM element el 
d.display("ViewName", parentEl [, config]); 
// register a hook at a specific stage (willCreate, didCreate, willInit, ...)
d.hook("willCreate", fn(view){}); 
// --------- /View APIs --------- //

// --------- DOM Event Helpers --------- //
// register a listener for this event type on one or more elements
d.on(els, types, listener);
// register a listener for this type and selector on one or more elements (with event.selectTarget when selector).  
d.on(els, types, selector, listener); 
// register listener with optional namespace or context (this)
d.on(els, types, [selector,] {ns,context});

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

d.next(el[, selector]); // shortcut to find the next sibling element matching an optioal selector
d.prev(el[, selector]); // shortcut to find the previous sibling element matching an optional selector
// --------- /DOM Query Shortcuts --------- //

// --------- Hub (pub/sub) --------- //
var myHub = d.hub("myHub"); // create new hub

myHub.sub(topics, [labels,] handler[, opts]); // subscribe

myHub.pub(topic, [label,], data); // publish

myHub.unsub(opts.ns); // unsubscribe
// --------- /Hub (pub/sub) --------- //
```

## mvdom.register(viewName, controller [, config])

Register a new view with `mvdom.register`. The view controller is responsible for the view lifecycle (which is asynchronous in nature). The only require view controller method, is the `.create([data, config])` which is reponsible to return the HTML.

```js

// register a view controller
mvdom.register("MainView",{
    // Returns a HTML String
    // Must be one parent element
    create: function(data, config){
        return `<div class='MainView'>
                  <div class=".but">${data.message}</div>
                </div>`
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
        // some non UI layout related, or actions that need to be performed after the component is displayed. 

        // if return a promise, the mvdom.display(...).then will resolve when the return promise will be resolve. 
        // however, the mvdom.display(...) promise resolution will always be this view, regardless of the object or promise returns by this function.
    }, 

    // (optional) will be called when this view is deleted (from d.remove or d.empty on a parent)
    // will be called after the view.el is removed from parent.
    // info: {parentEl} Simple js object containing the parentEl property.
    destroy: function(info){
        
    }

    // (optional) bind events to this view (support selector)
    events: {
        "click; .but": function(evt){
            var view = this; // this is the view
            console.log("click on .but", evt, view);
        }
    }, 

    // (optional) bind events to the document 
    // (will be unbind when destroy this view by calling d.remove on this element or parents or d.empty on any parent )
    docEvents: {
        "click; .do-logoff": function(evt){
            var view = this;            
        }
    }, 

    // (optional) same as above, but on window (good to handle window resize)
    winEvents: {
        "resize": function(evt){
            // do something when window is resize
        }
    }, 

    // (optional) subscribe to a hub by hub name, topic(s), and optional label(s)
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

## mvdom.display(viewName, referenceDomElement, [data, config])

Display a view with `mvdom.display`, for example: 

```js
// mvdom.display(viewName, referenceDomElement, data)
mvdom.display("MainView", mvdom.first("body"), {message:"hello from mvdom"});
// Note: mvdom.first is just a shortcut to document.querySelector
```

By default, the `config.append = "last"` which means the referenceDomElement will be the parent and the view element will be added at the end (using `referenceDomElement.appendChild(view.el)`)

If no data, but config, pass null like `mvdom.display("MainView", parentEl, null, {append:"first"})`

In the context of `mvdom.display`, `config` can be a string, and in this case it will be interpreted as `append`. So the line above is equivalent to `mvdom.display("MainView", parentEl, null, "first")`.


## mvdom view config

The optional mvdom view `config` argument allow to customize the way the view is managed. It can be set at the registration phase, as well as overriden for each display. 

- append: ("last", "first", "before", "after"). 
    + **"last"**: The _referenceDomElement_ is interpreted as the parent, and the append will use `referenceDomElement.appendChild(view.el)`
    + **"first"**: The _referenceDomElement_ is interpreted as the parent, and the append will use the `.insertBefore` the `.firstChild` of the _referenceDomElement_. If no firstElement, then, will do a normal appendChild.
    + **"before"**: The _referenceDomElement_ is interepreted as a sibling, and the append will use the `.insertBefore` the _referenceDomElement_.
    + **"after"**: The _referenceDomElement_ is interepreted as a sibling, and we `.insertBefore` the next sibling of the _referenceDomElement_. If the next sibling is null, use the `referenceDomElement.parentNode.appendChild(view.el)` to add it last.


## DOM events

All events forwarded by the `mvdom.on` are the native DOM events even when selectors are used. When selectors are used, mvdom add one property to the native event object and that is `.selectTarget`. For example,

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
  evt.selectTarget; // will always be .item (even when .sub-item get clicked)
});
```

Note: `.selectTarget` is only set when we have a selector.

Multi events bind can be done with ","

```js
mvdom.on(someEl, "webkitTransitionEnd, transitionend", ...)
```


## Hub (pub/sub)

```js
var d = window.mvdom; // just a best practice we have, but feel free to use mvdom as is.

var myHub = d.hub("myHub");

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

