import { asNodeArray, ensureMap, ensureSet, splitAndTrim, val } from './utils';

type EventTargetOrMore = EventTarget | NodeList | [Node];

interface SelectEvent {
	selectTarget: HTMLElement;
}
interface DetailEvent {
	detail?: any;
}

/** The current strategy is to merge the common HTML events for convenient binding, and add &object to allow further casting */
export type ExtendedEvent = Event & SelectEvent & DetailEvent & KeyboardEvent & MouseEvent & TouchEvent & object;

export type ExtendedDOMEventListener = (evt: ExtendedEvent) => void;

type ListenerDic = Map<string, Map<Function, ListenerRef>>;

interface NodeExtension {
	listenerDic?: ListenerDic;
	listenerRefsByNs?: Map<string, any>;
}

export interface EventInfo {
	cancelable?: boolean; // default will be true
	detail?: any;
}

export interface EventOptions {
	/** The context with which the call back will be called (i.e. 'this' context) */
	ctx?: object,
	/** The namespace used to bind this event, which will allow to remove all of the binding done with this namespace with .off */
	ns?: string,
	/** AddEventListenerOptions.capture */
	capture?: boolean,
	/** AddEventListenerOptions.passive */
	passive?: boolean,
}

interface OffOptions {
	ns?: string;
}

interface ListenerRef {
	type: string,
	listener: (evt: ExtendedEvent) => void, // the listener as passed by the user
	selector?: string;
	ns?: string,
	_listener: (evt: ExtendedEvent) => void, // an eventual wrap of the listener, or just point listener.
}

// --------- Module APIs --------- //
/**
 * Bind one or more evevent type to one or more HTMLElements
 * @param els single or array of the base dom elements to bind the event listener upon.
 * @param types event type (like 'click' or can be custom event).
 * @param listener function which will get the "event" as first parameter
 * @param opts (optional) {capture, passive, ctx, ns} optional namespace (ns) and ctx (i.e. this)
 */
export function on(els: EventTargetOrMore | null, types: string, listener: ExtendedDOMEventListener, opts?: EventOptions): void;
/**
 * Bind one or more evevent type to one or more HTMLElements matching a css selector
 * @param els single or array of the base dom elements to bind the event listener upon.
 * @param selector e.g. `.my-class`
 * @param types event type (like 'click' or can be custom event).
 * @param listener function which will get the "event" as first parameter
 * @param opts (optional) {capture, passive, ctx, ns} optional namespace (ns) and ctx (i.e. this)
 */
export function on(els: EventTargetOrMore | null, types: string, selector: string | null, listener: ExtendedDOMEventListener, opts?: EventOptions): void;

