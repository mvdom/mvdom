import { asNodeArray } from './utils';

export type Append = "first" | "last" | "empty" | "before" | "after";
type HTMLElementOrFragment = HTMLElement | DocumentFragment;

// --------- DOM Query Shortcuts --------- //

// Shortcut for .querySelector
// return the first element matching the selector from this el (or document if el is not given)
/** Shortchut to el.querySelector, but allow el to be null (in which case will return null) */
export function first(el: HTMLElementOrFragment | null | undefined, selector: string): HTMLElement | null;
export function first(selector: string): HTMLElement | null;
export function first(el: HTMLElementOrFragment | null | undefined): HTMLElement | null;
export function first(el_or_selector: HTMLElementOrFragment | string | null | undefined, selector?: string) {
	// We do not have a selector at all, then, this call is for firstElementChild
	if (!selector && typeof el_or_selector !== "string") {
		const el = el_or_selector as HTMLElementOrFragment;
		// try to get 
		const firstElementChild = el.firstElementChild;

		// if firstElementChild is null/undefined, but we have a firstChild, it is perhaps because not supported
		if (!firstElementChild && el.firstChild) {

			// If the firstChild is of type Element, return it. 
			if (el.firstChild.nodeType === 1) {
				return el.firstChild;
			}
			// Otherwise, try to find the next element (using the next)
			else {
				// TODO: Needs to look at typing here, this is a ChildNode
				return next(el.firstChild);
			}
		}

		return firstElementChild as HTMLElement;
	}
	// otherwise, the call was either (selector) or (el, selector), so foward to the querySelector
	else {
		return _execQuerySelector(false, el_or_selector, selector);
	}

}

// TODO: might need to return readonly HTMLElement[] to be consistent with asNodeArray
/** Convenient and normalized API for .querySelectorAll. Return Array (and not node list) */
export function all(el: HTMLElementOrFragment | null | undefined, selector: string): HTMLElement[];
export function all(selector: string): HTMLElement[];
export function all(el: HTMLElementOrFragment | null | undefined | string, selector?: string) {
	const nodeList = _execQuerySelector(true, el, selector);
	return (nodeList != null) ? asNodeArray(nodeList) : [];
}

/**
 * Get the eventual next sibling of an HTMLElement given (optionally as selector)
 */
export function next(el: Node | null | undefined, selector?: string): HTMLElement | null {
	return _sibling(true, el, selector) as HTMLElement; // assume HTMLElement
}

/**
 * Get the eventual previous sibling
 */
export function prev(el: Node | null | undefined, selector?: string): HTMLElement | null {
	return _sibling(false, el, selector) as HTMLElement;  // assume HTMLElement
}

// By default use the document.closest (if not implemented, use the matches to mimic the logic) 
// return null if not found
export function closest(el: HTMLElement | null | undefined, selector: string): HTMLElement | null {
	return (el) ? el.closest(selector) as HTMLElement | null : null;
}
// --------- /DOM Query Shortcuts --------- //


// --------- DOM Helpers --------- //
export function append(this: any, refEl: HTMLElementOrFragment, newEl: HTMLElementOrFragment, position?: Append): HTMLElement {
	let parentEl: HTMLElementOrFragment;
	let nextSibling: HTMLElement | null = null;

	// default is "last"
	position = (position) ? position : "last";

	//// 1) We determine the parentEl
	if (position === "last" || position === "first" || position === "empty") {
		parentEl = refEl;
	} else if (position === "before" || position === "after") {
		parentEl = refEl.parentNode as HTMLElement;
		if (!parentEl) {
			throw new Error("mvdom ERROR - The referenceElement " + refEl + " does not have a parentNode. Cannot insert " + position);
		}
	}

	//// 2) We determine if we have a nextSibling or not
	// if "first", we try to see if there is a first child
	if (position === "first") {
		nextSibling = first(refEl); // if this is null, then, it will just do an appendChild
		// Note: this might be a text node but this is fine in this context.
	}
	// if "before", then, the refEl is the nextSibling
	else if (position === "before") {
		nextSibling = refEl as HTMLElement;
	}
	// if "after", try to find the next Sibling (if not found, it will be just a appendChild to add last)
	else if (position === "after") {
		nextSibling = next(refEl);
	}

	//// 3) We append the newEl
	// if we have a next sibling, we insert it before
	if (nextSibling) {
		parentEl!.insertBefore(newEl, nextSibling);
	}
	// otherwise, we just do a append last
	else {
		if (position === "empty") {
			// TODO: CIRCULAR dependency. Right now, we do need to call the view.empty to do the correct empty, but view also use dom.js
			//       This works right now as all the modules get merged into the same object, but would be good to find a more elegant solution
			this.empty(refEl);
		}
		parentEl!.appendChild(newEl);
	}

	// FIXME: Here if newEl is a DocumentFragment this will return an empty doc fragment
	return newEl as HTMLElement;
}


/**
 * Returns a DocumentFragment for the html string. If html is null or undefined, returns an empty document fragment.
 * @param html the html string or null/undefined
 */
export function frag(html: string | null | undefined) {
	// make it null proof
	html = (html) ? html.trim() : null;

	const template = document.createElement("template");
	if (html) {
		template.innerHTML = html;
	}
	return template.content;
}
// --------- /DOM Helpers --------- //



/**
 * Return the next or previous Element sibling
 * @param next
 * @param el
 * @param selector
 */
function _sibling(next: boolean, el: Node | undefined | null, selector?: string) {
	const sibling: 'nextSibling' | 'previousSibling' = (next) ? 'nextSibling' : 'previousSibling';

	let tmpEl = (el) ? el[sibling] : null;

	// use "!=" for null and undefined
	while (tmpEl != null && tmpEl !== document) {
		// only if node type is of Element, otherwise, 
		if (tmpEl.nodeType === 1 && (!selector || (<Element>tmpEl).matches(selector))) {
			return tmpEl as Element;
		}
		tmpEl = tmpEl[sibling];
	}
	return null;
}


// util: querySelector[All] wrapper
function _execQuerySelector(all: boolean, elOrSelector?: HTMLElement | DocumentFragment | null | string, selector?: string) {
	let el: HTMLElement | Document | DocumentFragment | null = null;
	// if el is null or undefined, means we return nothing. 
	if (elOrSelector == null) {
		return null;
	}
	// if selector is undefined, it means we select from document and el is the document
	if (typeof selector === "undefined") {
		selector = elOrSelector as string;
		el = document;
	} else {
		el = elOrSelector as HTMLElement | DocumentFragment;
	}
	return (all) ? el.querySelectorAll(selector) : el.querySelector(selector);
}
