(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
	first: first, 
	all: all, 
	closest: closest
};

// --------- DOM Query Shortcuts --------- //

function first(el, selector){
	return _execQuerySelector(false, el, selector);
}

function all(el, selector){
	return _execQuerySelector(true, el, selector);
}

function closest(el, selector){
	var tmpEl = el;
	while (tmpEl !== document){
		if (tmpEl.matches(selector)){
			return tmpEl;
		}
		tmpEl = tmpEl.parentElement;		
	}
	return false;
}

function _execQuerySelector(all, el, selector){
	// if el is null or undefined, means we return nothing. 
	if (typeof el === "undefined" || el === null){
		return null;
	}
	// if selector is undefined, it means we select from document and el is the document
	if (typeof selector === "undefined"){
		selector = el;
		el = document;		
	}
	return (all)?el.querySelectorAll(selector):el.querySelector(selector);
}
// --------- /DOM Query Shortcuts --------- //


},{}],2:[function(require,module,exports){
'use strict';

var utils = require("./utils.js");


module.exports = {
	pull: pull, 
	push: push, 
	puller: puller, 
	pusher: pusher
};

var _pushers = [

	["input[type='checkbox'], input[type='radio']", function(value){
		var iptValue = this.value || "on"; // as some browsers default to this

		// if the value is an array, it need to match this iptValue
		if (value instanceof Array){
			if (value.indexOf(iptValue) > -1){
				this.checked = true;
			}
		}
		// otherwise, if value is not an array,
		else if ((iptValue === "on" && value) || iptValue === value){
			this.checked = true;
		}
	}],

	["input", function(value){
		this.value = value;
	}],

	["select", function(value){
		this.value = value;
	}],

	["textarea", function(value){
		this.value = value;
	}],

	["*", function(value){
		this.innerHTML = value;
	}]
];

var _pullers = [
	["input[type='checkbox'], input[type='radio']", function(existingValue){

		var iptValue = this.value || "on"; // as some browser default to this
		var newValue;
		if (this.checked){
			// change "on" by true value (which usually what we want to have)
			// TODO: We should test the attribute "value" to allow "on" if it is defined
			newValue = (iptValue && iptValue !== "on")?iptValue:true;
			if (typeof existingValue !== "undefined"){
				// if we have an existingValue for this property, we create an array
				var values = utils.asArray(existingValue);
				values.push(newValue);
				newValue = values;
			}				
		}
		return newValue;
	}],

	["input, select", function(existingValue){
		return this.value;
	}],

	["textarea", function(existingValue){
		return this.value;
	}],

	["*", function(existingValue){
		return this.innerHTML;
	}]
];

function pusher(selector,func){
	_pushers.unshift([selector,func]);
}

function puller(selector,func){
	_pullers.unshift([selector,func]);
}

function push(el, data) {
	var dxEls = d.all(el, ".dx");

	dxEls.forEach(function(dxEl){
		var propPath = getPropPath(dxEl);
		var value = utils.val(data,propPath);
		var i = 0, selector, fun, l = _pushers.length;
		for (; i<l ; i++){
			selector = _pushers[i][0];
			if (dxEl.matches(selector)){
				fun = _pushers[i][1];
				fun.call(dxEl,value);
				break;
			}
		}		
	});

	// // iterate and process each matched element
	// return this.each(function() {
	// 	var $e = $(this);

	// 	$e.find(".dx").each(function(){
	// 		var $dx = $(this);
	// 		var propPath = getPropPath($dx);
	// 		var value = val(data,propPath);
	// 		var i = 0, selector, fun, l = _pushers.length;
	// 		for (; i<l ; i++){
	// 			selector = _pushers[i][0];
	// 			if ($dx.is(selector)){
	// 				fun = _pushers[i][1];
	// 				fun.call($dx,value);
	// 				break;
	// 			}
	// 		}
	// 	});
	// });
}

function pull(el){
	var obj = {};
	var dxEls = d.all(el, ".dx");

	dxEls.forEach(function(dxEl){
		var propPath = getPropPath(dxEl);
		var i = 0, selector, fun, l = _pullers.length;		
		for (; i<l ; i++){
			selector = _pullers[i][0];
			if (dxEl.matches(selector)){
				fun = _pullers[i][1];
				var existingValue = utils.val(obj,propPath);
				var value = fun.call(dxEl,existingValue);
				if (typeof value !== "undefined"){
					utils.val(obj,propPath,value);	
				}
				break;
			}					
		}		
	});

	return obj;

	// // iterate and process each matched element
	// this.each(function() {
	// 	var $e = $(this);

	// 	$e.find(".dx").each(function(){
	// 		var $dx = $(this);
	// 		var propPath = getPropPath($dx);
	// 		var i = 0, selector, fun, l = _pullers.length;
	// 		for (; i<l ; i++){
	// 			selector = _pullers[i][0];
	// 			if ($dx.is(selector)){
	// 				fun = _pullers[i][1];
	// 				var existingValue = val(obj,propPath);
	// 				var value = fun.call($dx,existingValue);
	// 				if (typeof value !== "undefined"){
	// 					val(obj,propPath,value);	
	// 				}
	// 				break;
	// 			}					
	// 		}
	// 	});
	// });		
	
	// return obj;
}

/** 
 * Return the variable path of the first dx-. "-" is changed to "."
 * 
 * @param classAttr: like "row dx dx-contact.name"
 * @returns: will return "contact.name"
 **/
function getPropPath(dxEl){
	var path = null;
	var i =0, classes = dxEl.classList, l = dxEl.classList.length, name;
	for (; i < l; i++){
		name = classes[i];
		if (name.indexOf("dx-") === 0){
			path = name.split("-").slice(1).join(".");
			break;
		}
	}
	// if we do not have a path in the css, try the data-dx attribute
	if (!path){
		path = dxEl.getAttribute("data-dx");
	}
	if (!path){
		path = dxEl.getAttribute("name"); // last fall back, assume input field
	}
	return path;
}




},{"./utils.js":5}],3:[function(require,module,exports){
'use strict';

var utils = require("./utils.js");
var view = require("./view.js");

module.exports = {
	on: on,
	off: off,
	trigger: trigger
};

// --------- Module APIs --------- //

// bind a event can be call with 
// - els: single or array of the base dom elements to bind the event listener upon.
// - type: event type (like 'click' or can be custom event).
// - selector: (optional) query selector which will be tested on the target element. 
// - listener: function which will get the "event" as first parameter
// - opts: (optional) {ns,ctx} optional namespace and ctx (i.e. this)
function on(els, type, selector, listener, opts){

	// if the "selector" is a function, then, it is the listener and there is no selector
	if (selector instanceof Function){
		listener = selector;
		selector = null;
		opts = listener;
	}

	var typeSelectorKey = buildTypeSelectorKey(type, selector);

	utils.asArray(els).forEach(function(el){

		// This will the listener use for the even listener, which might differ
		// from the listener function passed in case of a selector
		var _listener = listener; 

		// if we have a selector, create the wrapper listener to do the matches on the selector
		if (selector){
			_listener = function(evt){
				var tgt = null;
				var target = evt.target;
				var currentTarget = evt.currentTarget;
				var ctx = (opts)?opts.ctx:null;
				// if the target match the selector, then, easy, we call the listener
				if (target.matches(selector)){
					listener.call(ctx,evt);
				}
				// now, if it does not, perhaps something in between the target and currentTarget
				// might match
				else{
					tgt = evt.target.parentNode;
					// TODO: might need to check that tgt is not undefined as well. 
					while (tgt !== null && tgt !== currentTarget && tgt !== document){
						if (tgt.matches(selector)){
							// Note: This is the mouseEvent are readonly, we cannot change the currentTarget, so the user will have to do a d.closest.
							// Note: We might want to think about the jQuery approach to duplicate the event and trigger another event with the currentTarget
							listener.call(ctx,evt);
							tgt = null;
							break;
						}

						tgt = tgt.parentNode;
					}
				}
			};
		}
		// if we do not have a selector, but still havea  opts.ctx, then, need to wrap
		else if (opts && opts.ctx){
			_listener = function(evt){
				listener.call(opts.ctx,evt);
			};
		}
		
		var listenerRef = {
			type: type,
			listener: listener, // the listener as passed by the user
			_listener: _listener, // an eventual wrap of the listener, or just point listener.
		};

		if (selector){
			listenerRef.selector = selector;
		}

		// If we have a namespace, they add it to the Ref, and to the listenerRefsByNs
		// TODO: need to add listenerRef in a nsDic if if there a opts.ns
		if (opts && opts.ns){
			listenerRef.ns = opts.ns;
			var listenerRefSetByNs = utils.ensureMap(el,"listenerRefsByNs");
			var listenerRefSet = utils.ensureSet(listenerRefSetByNs, opts.ns);
			listenerRefSet.add(listenerRef);
		}

		// add the listenerRef as listener:listenerRef entry for this typeSelectorKey in the listenerDic
		var listenerDic = utils.ensureMap(el,"listenerDic");
		var listenerRefByListener = utils.ensureMap(listenerDic,typeSelectorKey);
		listenerRefByListener.set(listener, listenerRef);

		// do the binding
		el.addEventListener(type, _listener);

		return this;
	});
}


// remove the event binding
// .off(els); remove all events added via .on
// .off(els, type); remove all events of type added via .on
// .off(els, type, selector); remove all events of type and selector added via .on
// .off(els, type, selector, listener); remove event of this type, selector, and listener
// .off(els,{ns}); remove event from the namespace ns
function off(els, type, selector, listener){

	// --------- off(els, {ns}) --------- //
	// if we have a .off(els,{ns:..}) then we do check only the ns
	if (type.ns){		
		var ns = type.ns;
		utils.asArray(els).forEach(function(el){
			var listenerDic = el["listenerDic"];
			var listenerRefsByNs = el["listenerRefsByNs"];
			var listenerRefSet;
			if (listenerRefsByNs){
				listenerRefSet = listenerRefsByNs.get(ns);
				if (listenerRefSet){
					// if we get the set, we remove them all
					listenerRefSet.forEach(function(listenerRef){
						// we remove the event listener
						el.removeEventListener(listenerRef.type, listenerRef._listener);

						// need to remove it from the listenerDic
						var typeSelectorKey = buildTypeSelectorKey(listenerRef.type, listenerRef.selector);
						var listenerRefMapByListener = listenerDic.get(typeSelectorKey);
						if (listenerRefMapByListener.has(listenerRef.listener)){
							listenerRefMapByListener.delete(listenerRef.listener);
						}else{
							// console.log("INTERNAL ERROR should have a listener in el.listenerDic for " + typeSelectorKey);
						}
					});
					// we remove this namespace now that all event handlers has been removed
					listenerRefsByNs.delete(ns);
				}
			}
		});
		return;
	}
	// --------- /off(els, {ns}) --------- //


	// if the "selector" is a function, then, it is the listener and there is no selector
	if (selector instanceof Function){
		listener = selector;
		selector = null;
	}

	var typeSelectorKey = buildTypeSelectorKey(type, selector);

	utils.asArray(els).forEach(function(el){

		// First, get the listenerRefByListener for this type/selectory
		var listenerRefMapByListener = utils.val(el,["listenerDic",typeSelectorKey]);

		// for now, if we do not have a listenerRef for this type/[selector], we throw an error
		if (!listenerRefMapByListener){
			console.log("WARNING - Cannot do .off() since this type-selector '" + typeSelectorKey + 
				"' event was not bound with .on(). We will add support for this later.");
			return;
		}

		// if we do not have a listener function, this mean we need to remove all events for this type/selector
		if (typeof listener === "undefined"){
			listenerRefMapByListener.forEach(function(listenerRef){
				// Note: Here, type === listenerRef.type
				// remove the event
				el.removeEventListener(type, listenerRef._listener);				
			});
			el["listenerDic"].delete(typeSelectorKey);
		}
		// if we have a listener, then, just remove this one.
		else{
			// check that we have the map. 
			var listenerRef = listenerRefMapByListener.get(listener);

			if (!listenerRef){
				console.log("WARNING - Cannot do .off() since no listenerRef for " + typeSelectorKey + 
				" and function \n" + listener + "\n were found. Probably was not registered via on()");
				return;
			}

			// remove the event
			el.removeEventListener(type, listenerRef._listener);

			// remove it from the map
			listenerRefMapByListener.delete(listener);			
		}


	});	
}

var customDefaultProps = {
	bubbles: true,
	cancelable: true
};

function trigger(els, type, data){
	var evt = new CustomEvent(type, Object.assign({},customDefaultProps,data));	
	utils.asArray(els).forEach(function(el){
		el.dispatchEvent(evt);
	});
}

// --------- /Module APIs --------- //

// --------- Events Hook --------- //
view.hook("willInit", function(view){
	var opts = {ns: "view_" + view.id, ctx: view};
	if (view.events){
		bindEvents(view.events, view.el, opts);
	}

	if (view.docEvents){
		bindEvents(view.docEvents, document, opts);
	}

	if (view.winEvents){
		bindEvents(view.windEvents, document, opts);
	}

	// TODO: need to allow closest binding.
});

view.hook("willDetach", function(view){
	var ns = {ns: "view_" + view.id};
	off(document, ns);
	off(window, ns);
	// TODO: need to unbind closest binding
});

function bindEvents(events, el, opts){
	var etxt, etxts, type, selector;
	for (etxt in events){
		etxts = etxt.trim().split(";");
		type = etxts[0].trim();
		selector = null;
		if (etxts.length > 1){
			selector = etxts[1].trim();
		}
		on(el, type, selector, events[etxt], opts);
	}
}



// TODO: need to unbind on "willDestroy"

// --------- /Events Hook --------- //

function buildTypeSelectorKey(type, selector){
	var v = type;
	return (selector)?(v + "--" + selector):v;
}

},{"./utils.js":5,"./view.js":6}],4:[function(require,module,exports){
'use strict';

var view = require("./view.js");
var events = require("./events.js");
var dom = require("./dom.js");
var dx = require("./dx.js");
var utils = require("./utils.js");

module.exports = {
	// view APIs
	hook: view.hook,
	register: view.register,
	display: view.display,
	remove: view.remove,
	empty: view.empty,

	// events API
	on: events.on, 
	off: events.off,
	trigger: events.trigger,

	// DOM Query Shortcuts
	first: dom.first,
	all: dom.all,
	closest: dom.closest,

	// DOM Push/Pull
	pull: dx.pull,
	push: dx.push,
	puller: dx.puller,
	pusher: dx.pusher,

	// utils
	val: utils.val
};

// put this component in the global scope
if (window){
	window.mvdom = module.exports;	
}



},{"./dom.js":1,"./dx.js":2,"./events.js":3,"./utils.js":5,"./view.js":6}],5:[function(require,module,exports){
'use strict';

module.exports = {
	// Object Utils
	isNull: isNull,
	isEmpty: isEmpty,
	val: val,
	ensureMap: ensureMap,
	ensureSet: ensureSet,
	ensureArray: ensureArray,

	// asType
	asArray: asArray
};

// --------- Object Utils --------- //
var UD = "undefined";
var STR = "string";
var OBJ = "object";

// return true if value is null or undefined
function isNull(v){
	return (typeof v === UD || v === null);
}

// return true if the value is null, undefined, empty array, empty string, or empty object
function isEmpty(v){
	var tof = typeof v;
	if (isNull(v)){
		return true;
	}

	if (v instanceof Array || tof === STR){
		return (v.length === 0)?true:false;
	}

	if (tof === OBJ){
		// apparently 10x faster than Object.keys
		for (var x in v) { return false; }
		return true;
	}

	return false;
}

// Method that allow to get or set a value to a root object with a path.to.value
// for example val({},"contact.job.title","vp"), will popuplate {} as {contact:{job:{title:"vp"}}};
// and val({contact:{job:{title:"vp"}}}, "cotnact.job.title") === "vp"
// function val(rootObj, pathToValue, value){
// 	var setMode = (typeof value !== "undefined");
// 	var firstNode = rootObj; // value if get mode, rootObj if setMode;

// 	if (!rootObj) {
// 		return rootObj;
// 	}
// 	// for now, return the rootObj if the pathToValue is empty or null or undefined
// 	if (!pathToValue) {
// 		return rootObj;
// 	}

// 	var names = (pathToValue instanceof Array)?pathToValue:pathToValue.split(".");

// 	var i, l = names.length;
// 	var lIdx = l  -1;
// 	var name, currentNode = firstNode, nextNode;
// 	for (i = 0; i < l; i++) {
// 		name = names[i];
// 		nextNode = currentNode[name];
// 		if (setMode){
// 			// if last index, set the value
// 			if (i === lIdx){
// 				currentNode[name] = value;
// 				currentNode = value;
// 			}else{
// 				if (typeof nextNode === "undefined") {
// 					nextNode = {};
// 				} 
// 				currentNode[name] = nextNode;
// 				currentNode = nextNode;
// 			}
// 		}else{
// 			currentNode = nextNode;
// 			if (typeof currentNode === "undefined") {
// 				currentNode = undefined;
// 				break;
// 			}			
// 		}

// 	} // /for
// 	if (setMode){
// 		return firstNode;
// 	}else{
// 		return currentNode;
// 	}
// }


// TODO: add the set value
function val(rootObj, pathToValue, value) {
	var setMode = (typeof value !== "undefined");

	if (!rootObj) {
		return rootObj;
	}
	// for now, return the rootObj if the pathToValue is empty or null or undefined
	if (!pathToValue) {
		return rootObj;
	}
	// if the pathToValue is already an array, do not parse it (this allow to support '.' in prop names)
	var names = (pathToValue instanceof Array)?pathToValue:pathToValue.split(".");
	
	var name, currentNode = rootObj, currentIsMap, nextNode;

	var i = 0, l = names.length, lIdx = l - 1;
	for (i; i < l; i++) {
		name = names[i];

		currentIsMap = (currentNode instanceof Map);
		nextNode = currentIsMap?currentNode.get(name):currentNode[name];

		if (setMode){
			// if last index, set the value
			if (i === lIdx){
				if (currentIsMap){
					currentNode.set(name,value);
				}else{
					currentNode[name] = value;
				}
				currentNode = value;
			}else{
				if (typeof nextNode === "undefined") {
					nextNode = {};
				} 
				currentNode[name] = nextNode;
				currentNode = nextNode;
			}
		}else{
			currentNode = nextNode;
			if (typeof currentNode === "undefined") {
				currentNode = undefined;
				break;
			}			
		}

		// if (node == null) {
		// 	return undefined;
		// }
		// // get the next node
		// node = (node instanceof Map)?node.get(name):node[name];
		// if (typeof node === "undefined") {
		// 	return node;
		// }
	}
	if (setMode){
		return rootObj;
	}else{
		return currentNode;
	}
}

// --------- /Object Utils --------- //

// --------- ensureType --------- //
// Make sure that this obj[propName] is a js Map and returns it. 
// Otherwise, create a new one, set it, and return it.
function ensureMap(obj, propName){
	return _ensure(obj, propName, Map);
}

// Make sure that this obj[propName] is a js Set and returns it. 
// Otherwise, create a new one, set it, and return it.
function ensureSet(obj, propName){
	return _ensure(obj, propName, Set);
}

// same as ensureMap but for array
function ensureArray(obj, propName){
	return _ensure(obj, propName, Array);
}

function _ensure(obj, propName, type){
	var isMap = (obj instanceof Map);
	var v = (isMap)?obj.get(propName):obj[propName];
	if (isNull(v)){
		v = (type === Array)?[]:(new type);
		if (isMap){
			obj.set(propName, v);
		}else{
			obj[propName] = v;	
		}		
	}
	return v;	
}

// --------- /ensureType --------- //

// --------- asType --------- //
// Return an array from a value object. If value is null/undefined, return empty array. 
// If value is null or undefined, return empty array
// If the value is an array it is returned as is
// If the value is a object with forEach/length will return a new array for these values
// Otherwise return single value array
function asArray(value){
	if (!isNull(value)){
		if (value instanceof Array){
			return value;
		}
		// not an Array but still have some arrayish methods (probably a NodeList)
		else if (value.forEach && typeof value.length !== "undefined"){
			return Array.prototype.slice.call(value);
		}
		// otherwise we add value
		else{
			return [value];
		}
	}
	// otherwise, return an empty array
	return [];
}
// --------- /asType --------- //

},{}],6:[function(require,module,exports){
'use strict';

var utils = require("./utils.js");
var dom = require("./dom.js");

module.exports = {
	hook: hook,
	register: register,
	display: display, 
	remove: remove, 
	empty: empty
};

var viewDefDic = {};

var viewIdSeq = 0;

var hooks = {
	willCreate: [],
	didCreate: [],
	willInit: [],
	didInit: [],
	willDisplay: [],
	didDisplay: [],
	willPostDisplay: [],
	didPostDisplay: [], 
	willDetach: [],
	didDetach: []
};

// --------- Public APIs --------- //
function hook(name, fun){
	hooks[name].push(fun);
}

function register(name, controller, config){
	var viewDef = {
		name: name,
		controller: controller,
		config: config
	}; 

	viewDefDic[name] = viewDef;
}

function display(name, parentEl, data, config){

	var view = doInstantiate(name, config);
	
	return doCreate(view, data)
	.then(function(){
		return doInit(view, data);
	})
	.then(function(){
		return doDisplay(view, parentEl, data);
	})
	.then(function(){
		return doPostDisplay(view, data);
	});

}

function empty(els){
	utils.asArray(els).forEach(function(el){
		// first we detach all eventual children that were a view
		detachChildren(el);
		// Then, we can remove all of the d.
		while (el.lastChild) {
			el.removeChild(el.lastChild);
		}
	});
}

function remove(els){
	utils.asArray(els).forEach(function(el){
		removeEl(el);
	});
}
// --------- /Public APIs --------- //
function detachChildren(el){
	var viewEls = utils.asArray(dom.all(el, ".d-view"));
	if (viewEls){
		viewEls = viewEls.reverse();
		viewEls.forEach(function(elItem){
			doDetach(elItem._view);
		});
	}	
}

function removeEl(el){
	// first get all of the possible children that are views (d-view) and detach them. 
	detachChildren(el);

	if (el._view){
		doDetach(el._view);
	}
	
	// finally remove it from the DOM
	// NOTE: this means that the detach won't remove the node from the DOM
	//       which avoid removing uncessary node, but means that didDetach will
	//       still have a view.el in the DOM
	if (el.parentNode){
		el.parentNode.removeChild(el);
	}
}

// return the "view" instance
// TODO: need to be async as well and allowed for loading component if not exist
function doInstantiate(name, config){
	// get the view def from the dictionary
	var viewDef = viewDefDic[name];

	// instantiate the view instance
	var view = Object.assign({}, viewDef.controller);

	// set the config
	view.config = Object.assign({}, viewDef.config, config);

	// set the id
	view.id = viewIdSeq++;

	return view;
}

// return a promise that resolve with nothing.
function doCreate(view, data){
	performHook("willCreate", view);

	// Call the view.create
	var p = Promise.resolve(view.create(data));

	return p.then(function(html){
		// create the html element
		var div = document.createElement('div');
		div.innerHTML = html;
		var viewEl = div.firstChild;

		// set the view.el and view.el._view
		view.el = viewEl;
		view.el.classList.add("d-view");
		view.el._view = view; 

		performHook("didCreate", view);	
	});
}

function doInit(view, data){
	performHook("willInit", view);
	var res;

	if (view.init){
		res = view.init(data);
	}
	return Promise.resolve(res).then(function(){
		performHook("didInit", view);	
	});
}

function doDisplay(view, parentEl, data){
	performHook("willDisplay", view);

	// add the view to the parent (and probably to do the DOM)
	parentEl.appendChild(view.el);

	performHook("didDisplay", view);
	return new Promise(function(resolve, fail){
		setTimeout(function(){
			resolve();
		},0);
	});
}

function doPostDisplay(view, data){
	performHook("willPostDisplay", view);

	if (view.postDisplay){
		view.postDisplay(data);
	}

	return new Promise(function(resolve, fail){
		resolve(view);
	});
}

function doDetach(view){
	performHook("willDetach", view);

	view.detached = true;
	
	performHook("didDetach", view);

}


function performHook(name, view){
	var hookFuns = hooks[name];
	var i= 0 , l = hookFuns.length, fun;
	for (; i < l; i++){
		fun = hookFuns[i];
		fun(view);
	}
}



},{"./dom.js":1,"./utils.js":5}]},{},[4]);