export function on(els: EventTargetOrMore | null, types: string, arg1: string | null | ExtendedDOMEventListener, arg2?: ExtendedDOMEventListener | EventOptions, arg3?: EventOptions): void {
	let opts: EventOptions | undefined;
	let listener: ExtendedDOMEventListener;
	let selector: string | undefined | null;

	// arg1 is a function, then no selector, arg1 is the listener, and arg2 is the potential eventOptions
	if (arg1 instanceof Function) {
		listener = arg1;
		opts = arg2 as EventOptions | undefined;
	} else {
		selector = arg1 as string | null;
		listener = arg2 as ExtendedDOMEventListener;
		opts = arg3 as EventOptions | undefined;
	}

	// AddEventListenerOptions	
	let eventOptions: EventOptions;
	if (opts && (opts.passive != null || opts.capture != null)) {
		eventOptions = {};
		if (opts.passive != null) {
			eventOptions.passive = opts.passive;
		}
		if (opts.capture != null) {
			eventOptions.capture = opts.capture;
		}
	}

	if (els == null) {
		return;
	}

	const typeArray = splitAndTrim(types, ",");

	typeArray.forEach(function (type) {
		const typeSelectorKey = buildTypeSelectorKey(type, selector);

		asNodeArray(els).forEach(function (el: Node) {

			// This will the listener use for the even listener, which might differ
			// from the listener function passed in case of a selector
			let _listener = listener;

			// if we have a selector, create the wrapper listener to do the matches on the selector
			if (selector) {
				_listener = function (evt) {
					let tgt: HTMLElement | Document | null = null;
					const target = evt.target;
					const currentTarget = evt.currentTarget;
					const ctx = (opts) ? opts.ctx : null;
					// if the target match the selector, then, easy, we call the listener
					if (target && (<Element>target).matches(selector!)) {
						// Note: While mouseEvent are readonly for its properties, it does allow to add custom properties
						// TODO: type narrowing needed.
						evt.selectTarget = target as HTMLElement;
						listener.call(ctx, evt);
					}
					// now, if it does not, perhaps something in between the target and currentTarget
					// might match
					else {
						// TODO: type narrowing needed.
						tgt = (evt.target as HTMLElement).parentNode as HTMLElement | Document | null;
						// TODO: might need to check that tgt is not undefined as well. 
						while (tgt !== null && tgt !== currentTarget && tgt !== document) {
							if ((<HTMLElement>tgt).matches(selector!)) { // selector is present here (see if above)
								// Note: While mouseEvent are readonly for its properties, it does allow to add custom properties
								evt.selectTarget = tgt as HTMLElement;
								listener.call(ctx, evt);
								tgt = null;
								break;
							}
							tgt = tgt.parentNode as HTMLElement | Document;
						}
					}
				};
			}
			// if we do not have a selector, but still havea  opts.ctx, then, need to wrap
			else if (opts && opts.ctx) {
				_listener = function (evt) {
					listener.call(opts!.ctx, evt);
				};
			}

			const listenerRef: ListenerRef = {
				type: type,
				listener: listener, // the listener as passed by the user
				_listener: _listener, // an eventual wrap of the listener, or just point listener.
			};

			if (selector) {
				listenerRef.selector = selector;
			}

			// If we have a namespace, they add it to the Ref, and to the listenerRefsByNs
			// TODO: need to add listenerRef in a nsDic if if there a opts.ns
			if (opts && opts.ns) {

				listenerRef.ns = opts.ns;
				let listenerRefSetByNs = ensureMap(el, "listenerRefsByNs");
				let listenerRefSet = ensureSet(listenerRefSetByNs, opts.ns);
				listenerRefSet.add(listenerRef);
			}

			// add the listenerRef as listener:listenerRef entry for this typeSelectorKey in the listenerDic
			let listenerDic = ensureMap(el, "listenerDic") as ListenerDic;
			let listenerRefByListener = ensureMap(listenerDic, typeSelectorKey);
			listenerRefByListener.set(listener, listenerRef);

			// do the binding
			// TODO: fix typing here.
			el.addEventListener(type, _listener as EventListener, eventOptions);

		}); // /utils.asArray(els).forEach(function(el){

	}); // /types.forEach(function(type){

}


