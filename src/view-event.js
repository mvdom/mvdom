'use strict';

var _view = require("./view.js");
var _event = require("./event.js");

// --------- Events Hook --------- //
_view.hook("willInit", function(view){
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

_view.hook("willDetach", function(view){
	var ns = {ns: "view_" + view.id};
	_event.off(document, ns);
	_event.off(window, ns);
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
		_event.on(el, type, selector, events[etxt], opts);
	}
}
// TODO: need to unbind on "willDestroy"

// --------- /Events Hook --------- //