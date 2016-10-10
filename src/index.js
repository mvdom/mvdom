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


