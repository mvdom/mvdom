'use strict';

var utils = require("./utils.js");

module.exports = {
	on: on,
	off: off,
	trigger: trigger
};

// --------- Module APIs --------- //

// bind a event can be call with 
// - els: single or array of the base dom elements to bind the event listener upon.
// - type: event type (like 'click' or can be custom event).
// - selector: (optional) query selector which will be tested on the target element. 
// - listener: function which will get the "event" as first parameter
// - opts: (optional) {ns,ctx} optional namespace and ctx (i.e. this)
function on(els, type, selector, listener, opts){

	// if the "selector" is a function, then, it is the listener and there is no selector
	if (selector instanceof Function){
		listener = selector;
		selector = null;
		opts = listener;
	}

	var typeSelectorKey = buildTypeSelectorKey(type, selector);

	utils.asArray(els).forEach(function(el){

		// This will the listener use for the even listener, which might differ
		// from the listener function passed in case of a selector
		var _listener = listener; 

		// if we have a selector, create the wrapper listener to do the matches on the selector
		if (selector){
			_listener = function(evt){
				var tgt = null;
				var target = evt.target;
				var currentTarget = evt.currentTarget;
				var ctx = (opts)?opts.ctx:null;
				// if the target match the selector, then, easy, we call the listener
				if (target.matches(selector)){
					// Note: While mouseEvent are readonly for its properties, it does allow to add custom properties
					evt.selectTarget = target;
					listener.call(ctx,evt);
				}
				// now, if it does not, perhaps something in between the target and currentTarget
				// might match
				else{
					tgt = evt.target.parentNode;
					// TODO: might need to check that tgt is not undefined as well. 
					while (tgt !== null && tgt !== currentTarget && tgt !== document){
						if (tgt.matches(selector)){
							// Note: While mouseEvent are readonly for its properties, it does allow to add custom properties
							evt.selectTarget = tgt;
							listener.call(ctx,evt);
							tgt = null;
							break;
						}

						tgt = tgt.parentNode;
					}
				}
			};
		}
		// if we do not have a selector, but still havea  opts.ctx, then, need to wrap
		else if (opts && opts.ctx){
			_listener = function(evt){
				listener.call(opts.ctx,evt);
			};
		}
		
		var listenerRef = {
			type: type,
			listener: listener, // the listener as passed by the user
			_listener: _listener, // an eventual wrap of the listener, or just point listener.
		};

		if (selector){
			listenerRef.selector = selector;
		}

		// If we have a namespace, they add it to the Ref, and to the listenerRefsByNs
		// TODO: need to add listenerRef in a nsDic if if there a opts.ns
		if (opts && opts.ns){
			listenerRef.ns = opts.ns;
			var listenerRefSetByNs = utils.ensureMap(el,"listenerRefsByNs");
			var listenerRefSet = utils.ensureSet(listenerRefSetByNs, opts.ns);
			listenerRefSet.add(listenerRef);
		}

		// add the listenerRef as listener:listenerRef entry for this typeSelectorKey in the listenerDic
		var listenerDic = utils.ensureMap(el,"listenerDic");
		var listenerRefByListener = utils.ensureMap(listenerDic,typeSelectorKey);
		listenerRefByListener.set(listener, listenerRef);

		// do the binding
		el.addEventListener(type, _listener);

		return this;
	});
}


// remove the event binding
// .off(els); remove all events added via .on
// .off(els, type); remove all events of type added via .on
// .off(els, type, selector); remove all events of type and selector added via .on
// .off(els, type, selector, listener); remove event of this type, selector, and listener
// .off(els,{ns}); remove event from the namespace ns
function off(els, type, selector, listener){

	// --------- off(els, {ns}) --------- //
	// if we have a .off(els,{ns:..}) then we do check only the ns
	if (type.ns){		
		var ns = type.ns;
		utils.asArray(els).forEach(function(el){
			var listenerDic = el["listenerDic"];
			var listenerRefsByNs = el["listenerRefsByNs"];
			var listenerRefSet;
			if (listenerRefsByNs){
				listenerRefSet = listenerRefsByNs.get(ns);
				if (listenerRefSet){
					// if we get the set, we remove them all
					listenerRefSet.forEach(function(listenerRef){
						// we remove the event listener
						el.removeEventListener(listenerRef.type, listenerRef._listener);

						// need to remove it from the listenerDic
						var typeSelectorKey = buildTypeSelectorKey(listenerRef.type, listenerRef.selector);
						var listenerRefMapByListener = listenerDic.get(typeSelectorKey);
						if (listenerRefMapByListener.has(listenerRef.listener)){
							listenerRefMapByListener.delete(listenerRef.listener);
						}else{
							// console.log("INTERNAL ERROR should have a listener in el.listenerDic for " + typeSelectorKey);
						}
					});
					// we remove this namespace now that all event handlers has been removed
					listenerRefsByNs.delete(ns);
				}
			}
		});
		return;
	}
	// --------- /off(els, {ns}) --------- //


	// if the "selector" is a function, then, it is the listener and there is no selector
	if (selector instanceof Function){
		listener = selector;
		selector = null;
	}

	var typeSelectorKey = buildTypeSelectorKey(type, selector);

	utils.asArray(els).forEach(function(el){

		// First, get the listenerRefByListener for this type/selectory
		var listenerRefMapByListener = utils.val(el,["listenerDic",typeSelectorKey]);

		// for now, if we do not have a listenerRef for this type/[selector], we throw an error
		if (!listenerRefMapByListener){
			console.log("WARNING - Cannot do .off() since this type-selector '" + typeSelectorKey + 
				"' event was not bound with .on(). We will add support for this later.");
			return;
		}

		// if we do not have a listener function, this mean we need to remove all events for this type/selector
		if (typeof listener === "undefined"){
			listenerRefMapByListener.forEach(function(listenerRef){
				// Note: Here, type === listenerRef.type
				// remove the event
				el.removeEventListener(type, listenerRef._listener);				
			});
			el["listenerDic"].delete(typeSelectorKey);
		}
		// if we have a listener, then, just remove this one.
		else{
			// check that we have the map. 
			var listenerRef = listenerRefMapByListener.get(listener);

			if (!listenerRef){
				console.log("WARNING - Cannot do .off() since no listenerRef for " + typeSelectorKey + 
				" and function \n" + listener + "\n were found. Probably was not registered via on()");
				return;
			}

			// remove the event
			el.removeEventListener(type, listenerRef._listener);

			// remove it from the map
			listenerRefMapByListener.delete(listener);			
		}


	});	
}

var customDefaultProps = {
	bubbles: true,
	cancelable: true
};

function trigger(els, type, data){
	var evt = new CustomEvent(type, Object.assign({},customDefaultProps,data));	
	utils.asArray(els).forEach(function(el){
		el.dispatchEvent(evt);
	});
}
// --------- /Module APIs --------- //


function buildTypeSelectorKey(type, selector){
	var v = type;
	return (selector)?(v + "--" + selector):v;
}
