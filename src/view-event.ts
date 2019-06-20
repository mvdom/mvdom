import { closest } from './dom';
import { bindDOMEvent, bindDOMEvents, ExtendedDOMEventListener, DOMListenerBySelector, off } from './event';
import { hook, View } from './view';


// Note: We bound events after the init (see #34)
hook("didInit", function (view: View) {
	const opts = { ns: "view_" + view.id, ctx: view };
	if (view.events) {
		bindDOMEvents(view.el, view.events, opts);
	}

	if (view.docEvents) {
		bindDOMEvents(document, view.docEvents, opts);
	}

	// TODO: need to have test for win events
	if (view.winEvents) {
		bindDOMEvents(window, view.winEvents, opts);
	}

});

// Note: we bind the closestEvents just before the postDisplay because it needs to be in the DOM to find it's parent.
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

			// if not found, we still ignore the binding (might warn later in console)
			if (closestEl) {
				bindDOMEvent(closestEl, binding[1], binding[2], opts);
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
		let closestSelectorDone: { [selector: string]: boolean } = {};
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



type FnByActionSelectorByClosestSelector = { [closestSelector: string]: { [typeSelector: string]: ExtendedDOMEventListener } };
/**
 * 
 * @param {*} events an array of "closest_selector; event_types; target_selector": fn 
 * 											or array of {closest_selector: {"event_types; target_selector": fn}}
 * @returns array of array [closest_selector, binding_string, fn]
 */
function collectClosestBinding(bindings: DOMListenerBySelector | DOMListenerBySelector[] | FnByActionSelectorByClosestSelector | FnByActionSelectorByClosestSelector[]): [string, string, ExtendedDOMEventListener][] {
	let bindingArray = (bindings instanceof Array) ? bindings : [bindings];

	let acc: [string, string, ExtendedDOMEventListener][] = []; // array of {[closest_selector: string] : {[binding_string: string]: fn}}

	bindingArray.forEach(function (item: DOMListenerBySelector | FnByActionSelectorByClosestSelector) {

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
