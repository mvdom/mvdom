
// Note: if we put the types in mvdom namespace, then, they do not get expanded by intellisense. 

type Append = "first" | "last" | "empty" | "before" | "after";
type HookStage = "willCreate" | "didCreate" | "willInit" | "didInit" | "willDisplay" | "didDisplay" | "willPostDisplay" | "didPostDisplay" | "willRemove" | "didRemove";	
type EventTargetOrMoreOrNull = EventTarget | NodeList | [HTMLElement] | null;
type HTMLElementOrNull = HTMLElement | null | undefined;


/** Config that can be set at the view controller registration or overriden by view instantiation (i.e. mvdom.display) */
declare interface Config{
	append: Append;
}

declare interface HubEventInfo{
	topic: string;
	label: string;
}

export declare interface ViewController{
	create?(this:View, data?: any, config?: Config): string | HTMLElement | DocumentFragment;
	init?(this:View, data?: any, config?: Config): any;
	postDisplay?(this:View, data?: any, config?: Config): any;
	destroy?(this:View): any;

	events?: {[name:string]: (this:View, evt: Event) => void};

	docEvents?: {[name:string]: (this:View, evt: Event) => void};

	winEvents?: {[name:string]: (this:View, evt: Event) => void};

	hubEvents?: {[name:string]: (this:View, data: any, info: HubEventInfo ) => void};

	[name: string]: any;
}

// for now, the View extends the ViewContoller (single object)
export declare interface View extends ViewController{
	/** Unique id of the view. Used in namespace binding and such.  */
	id: string;

	/** The view name or "class name". */
	name: string;

	/** The htmlElement created */
	el?: HTMLElement;
}

//export declare interface View extends ViewController{}

declare interface EventOptions {
	/** The context with which the call back will be called (i.e. this context) */
	ctx?: object,
	/** The namespace used to bind this event, which will allow to remove all of the binding done with this namespace with .off */
	ns?: string
}

type NsObject = {ns: string};

declare interface EventInfo{
	cancelable: true | false;
	detail: any;
}

type HubSubHandler = (data: any, info: any) => void;

declare interface Hub{

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

export declare interface Mvdom {
	
	// --------- View --------- //
	/** Register a new view controller with a name (used in mvdom.display(name, ...)) 
	 *  @param name the name of the view controller type. Usually camel case (e.g., "MyView")
	 *  @param viewController the controller object that will be used to instanatiate the view
	*/
	register(name: string, viewController: ViewController, config?: Config): void;

	register<T extends ViewController>(viewControllerClass: {new(): T;} ): void;

	/** Create a new view instanced for this given name and append it to the parentEl
	 * 
	 *  @param viewName The view type name to be instantiated 
	 *  @param parentEl Either a document element or a query selector that will be the parent
	 *  @param data An optional data object to be passed to the view instance. Need to be null if config is present.
	 *  @param config An optional config telling more information or append type
	*/
	display(viewName: string, parentEl: string | HTMLElementOrNull, data?: any | null, config?: Config | Append): Promise<View>;

	display<C extends View>(viewController: {new(): C;}, parentEl: string | HTMLElementOrNull, data?: any | null, config?: Config | Append): Promise<C>;

	/** Register a HookCallback function that will be called when any view reach this lifecycle stage */
	hook(hookStage: HookStage, cb: (view: View) => void): void;

	empty(el: HTMLElementOrNull): void;
	remove(el: HTMLElementOrNull): void;
	// --------- /View --------- //

	// --------- DOM Event Helpers --------- //

	/** Direct event binding to one of more HTML Element */
	on(els: EventTargetOrMoreOrNull, types: string, listener: (evt:DocumentEvent) => void, opts?: EventOptions): void;
	/** Selector based binding to one or more HTML ELement. Only one binding per els, but will use selector string to decide if the listener should be called (similar to jQuery.on) */
	on(els: EventTargetOrMoreOrNull, types: string, selector: string, listener: (evt: any) => void, opts?: EventOptions): void;

	off(els: EventTargetOrMoreOrNull, types: string, selector?: string, listener?: (evt: any) => void, nsObj?: NsObject): void;
	off(els: EventTargetOrMoreOrNull, nsObj: {ns: string}): void;

	trigger(els: EventTargetOrMoreOrNull, eventName: string, info?: EventInfo): void;
	// --------- /DOM Event Helpers --------- //

	// --------- DOM Query Helpers --------- //
	all(el: HTMLElementOrNull, selector: string): NodeListOf<HTMLElement>;
	all(selector: string): NodeListOf<HTMLElement>;

	/** Shortchut to el.querySelector, but allow el to be null (in which case will return null) */
	first(el: HTMLElementOrNull, selector: string): HTMLElementOrNull;
	/** Shortcut for document.querySelector */
	first(selector: string): HTMLElementOrNull;
	/** find the firstElementChild (even from fragment for borwsers that do not support it) */
	first(el: HTMLElementOrNull): HTMLElementOrNull;
	
	/** Returns the next sibling element matching an optional selector (returns null if none)*/
	next(el: HTMLElementOrNull, selector?: string): HTMLElementOrNull;
	/** Returns the previous sibling element matching an optional selector (return null if none)*/
	prev(el: HTMLElementOrNull, selector?: string): HTMLElementOrNull;

	/** Find the closest HTMLElement from this element given a selector (including el if match). */
	closest(el: HTMLElementOrNull, selector: string): HTMLElementOrNull;
	// --------- /DOM Query Helpers --------- //

	// --------- DOM Helpers --------- //
	/** standard refEl.appendChild(newEl) (just here for symmetry) 
	 * @returns the newEl
	*/
	append(refEl: HTMLElement, newEl: HTMLElement | DocumentFragment, append?: Append): HTMLElement; 

	/** Create a DocumentFragment from a string. (Use template.content with fallback on older browser) */
	frag(html: string): DocumentFragment;
	// --------- /DOM Helpers --------- //

	// --------- push/pull --------- //
	/** Push a data object into a DOM Element subtree (given the dx naming convention). */
	push(el: HTMLElement, data: any): void;
	push(el: HTMLElement, selector: string, data: any): void;
	
	/** Extract a data object from a DOM Element subtree (given the dx naming convention). */
	pull(el: HTMLElement, selector?: string, data?: any): any;

	/** register pusher function set a value to a matching element */
	pusher(selector: string, pusherFn: (value: any) => void): void;

	/** register puller function returns the value from a matching element.
	 * The pullerFn `this` context will be the domElement that we extract from and it should return the value. 
	 */
	puller(selector: string, pullerFn: () => any ): void;
	// --------- /push/pull --------- //

	// --------- Hub (pub/sub) --------- //
	hub(name: string): Hub;
	// --------- /Hub (pub/sub) --------- //
}

