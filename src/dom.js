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

	// use "!=" for null and undefined
	while (tmpEl != null && tmpEl !== document){
		if (tmpEl.matches(selector)){
			return tmpEl;
		}
		tmpEl = tmpEl.parentElement;		
	}
	return null;
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

