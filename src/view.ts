import { ExtendedDOMEventListener, DOMListenerBySelector } from './event';
import { HubEventInfo, HubListenerByFullSelector, HubListenerByHubNameBySelector, HubBindings } from './hub';
import { Append, all, frag, first, append } from './dom';
import { asNodeArray } from './utils';

let viewIdSeq = 0;

//#region    ---------- Hook ---------- 
type HookFn = (view: View) => void;

const hookStageNames = ['willCreate', 'didCreate', 'willInit', 'didInit', 'willDisplay', 'didDisplay', 'willPostDisplay', 'didPostDisplay', 'willRemove', 'didRemove'] as const;
type HookStage = typeof hookStageNames[number];

const hooks: Map<HookStage, HookFn[]> = new Map(hookStageNames.map(name => [name, []]));

export function hook(hookStage: HookStage, cb: (view: View) => void): void {
	hooks.get(hookStage)!.push(cb);
}
//#endregion ---------- /Hook ---------- 


//#region    ---------- View Interface ---------- 

interface ViewHTMLElement extends HTMLElement {
	_view: View
}

interface Config {
	append?: Append;
	data?: any;
}


// type hubBindings = { [selector: string]: (this: AnyView, data: any, info: HubEventInfo) => void } |
// { [hubName: string]: { [selector: string]: (this: AnyView, data: any, info: HubEventInfo) => void } }
// type Hub

export interface ViewController {
	create(config?: Config): string | HTMLElement | DocumentFragment;
	init?(config?: Config): any;
	postDisplay?(config?: Config): any;
	destroy?(data?: { parentEl?: HTMLElement }): any;

	events?: DOMListenerBySelector | DOMListenerBySelector[];

	closestEvents?: DOMListenerBySelector | DOMListenerBySelector[];

	docEvents?: DOMListenerBySelector | DOMListenerBySelector[];

	winEvents?: DOMListenerBySelector | DOMListenerBySelector[];