// remove the event binding
// .off(els); remove all events added via .on
// .off(els, type); remove all events of type added via .on
// .off(els, type, selector); remove all events of type and selector added via .on
// .off(els, type, selector, listener); remove event of this type, selector, and listener
// .off(els,{ns}); remove event from the namespace ns
export function off(els: EventTargetOrMore | null): void;
export function off(els: EventTargetOrMore | null, type: string): void;
export function off(els: EventTargetOrMore | null, type: string, selector: string): void;
export function off(els: EventTargetOrMore | null, type: string, listener?: ExtendedDOMEventListener): void;
export function off(els: EventTargetOrMore | null, type: string, selector: string, listener?: ExtendedDOMEventListener): void;
export function off(els: EventTargetOrMore | null, opts?: OffOptions): void;
export function off(els: EventTargetOrMore | null, type_or_opts?: string | OffOptions, selector_or_listener?: string | ExtendedDOMEventListener, maybe_listener?: ExtendedDOMEventListener) {
	if (els == null) {
		return;
	}

	// for now, opts is only the first position
	const opts: OffOptions | null = (type_or_opts && (<OffOptions>type_or_opts).ns) ? type_or_opts as OffOptions : null;
	const type = (opts === null) ? type_or_opts as string : null;

	let selector: string | null = null;
	let listener: ExtendedDOMEventListener | undefined;

	const tof = typeof selector_or_listener;

	if (tof === 'function') {
		selector = null;
		listener = selector_or_listener as ExtendedDOMEventListener;
	}
	else if (tof === 'string') {
		selector = selector_or_listener as string;
		listener = maybe_listener;
	}

	// --------- off(els, {ns}) --------- //
	// if we have a .off(els,{ns:..}) then we do check only the ns
	if (opts && opts.ns) {
		const ns = opts.ns;
		asNodeArray(els).forEach(function (el: Node & NodeExtension) {
			const listenerDic = el.listenerDic;
			const listenerRefsByNs = el.listenerRefsByNs;
			let listenerRefSet;
			if (listenerRefsByNs && listenerDic) {
				listenerRefSet = listenerRefsByNs.get(ns);
				if (listenerRefSet) {
					// if we get the set, we remove them all
					listenerRefSet.forEach(function (listenerRef: any) {
						// we remove the event listener
						el.removeEventListener(listenerRef.type, listenerRef._listener);

						// need to remove it from the listenerDic
						const typeSelectorKey = buildTypeSelectorKey(listenerRef.type, listenerRef.selector);
						const listenerRefMapByListener = listenerDic.get(typeSelectorKey);
						if (listenerRefMapByListener && listenerRefMapByListener.has(listenerRef.listener)) {
							listenerRefMapByListener.delete(listenerRef.listener);
						} else {
							console.log("INTERNAL ERROR should have a listener in el.listenerDic for " + typeSelectorKey);
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
	const typeSelectorKey = buildTypeSelectorKey(type!, selector);

	asNodeArray(els).forEach(function (el: Node & NodeExtension) {

		// First, get the listenerRefByListener for this type/selectory
		const listenerRefMapByListener = (el.listenerDic) ? el.listenerDic.get(typeSelectorKey) : null; //val(el, ["listenerDic", typeSelectorKey]);

		// for now, if we do not have a listenerRef for this type/[selector], we throw an error
		if (!listenerRefMapByListener) {
			console.log("WARNING - Cannot do .off() since this type-selector '" + typeSelectorKey +
				"' event was not bound with .on(). We will add support for this later.");
			return;
		}

		// if we do not have a listener function, this mean we need to remove all events for this type/selector
		if (typeof listener === "undefined" && type) {
			listenerRefMapByListener.forEach(function (listenerRef) {
				// Note: Here, type === listenerRef.type
				// remove the event
				// TODO: check typing assumption
				el.removeEventListener(type, listenerRef._listener as EventListener);
			});
			el.listenerDic!.delete(typeSelectorKey);
		}
		// if we have a listener, then, just remove this one.
		else {
			// check that we have the map. 
			const listenerRef = (listener) ? listenerRefMapByListener.get(listener) : null;
			if (!listenerRef) {
				console.log("WARNING - Cannot do .off() since no listenerRef for " + typeSelectorKey +
					" and function \n" + listener + "\n were found. Probably was not registered via on()");
				return;
			}

			// remove the event
			// TODO: check typing assumption
			el.removeEventListener(type!, listenerRef._listener as EventListener);

			// remove it from the map
			// TODO: check typing ! assumption
			listenerRefMapByListener.delete(listener!);
		}

	});
}

const customDefaultProps = {
	bubbles: true,
	cancelable: true
};

export function trigger(els: EventTargetOrMore | null | undefined, type: string, info?: EventInfo): void {
	if (els == null) { return; } // for now make it null/undefined proof

	asNodeArray(els).forEach(function (el) {
		const evt = new CustomEvent(type, Object.assign({}, customDefaultProps, { selectTarget: el }, info));
		el.dispatchEvent(evt);
	});
}
// --------- /Module APIs --------- //


function buildTypeSelectorKey(type: string, selector?: string | null): string {
	return (selector) ? (type + "--" + selector) : type;
}
