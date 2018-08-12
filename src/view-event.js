var _view = require("./view.js");
var _event = require("./event.js");
var asArray = require("./utils.js").asArray;

// --------- Events Hook --------- //
// Note: We bound events after the init (see #34)
_view.hook("didInit", function (view) {
	var opts = { ns: "view_" + view.id, ctx: view };
	if (view.events) {
		bindEvents(view.events, view.el, opts);
	}

	if (view.docEvents) {
		bindEvents(view.docEvents, document, opts);
	}

	if (view.winEvents) {
		bindEvents(view.windEvents, document, opts);
	}

	// TODO: need to allow closest binding.
});

_view.hook("willRemove", function (view) {
	var ns = { ns: "view_" + view.id };
	_event.off(document, ns);
	_event.off(window, ns);
	// TODO: need to unbind closest/parents binding
});

function bindEvents(eventDics, el, opts) {
	eventDics = asArray(eventDics); // make we have an array of eventDic

	var eventSelector, // e.g., "click; button.add"
		selectorSplitted, // e.g., ["click", " button.add"]
		type, // e.g., "click"
		selector; // e.g., "button.add"

	var i,
		eventDic; // {"click; button.add": function(){}, ...}		

	for (i = 0; i < eventDics.length; i++) {
		eventDic = eventDics[i];

		for (eventSelector in eventDic) {
			selectorSplitted = eventSelector.trim().split(";");
			type = selectorSplitted[0].trim();
			selector = null;
			if (selectorSplitted.length > 1) {
				selector = selectorSplitted[1].trim();
			}
			_event.on(el, type, selector, eventDic[eventSelector], opts);
		}

	}


}
// TODO: need to unbind on "willDestroy"

// --------- /Events Hook --------- //