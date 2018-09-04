var utils = require("./utils.js");
var dom = require("./dom.js");

module.exports = {
	hook: hook,
	register: register,
	display: display,
	remove: remove,
	empty: empty
};

var viewDefDic = {};

var viewIdSeq = 0;

var hooks = {
	willCreate: [],
	didCreate: [],
	willInit: [],
	didInit: [],
	willDisplay: [],
	didDisplay: [],
	willPostDisplay: [],
	didPostDisplay: [],
	willRemove: [],
	didRemove: []
};

var defaultConfig = {
	append: "last"
};

// --------- Public APIs --------- //
function hook(name, fun) {
	hooks[name].push(fun);
}

function register(nameOrConstructor, archetypeOrConfig, config) {

	var name = null;
	var constructor = null;
	var archetype = null;

	if (nameOrConstructor instanceof Function) {

		constructor = nameOrConstructor;
		name = constructor.name;
		if (!name || name === "function") {
			throw new Error("MVDOM ERROR - Cannot register an anonymous function, must be a full constructor function or a class");
		}
		config = archetypeOrConfig;
	} else {
		name = nameOrConstructor;
		archetype = archetypeOrConfig;
	}

	utils.printOnce(`DEPRECATED - register ${name}`);

	var viewDef = {
		name: name,
		constructor: constructor,
		archetype: archetype,
		config: config
	};

	viewDefDic[name] = viewDef;
}

function display(nameOrConstructorOrInstance, parentEl, data, config) {
	var self = this;

	var view = doInstantiate(nameOrConstructorOrInstance, data, config);

	return doCreate(view, data)
		.then(function () {
			return doInit(view, data);
		})
		.then(function () {
			return doDisplay.call(self, view, parentEl, data);
		})
		.then(function () {
			return doPostDisplay(view, data);
		});

}

function empty(els) {
	utils.asArray(els).forEach(function (el) {
		removeEl(el, true); // true to say childrenOnly
	});
}

function remove(els) {
	utils.asArray(els).forEach(function (el) {
		removeEl(el);
	});
}
// --------- /Public APIs --------- //

// will remove a el or its children
function removeEl(el, childrenOnly) {
	childrenOnly = (childrenOnly === true);

	//// First we remove/destory the sub views
	var childrenViewEls = utils.asArray(dom.all(el, ".d-view"));

	// Reverse it to remove/destroy from the leaf
	var viewEls = childrenViewEls.reverse();

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
		if (el._view) {
			doRemove(el._view);
		} else {
			if (el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}
	}

}



// return the "view" instance
// TODO: need to be async as well and allowed for loading component if not exist
function doInstantiate(nameOrConstructorOrInstance, data, config) {

	// if the config is a string, then assume it is the append directive.
	if (typeof config === "string") {
		config = { append: config };
	}

	var name, constructor, instance = null;

	// if we instantiate by a registered name
	if (typeof nameOrConstructorOrInstance === "string") {
		name = nameOrConstructorOrInstance;
		utils.printOnce(`DEPRECATED - display by name ${name}`);
	}
	// if we instantiate by a construsctor function
	else if (typeof nameOrConstructorOrInstance === "function") {
		name = nameOrConstructorOrInstance.name;
		utils.printOnce(`DEPRECATED - display by construtor ${name}`);
		constructor = nameOrConstructorOrInstance;
	}
	// if we have an instance object
	else if (typeof nameOrConstructorOrInstance === "object") {
		instance = nameOrConstructorOrInstance;
		if (instance.name != null) {
			name = instance.name;
		} else if (nameOrConstructorOrInstance.constructor) {
			// for now, we assume the name is the constructor name
			name = nameOrConstructorOrInstance.constructor.name;
		} else {
			throw new Error("MVDOM ERROR - This view instance does not have .name or .constructor.name, not a valid view");
		}
	} else {
		throw new Error("MVDOM ERROR - not valid display argument (should be string, function constructor, or instance object) but it is: " + nameOrConstructorOrInstance);
	}

	var viewDef = null;
	// if we need to instantiate
	if (instance === null) {
		// get the view def from the dictionary
		viewDef = viewDefDic[name];

		// if we display by constructor
		if (constructor != null) {
			// check that if we have a viewDef for the constructor name, it matches. 
			if (viewDef && viewDef.constructor !== constructor) {
				throw new Error("MVDOM ERROR - Constructor function to display " + name +
					" does match what it was registered. Registered named should be unique as they can be displayed by name.");
			}
			// if we do not have a viewDef, we can create one on the fly
			if (!viewDef) {
				viewDef = {
					name: name,
					constructor: constructor
				};
			}
		}
		// if viewDef not found, throw an exception (Probably not registered)
		if (!viewDef) {
			throw new Error("mvdom ERROR - View definition for '" + name + "' not found. Make sure to call d.register(viewName, viewController).");
		}
	}
	// if we have an instance, we can create the viewDef on the fly
	else {
		viewDef = {
			name: name,
			instance: instance
		};
	}


	var viewConfig = Object.assign({}, defaultConfig, viewDef.config, config);

	var view = null;
	if (viewDef.instance) {
		view = viewDef.instance;
	} else if (viewDef.archetype) {
		view = Object.assign({}, viewDef.archetype);
	} else if (viewDef.constructor) {
		view = new viewDef.constructor(data, config);
	}

	// set the config
	view.config = viewConfig;

	// set the id
	view.id = viewIdSeq++;

	// set the name
	view.name = name;

	return view;
}

