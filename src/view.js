'use strict';

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

// --------- Public APIs --------- //
function hook(name, fun){
	hooks[name].push(fun);
}

function register(name, controller, config){
	var viewDef = {
		name: name,
		controller: controller,
		config: config
	}; 

	viewDefDic[name] = viewDef;
}

function display(name, parentEl, data, config){

	var view = doInstantiate(name, config);
	
	return doCreate(view, data)
	.then(function(){
		return doInit(view, data);
	})
	.then(function(){
		return doDisplay(view, parentEl, data);
	})
	.then(function(){
		return doPostDisplay(view, data);
	});

}

function empty(els){
	utils.asArray(els).forEach(function(el){
		removeEl(el, true); // true to say childrenOnly
	});
}

function remove(els){
	utils.asArray(els).forEach(function(el){
		removeEl(el);
	});
}
// --------- /Public APIs --------- //

// will remove a el or its children
function removeEl(el, childrenOnly){
	childrenOnly = (childrenOnly === true) ;

	//// First we remove/destory the sub views
	var childrenViewEls = utils.asArray(dom.all(el, ".d-view"));

	// Reverse it to remove/destroy from the leaf
	var viewEls = childrenViewEls.reverse();

	// call doRemove on each view to have the lifecycle performed (willRemove/didRemove, .destroy)
	viewEls.forEach(function(viewEl){
		if (viewEl._view){
			doRemove(viewEl._view);	
		}else{
			// we should not be here, but somehow it happens in some app code (loggin warnning)
			console.log("MVDOM - WARNING - the following dom element should have a ._view property but it is not? (safe ignore)", viewEl);
			// NOTE: we do not need to remove the dom element as it will be taken care by the logic below (avoiding uncessary dom remove)
		}
		
	});

	// if it is removing only the children, then, let's make sure that all direct children elements are removed
	// (as the logic above only remove the viewEl)
	if (childrenOnly){
		// Then, we can remove all of the d.
		while (el.lastChild) {
			el.removeChild(el.lastChild);
		}
	}else{
		// if it is a view, we remove the viewwith doRemove
		if (el._view){
			doRemove(el._view);
		}else{
			if (el.parentNode){
				el.parentNode.removeChild(el);	
			}
			
		}
	}

}



// return the "view" instance
// TODO: need to be async as well and allowed for loading component if not exist
function doInstantiate(name, config){
	// get the view def from the dictionary
	var viewDef = viewDefDic[name];

	// instantiate the view instance
	var view = Object.assign({}, viewDef.controller);

	// set the config
	view.config = Object.assign({}, viewDef.config, config);

	// set the id
	view.id = viewIdSeq++;

	// set the name
	view.name = name;

	return view;
}

// return a promise that resolve with nothing.
function doCreate(view, data){
	performHook("willCreate", view);

	// Call the view.create
	var p = Promise.resolve(view.create(data));

	return p.then(function(html){
		// create the html element
		var div = document.createElement('div');
		div.innerHTML = html;
		var viewEl = div.firstChild;

		// set the view.el and view.el._view
		view.el = viewEl;
		view.el.classList.add("d-view");
		view.el._view = view; 

		performHook("didCreate", view);	
	});
}

function doInit(view, data){
	performHook("willInit", view);
	var res;

	if (view.init){
		res = view.init(data);
	}
	return Promise.resolve(res).then(function(){
		performHook("didInit", view);	
	});
}

function doDisplay(view, parentEl, data){
	performHook("willDisplay", view);

	// add the view to the parent (and probably to do the DOM)
	parentEl.appendChild(view.el);

	performHook("didDisplay", view);
	return new Promise(function(resolve, fail){
		setTimeout(function(){
			resolve();
		},0);
	});
}

function doPostDisplay(view, data){
	performHook("willPostDisplay", view);

	if (view.postDisplay){
		view.postDisplay(data);
	}

	return new Promise(function(resolve, fail){
		resolve(view);
	});
}

function doRemove(view){
	// Note: on willRemove all of the events bound to documents, window, parentElements, hubs will be unbind.
	performHook("willRemove", view);

	// remove it from the DOM
	// NOTE: this means that the detach won't remove the node from the DOM
	//       which avoid removing uncessary node, but means that didDetach will
	//       still have a view.el in the DOM
	var parentEl;
	if (view.el && view.el.parentNode){
		parentEl = view.el.parentNode;
		view.el.parentNode.removeChild(view.el);
	}	

	// we call 
	if (view.destroy){
		view.destroy({parentEl:parentEl});
	}
	
	performHook("didRemove", view);
}


function performHook(name, view){
	var hookFuns = hooks[name];
	var i= 0 , l = hookFuns.length, fun;
	for (; i < l; i++){
		fun = hookFuns[i];
		fun(view);
	}
}


