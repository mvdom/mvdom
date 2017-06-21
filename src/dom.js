module.exports = {
	first: first, 
	all: all, 
	closest: closest,
	next: next,
	prev: prev, 
	append: append,
	frag: frag
};


// for Edge, still do not support .matches :(
var tmpEl = document.createElement("div");
var matchesFn = tmpEl.matches || tmpEl.webkitMatchesSelector || tmpEl.msMatchesSelector;
module.exports._matchesFn = matchesFn; // make it available for this module (this will be internal only)

// --------- DOM Query Shortcuts --------- //

// Shortcut for .querySelector
// return the first element matching the selector from this el (or document if el is not given)
function first(el_or_selector, selector){
	// We do not have a selector at all, then, this call is for firstElementChild
	if (!selector && typeof el_or_selector !== "string"){
		var el = el_or_selector;
		// try to get 
		var firstElementChild = el.firstElementChild;

		// if firstElementChild is null/undefined, but we have a firstChild, it is perhaps because not supported
		if (!firstElementChild && el.firstChild){

			// If the firstChild is of type Element, return it. 
			if (el.firstChild.nodeType === 1 ){
				return el.firstChild;
			}
			// Otherwise, try to find the next element (using the next)
			else{
				return next(el.firstChild);
			}			
		}

		return firstElementChild;
	}
	// otherwise, the call was either (selector) or (el, selector), so foward to the querySelector
	else{
		return _execQuerySelector(false, el_or_selector, selector);	
	}
	
}

// Shortcut for .querySelectorAll
// return an nodeList of all of the elements element matching the selector from this el (or document if el is not given)
function all(el, selector){
	return _execQuerySelector(true, el, selector);
}

// return the first element next to the el matching the selector
// if no selector, will return the next Element
// return null if not found.
function next(el, selector){
	return _sibling(true, el, selector);
}

// if no selector, will return the previous Element
function prev(el, selector){
	return _sibling(false, el, selector);
}

// return the element closest in the hierarchy (up), including this el, matching this selector
// return null if not found
function closest(el, selector){
	var tmpEl = el;
	
	// use "!=" for null and undefined
	while (tmpEl != null && tmpEl !== document){
		if (matchesFn.call(tmpEl,selector)){
			return tmpEl;
		}
		tmpEl = tmpEl.parentElement;		
	}
	return null;
}

// --------- /DOM Query Shortcuts --------- //


// --------- DOM Helpers --------- //
function append(refEl, newEl, position){
	var parentEl, nextSibling = null;
	
	// default is "last"
	position = (position)?position:"last";

	//// 1) We determine the parentEl
	if (position === "last" || position === "first"){
		parentEl = refEl;
	}else if (position === "before" || position === "after"){
		parentEl = refEl.parentNode;
		if (!parentEl){
			throw new Error("mvdom ERROR - The referenceElement " + refEl + " does not have a parentNode. Cannot insert " + position);
		}
	}

	//// 2) We determine if we have a nextSibling or not
	// if "first", we try to see if there is a first child
	if (position === "first"){
		nextSibling = first(refEl); // if this is null, then, it will just do an appendChild
		// Note: this might be a text node but this is fine in this context.
	}
	// if "before", then, the refEl is the nextSibling
	else if (position === "before"){
		nextSibling = refEl;
	}
	// if "after", try to find the next Sibling (if not found, it will be just a appendChild to add last)
	else if (position === "after"){
		nextSibling = next(refEl);
	}

	//// 3) We append the newEl
	// if we have a next sibling, we insert it before
	if (nextSibling){
		parentEl.insertBefore(newEl, nextSibling);
	}
	// otherwise, we just do a append last
	else{
		parentEl.appendChild(newEl);
	}

	return newEl;	
}


function frag(html){
	// make it null proof
	html = (html)?html.trim():null;
	if (!html){
		return null;
	}

	var template = document.createElement("template");
	if(template.content){
		template.innerHTML = html;
		return template.content;
	}
	// for IE 11
	else{
		var frag = document.createDocumentFragment();
		var tmp = document.createElement("div");
		tmp.innerHTML = html;
		while (tmp.firstChild) {
			frag.appendChild(tmp.firstChild);
		}
		return frag;

	}	
}
// --------- /DOM Helpers --------- //




function _sibling(next, el, selector){
	var sibling = (next)?"nextSibling":"previousSibling";

	var tmpEl = (el)?el[sibling]:null;

	// use "!=" for null and undefined
	while (tmpEl != null && tmpEl !== document){
		// only if node type is of Element, otherwise, 
		if (tmpEl.nodeType === 1 && (!selector || matchesFn.call(tmpEl, selector))){
			return tmpEl;
		}
		tmpEl = tmpEl[sibling];
	}
	return null;
}


// util: querySelector[All] wrapper
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