// return a promise that resolve with nothing.
function doCreate(view, data) {
	performHook("willCreate", view);

	// Call the view.create
	var p = Promise.resolve(view.create(data));

	return p.then(function (html_or_node) {

		var node = (typeof html_or_node === "string") ? dom.frag(html_or_node) : html_or_node;

		// If we have a fragument
		if (node.nodeType === 11) {
			if (node.childNodes.length > 1) {
				console.log("mvdom - WARNING - view HTML for view", view, "has multiple childNodes, but should have only one. Fallback by taking the first one, but check code.");
			}
			node = node.firstChild;
		}

		// make sure that the node is of time Element
		if (node.nodeType !== 1) {
			throw new Error("el for view " + view.name + " is node of type Element. " + node);
		}

		var viewEl = node;

		// set the view.el and view.el._view
		view.el = viewEl;
		view.el.classList.add("d-view");
		view.el._view = view;

		performHook("didCreate", view);
	});
}

function doInit(view, data) {
	performHook("willInit", view);
	var res;

	if (view.init) {
		res = view.init(data);
	}
	return Promise.resolve(res).then(function () {
		performHook("didInit", view);
	});
}

function doDisplay(view, refEl, data) {
	// if we have a selector, assume it is a selector from document.
	if (typeof refEl === "string") {
		refEl = dom.first(refEl);
	}

	performHook("willDisplay", view);

	try {
		// WORKAROUND: this needs tobe the mvdom, since we have cyclic reference between dom.js and view.js (on empty)
		dom.append.call(this, refEl, view.el, view.config.append);
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

function doPostDisplay(view, data) {
	performHook("willPostDisplay", view);

	var result;
	if (view.postDisplay) {
		result = view.postDisplay(data);
	}

	return Promise.resolve(result).then(function () {
		return view;
	});

}

function doRemove(view) {
	// Note: on willRemove all of the events bound to documents, window, parentElements, hubs will be unbind.
	performHook("willRemove", view);

	// remove it from the DOM
	// NOTE: this means that the detach won't remove the node from the DOM
	//       which avoid removing uncessary node, but means that didDetach will
	//       still have a view.el in the DOM
	var parentEl;
	if (view.el && view.el.parentNode) {
		parentEl = view.el.parentNode;
		view.el.parentNode.removeChild(view.el);
	}

	// we call 
	if (view.destroy) {
		view.destroy({ parentEl: parentEl });
	}

	performHook("didRemove", view);
}


function performHook(name, view) {
	var hookFuns = hooks[name];
	var i = 0, l = hookFuns.length, fun;
	for (; i < l; i++) {
		fun = hookFuns[i];
		fun(view);
	}
}


