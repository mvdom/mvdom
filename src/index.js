'use strict';

var view = require("./view.js");
var event = require("./event.js");
var dom = require("./dom.js");
var dx = require("./dx.js");
var hub = require("./hub.js");
var utils = require("./utils.js");

require("./view-event.js");
require("./view-hub.js");

module.exports = {
	version: "0.4.1",
	
	// view APIs
	hook: view.hook,
	register: view.register,
	display: view.display,
	remove: view.remove,
	empty: view.empty,

	// event API
	on: event.on, 
	off: event.off,
	trigger: event.trigger,

	// DOM Query Shortcuts
	first: dom.first,
	all: dom.all,
	closest: dom.closest,
	next: dom.next,
	prev: dom.prev,

	// DOM Push/Pull
	pull: dx.pull,
	push: dx.push,
	puller: dx.puller,
	pusher: dx.pusher,

	// Hub
	hub: hub.hub,

	// utils
	val: utils.val,
	asArray: utils.asArray
};

// put this component in the global scope
// TODO: We might want to have a index-global for putting this in the global scope and index.js not putting it in the global scope. 
if (window){
	window.mvdom = module.exports;	
}