	hubEvents?: HubBindings;

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
//#endregion ---------- /View Interface ---------- 

const defaultConfig = {
	append: "last"
} as const;


//#region    ---------- Lifycle Public APIs ---------- 
/** Append by viewInstance
 *  @param viewInstance: The view instance
 */
export function display<V extends View>(this: any, viewInstance: ViewController & { [n: string]: any }, refEl: string | HTMLElement, config_or_append?: Config | Append): Promise<typeof viewInstance & View> {
	const self = this; // FIXME: This is because of the empty cyclic reference

	const view = viewInstance;

	// if the config is a string, then assume it is the append directive.
	const config = (typeof config_or_append === "string") ? { append: config_or_append } : Object.assign({}, defaultConfig, config_or_append) as Config;
	view.config = config;

	// set the .name, if the instance does not have a name, get it from the constructor if present
	if (view.name == null && view.constructor) {
		view.name = view.constructor.name
	}

	// set the .id, set the unique
	view.id = viewIdSeq++;


	return doCreate(view as View, config)
		.then(function () {
			return doInit(view as View, config);
		})
		.then(function () {
			return doDisplay.call(self, view as View, refEl, config);
		})
		.then(function () {
			return doPostDisplay(view as View, config);
		});
}

export function empty(els: HTMLElement | DocumentFragment | HTMLElement[] | null | undefined): void {
	for (const el of asNodeArray(els)) {
		removeEl(el as HTMLElement, true); // true to say childrenOnly
	}
}

export function remove(els: HTMLElement | DocumentFragment | HTMLElement[] | null | undefined) {
	for (const el of asNodeArray(els)) {
		removeEl(el as HTMLElement); // as HTMLElement for now. 
	}
}
//#endregion ---------- /Lifycle Public APIs ---------- 


// TODO: needs to handle Node
function removeEl(el: HTMLElement, childrenOnly?: boolean) {
	childrenOnly = (childrenOnly === true);

	//// First we remove/destory the sub views
	const childrenViewEls = all(el, ".d-view") as ViewHTMLElement[];

	// Reverse it to remove/destroy from the leaf
	const viewEls = childrenViewEls.reverse();

	// call doRemove on each view to have the lifecycle performed (willRemove/didRemove, .destroy)
	viewEls.forEach(function (viewEl) {
		if (viewEl._view) {
			doRemove(viewEl._view);
		} else {
			// we should not be here, but somehow it happens in some app code (loggin warnning)
			console.log("MVDOM - WARNING - the following dom element should have a ._view property but it is not? (safe ignore)", viewEl);
			// NOTE: we do not need to remove the dom element as it will be taken care by the logic below (avoiding uncessary dom remove)
		}

	});

	// if it is removing only the children, then, let's make sure that all direct children elements are removed
	// (as the logic above only remove the viewEl)
	if (childrenOnly) {
		// Then, we can remove all of the d.
		while (el.lastChild) {
			el.removeChild(el.lastChild);
		}
	} else {
		// if it is a view, we remove the viewwith doRemove
		if ((<any>el)._view) {

			doRemove((<ViewHTMLElement>el)._view);
		} else {
			if (el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}
	}

}

// return a promise that resolve with nothing.
function doCreate(view: View, config: Config) {
	performHook("willCreate", view);

	// Call the view.create
	const p = Promise.resolve(view.create(config));

	return p.then(function (html_or_node) {

		let node = (typeof html_or_node === "string") ? frag(html_or_node) : html_or_node;

		if (node == null) {
			throw new Error(`MVDOM - cannot create view ${view.constructor.name} because doCfreate did not return a valid now`);
		}

		// If we have a fragument
		if (node.nodeType === 11) {
			if (node.childNodes.length > 1) {
				console.log("mvdom - WARNING - view HTML for view", view, "has multiple childNodes, but should have only one. Fallback by taking the first one, but check code.");
			}
			node = node.firstChild as HTMLElement; // FIXME: here needs to find the first HTMLElement and not first node. 
		}

		// make sure that the node is of time Element
		if (node.nodeType !== 1) {
			throw new Error("el for view " + view.name + " is node of type Element. " + node);
		}

		const viewEl = node as ViewHTMLElement; // FIXME: Here needs to handle the DocumentFragment case

		// set the view.el and view.el._view
		view.el = viewEl;
		view.el.classList.add("d-view");
		(<ViewHTMLElement>view.el)._view = view;

		performHook("didCreate", view);
	});
}

function doInit(view: View, config: Config) {
	performHook("willInit", view);
	let res;

	if (view.init) {
		res = view.init(config);
	}
	return Promise.resolve(res).then(function () {
		performHook("didInit", view);
	});
}

// TODO: remove the this:any (for cyclic reference)
function doDisplay(this: any, view: View, refEl: HTMLElement | string, config: Config) {
	// if we have a selector, assume it is a selector from document.
	if (typeof refEl === "string") {
		refEl = first(refEl)!; // FIXME: needs to handle the case when refEl is null
	}

	performHook("willDisplay", view);

	try {
		// WORKAROUND: this needs tobe the mvdom, since we have cyclic reference between dom.js and view.js (on empty)
		append.call(this, refEl, view.el, config.append);
	} catch (ex) {
		throw new Error("mvdom ERROR - Cannot add view.el " + view.el + " to refEl " + refEl + ". Cause: " + ex.toString());
	}

	performHook("didDisplay", view);

	return new Promise(function (resolve, fail) {
		setTimeout(function () {
			resolve();
		}, 0);
	});
}

function doPostDisplay(view: View, config: Config) {
	performHook("willPostDisplay", view);

	let result;
	if (view.postDisplay) {
		result = view.postDisplay(config);
	}

	return Promise.resolve(result).then(function () {
		return view;
	});

}

function doRemove(view: View) {
	// Note: on willRemove all of the events bound to documents, window, parentElements, hubs will be unbind.
	performHook("willRemove", view);

	// remove it from the DOM
	// NOTE: this means that the detach won't remove the node from the DOM
	//       which avoid removing uncessary node, but means that didDetach will
	//       still have a view.el in the DOM
	let parentEl: HTMLElement | undefined;
	if (view.el && view.el.parentNode) {
		parentEl = view.el.parentNode as HTMLElement;
		view.el.parentNode.removeChild(view.el);
	}

	// we call 
	if (view.destroy) {
		view.destroy({ parentEl: parentEl });
	}

	performHook("didRemove", view);
}


function performHook(name: HookStage, view: View) {
	const hookFuns = hooks.get(name)!;
	let i = 0, l = hookFuns.length, fun;
	for (; i < l; i++) {
		fun = hookFuns[i];
		fun(view);
	}
}


