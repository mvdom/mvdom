import { View, hook } from './view';
import { off, EventOptions, on, ExtendedDOMEventListener } from './event';
import { closest } from './dom';


// --------- Events Hook --------- //
// Note: We bound events after the init (see #34)
hook("didInit", function (view: View) {
	const opts = { ns: "view_" + view.id, ctx: view };
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

hook("willPostDisplay", function (view: View) {
	const opts = { ns: "view_" + view.id, ctx: view };

	if (view.closestEvents) {
		// [closest_selector, binding_string, fn][]
		let allClosestBindings = collectClosestBinding(view.closestEvents);
		// elBySelector cache
		let elBySelector: { [selector: string]: HTMLElement | null } = {};

		// binding: [closest_selector, binding_string, fn]
		allClosestBindings.forEach(function (binding) {
			let closestSelector = binding[0];

			// get the closestEl
			let closestEl: HTMLElement | null = elBySelector[closestSelector];
			if (closestEl === null) { // if null, it was not found before in the dom, so abort
				return;
			} if (closestEl === undefined) { // if undefined, we try to get it. 
				elBySelector[closestSelector] = closestEl = closest(view.el, closestSelector);
			}

			// if not fond, we still ignore the binding (might warn later in console)
			if (closestEl) {
				bindEvent(closestEl, binding[1], binding[2], opts);
			}

		})
	}
});

hook("willRemove", function (view: View) {
	const ns = { ns: "view_" + view.id };
	off(document, ns);
	off(window, ns);


	if (view.closestEvents) {
		let allClosestBindings = collectClosestBinding(view.closestEvents);
		// we keep a cache of what has been done to not do it twice
		let closestSelectorDone: { [selector: string]: HTMLElement | boolean } = {};
		// binding: [closest_selector, binding_string, fn]
		allClosestBindings.forEach(function (binding) {
			let closestSelector = binding[0];

			// if done, we abort
			if (closestSelectorDone[closestSelector]) {
				return;
			}

			// we mark it done (regardless of what happen after)
			closestSelectorDone[closestSelector] = true; // we mark it done

			let closestEl = closest(view.el, closestSelector);
			if (closestEl) {
				off(closestEl, ns);
			}

		});

	}

});

// Selector can be full 'closest_selector; event_types' or just event type
type FnBySelector = { [selector: string]: ExtendedDOMEventListener };
type FnByTypeBySelector = { [closestSelector: string]: { [typeSelector: string]: ExtendedDOMEventListener } };

/**
 * 
 * @param {*} events an array of "closest_selector; event_types[; target_selector]": fn 
 * 											or array of {closest_selector: {"event_types[; target_selector]": fn}}
 * @returns array of array [closest_selector, binding_string, fn]
 */
function collectClosestBinding(bindings: FnBySelector | FnBySelector[] | FnByTypeBySelector | FnByTypeBySelector[]): [string, string, ExtendedDOMEventListener][] {
	let bindingArray = (bindings instanceof Array) ? bindings : [bindings];

	let acc: [string, string, ExtendedDOMEventListener][] = []; // array of {[closest_selector: string] : {[binding_string: string]: fn}}

	bindingArray.forEach(function (item: FnBySelector | FnByTypeBySelector) {

		let key;

		for (key in item) {

			let val = item[key];

			// if the value is a function, then, we have a full "closest_selector; event_types[; target_selector]"
			if (typeof val == "function") {
				let fn = val;
				let firstIdx = key.indexOf(';');
				let closestSelector = key.substring(0, firstIdx);
				let bindingString = key.substring(firstIdx + 1);

				acc.push([closestSelector, bindingString, fn]);
			}

			// otherwise, key is the closestSelector, and has value as objecct {"event_types[; target_selector]": fn}}
			else {
				let closestSelector = key;
				let subKey;
				for (subKey in val) {
					let fn = val[subKey];
					acc.push([closestSelector, subKey, fn]);
				}
			}
		}
	});

	return acc;
}



function bindEvents(eventDics: FnBySelector | FnBySelector[], el: EventTarget, opts: EventOptions) {
	eventDics = (eventDics instanceof Array) ? eventDics : [eventDics]; // make we have an array of eventDic
	for (const eventDic of eventDics) {
		for (const selector in eventDic) {
			bindEvent(el, selector, eventDic[selector], opts);
		}
	}
}


function bindEvent(el: EventTarget, eventSelector: string, fn: ExtendedDOMEventListener, opts: EventOptions) {
	let selectorSplitted = eventSelector.trim().split(";"); // e.g., ["click", " button.add"]
	let type = selectorSplitted[0].trim(); // e.g., "click"
	let selector = null; // e.g., "button.add"

	if (selectorSplitted.length > 1) {
		selector = selectorSplitted[1].trim();
	}
	on(el, type, selector, fn, opts);
}
// --------- /Events Hook --------- //