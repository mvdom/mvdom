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
- Minimalistic pub/sub (hub) with topic and label selectors. 

Coming soon:
- Hookable routing

## Installation
```
npm install mvdom --save
```

## API Overview

```js
var d = require('mvdom'); // d is the new $

// --------- View APIs --------- //
// register a view controller (async lifecycle)
d.register("ViewName", {create,init,postDisplay,detach}, config); 
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

// --------- Hub (pub/sub) --------- //
var myHub = d.hub("myHub"); // create new hub

myHub.sub(topics, [labels,] handler[, opts]); // subscribe

myHub.pub(topic, [label,], data); // publish

myHub.unsub(opts.ns); // unsubscribe
// --------- /Hub (pub/sub) --------- //
```

## View 

```js
var d = mvdom;

d.register("MainView",{
    // Returns a HTML String or a HTML Element
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
    }, 

    // (optional) will be called when this view is deleted (from d.remove or d.empty on a parent)
    detach: function(){
        
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

Then, to display `MainView` into a html element, just do. 

```js
// (viewName, parentHtmlElement, data)
d.display("MainView", d.first("body"), {message:"hello from mvdom"});
// Note: d.first is just a shortcut to document.querySelector
```



## Hub (pub/sub)
```js
var d = mvdom;

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

