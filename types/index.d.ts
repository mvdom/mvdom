//////////////////////////////////////////////////////////////////
/// mvdom Types 

// --------- Type Helpers --------- //
type Append = "first" | "last" | "empty" | "before" | "after";
type HookStage = "willCreate" | "didCreate" | "willInit" | "didInit" | "willDisplay" | "didDisplay" | "willPostDisplay" | "didPostDisplay" | "willRemove" | "didRemove";
type EventTargetOrMoreOrNull = EventTarget | NodeList | [Node] | null;
type HTMLNode = HTMLElement | DocumentFragment;

// The ExtendedDOMEventListener is an extended type to support eventual .detail from custom event, and .selectTarget which is always added by the binding api. 
// Note: For now, we add the "AndMore" trick as we do not want to limit which type of event/element 
type AndMore = { [key: string]: any };
type HTMLElementAndMore = HTMLElement & AndMore;
type ExtendedEvent = Event & { detail?: any, selectTarget: HTMLElementAndMore } & AndMore;
export type ExtendedDOMEventListener = (evt: ExtendedEvent) => void;


// --------- /Type Helpers --------- //

interface Config {
	append?: Append;
	data?: any;
}

// --------- Hub --------- //
/**
 * Extends the DOM AddEventListenerOptions for .once, .capture, .passive
 */
interface EventOptions {
	/** The context with which the call back will be called (i.e. 'this' context) */
	ctx?: object,
	/** The namespace used to bind this event, which will allow to remove all of the binding done with this namespace with .off */
	ns?: string,
	/** AddEventListenerOptions.capture */
	capture?: boolean,
	/** AddEventListenerOptions.passive */
	passive?: boolean,
}

type NsObject = { ns: string };

interface EventInfo {
	cancelable?: true | false; // default will be true
	detail?: any;
}

interface HubEventInfo {
	topic: string;
	label: string;
}

type HubSubHandler = (data: any, info: any) => void;

interface Hub {

	/** Subscribe a new hanlder to one or more topics ("," separated) */
	sub(topics: string, handler: HubSubHandler, opts?: EventOptions): void;
	/** Subscribe a new hanlder to one or more topics ("," separated) and one or more labels */
	sub(topics: string, labels: string, handler: HubSubHandler, opts?: EventOptions): void;

	/** Publish a message to a hub for a given topic  */
	pub(topic: string, message: any): void;
	/** Publish a message to a hub for a given topic and label  */
	pub(topic: string, label: string, message: any): void;

	/** Unsubscribe all subscription for a given namespace */
	unsub(nsObj: NsObject): void;

}
// --------- /Hub --------- //

// --------- View Interfaces --------- //
type eventBindings = { [name: string]: ExtendedDOMEventListener };
type hubBindings = { [selector: string]: (this: AnyView, data: any, info: HubEventInfo) => void } |
{ [hubName: string]: { [selector: string]: (this: AnyView, data: any, info: HubEventInfo) => void } }

export interface ViewController {
	create(config?: Config): string | HTMLElement | DocumentFragment;
	init?(config?: Config): any;
	postDisplay?(config?: Config): any;
	destroy?(): any;

	events?: eventBindings | eventBindings[];

	docEvents?: eventBindings | eventBindings[];

	winEvents?: eventBindings | eventBindings[];

	hubEvents?: hubBindings | hubBindings[];

}

// for now, the View extends the ViewContoller (single object)
export interface View extends ViewController {
	/** Unique id of the view. Used in namespace binding and such.  */
	id: number;

	/** The view name or "class name". */
	name: string;

	/** The htmlElement created */
	el: HTMLElement;
}

// type PreView = 
// Minimum 

export interface AnyView extends View {
	[name: string]: any;
}


// --------- /View Interfaces --------- //


//////////////////////////////////////////////////////////////////
/// mvdom API

// --------- View --------- //
/** Append by viewInstance
 *  @param viewInstance: The view instance
 */
