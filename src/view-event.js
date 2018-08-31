"use strict";

var _view = require("./view.js");
var _event = require("./event.js");
var utils = require("./utils.js");
var dom = require('./dom.js')
var asArray = utils.asArray;
var ensureArray = utils.ensureArray;

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

	// TODO: need to have test for win events
	if (view.winEvents) {
		bindEvents(view.winEvents, window, opts);
	}

});

_view.hook("willPostDisplay", function (view) {
	var opts = { ns: "view_" + view.id, ctx: view };

	if (view.closestEvents) {
		// [closest_selector, binding_string, fn]
		const allClosestBindings = collectClosestBinding(view.closestEvents);
		// elBySelector cache
		const elBySelector = {};

		allClosestBindings.forEach(function (binding) {
			const closestSelector = binding[0];

			// get the closestEl
			let closestEl = elBySelector[closestSelector];
			if (closestEl === null) { // if null, it was not found before in the dom, so abort
				return;
			} if (closestEl === undefined) { // if undefined, we try to get it. 
				elBySelector[closestSelector] = closestEl = dom.closest(view.el, closestSelector);
			}

			// if not fond, we still ignore the binding (might warn later in console)
			if (closestEl) {

			}

		})
	}
});

_view.hook("willRemove", function (view) {
	var ns = { ns: "view_" + view.id };
	_event.off(document, ns);
	_event.off(window, ns);

	// if (view.closestEvents) {
	// 	const bindingByClosestSelector = collectClosestBinding(view.closestEvents);
	// 	let closestSelector;
	// 	for (closestSelector in bindingByClosestSelector) {
	// 		let closestEl = dom.closest(view.el, closestSelector);
	// 		if (closestEl) { // if not found, we silently ignore by design.
	// 			_event.off(closestEl, ns);
	// 		}
	// 	}
	// }
	// TODO: need to unbind closest/parents binding
});


/**
 * 
 * @param {*} events an array of "closest_selector; event_types[; target_selector]": fn 
 * 											or array of {closest_selector: {"event_types[; target_selector]": fn}}
 * @returns array of array [closest_selector, binding_string, fn]
 */
function collectClosestBinding(events) {
	events = asArray(events);
	const acc = []; // array of {[closest_selector: string] : {[binding_string: string]: fn}}

	events.forEach(function (item) {

		let key;

		for (key in item) {

			const val = item[key];

			// if the value is a function, then, we have a full "closest_selector; event_types[; target_selector]"
			if (typeof val == "function") {
				let firstIdx = key.indexOf(';');
				let closestSelector = key.substring(0, firstIdx);
				let bindingString = key.substring(firstIdx + 1);

				acc.push([closestSelector, bindingString, val]);
			}

			// otherwise, key is the closestSelector, and has value as objecct {"event_types[; target_selector]": fn}}
			else {
				closestSelector = key;
				let subKey;
				for (subKey in val) {
					acc.push([closestSelector, subKey, val]);
				}
			}
		}
	});

	return acc;
}


function bindEvents(eventDics, el, opts) {
	eventDics = asArray(eventDics); // make we have an array of eventDic

	var eventSelector; // e.g., "click; button.add"

	var i,
		eventDic; // {"click; button.add": function(){}, ...}		

	for (i = 0; i < eventDics.length; i++) {
		eventDic = eventDics[i];

		for (eventSelector in eventDic) {
			bindEvent(el, eventSelector, eventDic[eventSelector], opts);
		}

	}


}
// TODO: need to unbind on "willDestroy"

function bindEvent(el, eventSelector, fn, opts) {
	let selectorSplitted = eventSelector.trim().split(";"); // e.g., ["click", " button.add"]
	let type = selectorSplitted[0].trim(); // e.g., "click"
	let selector = null; // e.g., "button.add"

	if (selectorSplitted.length > 1) {
		selector = selectorSplitted[1].trim();
	}
	_event.on(el, type, selector, fn, opts);
}
// --------- /Events Hook --------- //