export function display<V extends View>(viewInstance: ViewController & { [n: string]: any }, refEl: string | HTMLElement, config?: Config | Append): Promise<typeof viewInstance & View>;


/** Register a HookCallback function that will be called when any view reach this lifecycle stage */
export function hook(hookStage: HookStage, cb: (view: View) => void): void;

export function empty(el: HTMLNode | null | undefined): void;
export function remove(el: HTMLNode | null | undefined): void;
// --------- /View --------- //

// --------- DOM Event Helpers --------- //
// For DocumentEvent and custom events that might have a .detail for the data
// Note: For now, we add the "AndMore" trick as we do not want to limit which type of event/element 

/** Direct event binding to one of more HTML Element */
export function on(els: EventTargetOrMoreOrNull, types: string, listener: ExtendedDOMEventListener, opts?: EventOptions): void;
/** Selector based binding to one or more HTML ELement. Only one binding per els, but will use selector string to decide if the listener should be called (similar to jQuery.on) */
export function on(els: EventTargetOrMoreOrNull, types: string, selector: string, listener: ExtendedDOMEventListener, opts?: EventOptions): void;

export function off(els: EventTargetOrMoreOrNull, types: string, selector?: string, listener?: ExtendedDOMEventListener, nsObj?: NsObject): void;
export function off(els: EventTargetOrMoreOrNull, nsObj: { ns: string }): void;

export function trigger(els: EventTargetOrMoreOrNull, eventName: string, info?: EventInfo): void;
// --------- /DOM Event Helpers --------- //

// --------- DOM Query Helpers --------- //
export function all(el: HTMLNode | null | undefined, selector: string): HTMLElement[];
export function all(selector: string): HTMLElement[];

/** Shortchut to el.querySelector, but allow el to be null (in which case will return null) */
export function first(el: HTMLNode | null | undefined, selector: string): HTMLElement | null;
/** Shortcut for document.querySelector */
export function first(selector: string): HTMLElement | null;
/** find the firstElementChild (even from fragment for borwsers that do not support it) */
export function first(el: HTMLNode | null | undefined): HTMLElement | null;

/** Returns the next sibling element matching an optional selector (returns null if none. returns Element not Node)*/
export function next(el: HTMLElement | null | undefined, selector?: string): HTMLElement | null;
/** Returns the previous sibling element matching an optional selector (returns null if none. returns Element not Node)*/
export function prev(el: HTMLElement | null | undefined, selector?: string): HTMLElement | null;

/** Find the closest ELement from this element given a selector (including el if match). */
export function closest(el: HTMLElement | null | undefined, selector: string): HTMLElement | null;
// --------- /DOM Query Helpers --------- //

// --------- DOM Helpers --------- //
/** standard refEl.appendChild(newEl) (just here for symmetry) 
 * @returns the newEl
*/
export function append(refEl: HTMLNode, newEl: HTMLNode, append?: Append): HTMLElement;

/** Create a DocumentFragment from a string. (Use template.content with fallback on older browser) */
export function frag(html: string): DocumentFragment;
// --------- /DOM Helpers --------- //

// --------- push/pull --------- //
/** Push a data object into a DOM Element subtree (given the dx naming convention). */
export function push(el: HTMLElement, data: any): void;
export function push(el: HTMLElement, selector: string, data: any): void;

/** Extract a data object from a DOM Element subtree (given the dx naming convention). */
export function pull(el: HTMLElement, selector?: string, data?: any): any;

/** register pusher function set a value to a matching element */
export function pusher(selector: string, pusherFn: (value: any) => void): void;

/** register puller function returns the value from a matching element.
 * The pullerFn `this` context will be the domElement that we extract from and it should return the value. 
 */
export function puller(selector: string, pullerFn: () => any): void;
// --------- /push/pull --------- //

// --------- Hub (pub/sub) --------- //
export function hub(name: string): Hub;
// --------- /Hub (pub/sub) --------- //

