
var dom = require("./dom.js");
var utils = require("./utils.js");

module.exports = {
	pull: pull,
	push: push,
	puller: puller,
	pusher: pusher
};

var _pushers = [

	["input[type='checkbox'], input[type='radio']", function (value) {
		var iptValue = this.value || "on"; // as some browsers default to this

		// if the value is an array, it need to match this iptValue
		if (value instanceof Array) {
			if (value.indexOf(iptValue) > -1) {
				this.checked = true;
			}
		}
		// otherwise, if value is not an array,
		else if ((iptValue === "on" && value) || iptValue === value) {
			this.checked = true;
		}
	}],

	["input", function (value) {
		if (typeof value !== "undefined") this.value = value;
	}],

	["select", function (value) {
		if (typeof value !== "undefined") this.value = value;
	}],

	["textarea", function (value) {
		if (typeof value !== "undefined") this.value = value;
	}],

	["*", function (value) {
		if (typeof value !== "undefined") this.innerHTML = value;
	}]
];

var _pullers = [
	["input[type='checkbox'], input[type='radio']", function (existingValue) {

		var iptValue = this.value || "on"; // as some browser default to this
		var newValue;
		if (this.checked) {
			// change "on" by true value (which usually what we want to have)
			// TODO: We should test the attribute "value" to allow "on" if it is defined
			newValue = (iptValue && iptValue !== "on") ? iptValue : true;
			if (typeof existingValue !== "undefined") {
				// if we have an existingValue for this property, we create an array
				var values = utils.asArray(existingValue);
				values.push(newValue);
				newValue = values;
			}
		}
		return newValue;
	}],

	["input, select", function (existingValue) {
		return this.value;
	}],

	["textarea", function (existingValue) {
		return this.value;
	}],

	["*", function (existingValue) {
		return this.innerHTML;
	}]
];

function pusher(selector, func) {
	_pushers.unshift([selector, func]);
}

function puller(selector, func) {
	_pullers.unshift([selector, func]);
}

function push(el, selector_or_data, data) {
	var selector;

	// if data is null or undefined
	if (data == null) {
		selector = ".dx";
		data = selector_or_data;
	} else {
		selector = selector_or_data;
	}

	var dxEls = dom.all(el, selector);

	utils.asArray(dxEls).forEach(function (dxEl) {

		var propPath = getPropPath(dxEl);
		var value = utils.val(data, propPath);
		var i = 0, pusherSelector, fun, l = _pushers.length;
		for (; i < l; i++) {
			pusherSelector = _pushers[i][0];
			if (dom._matchesFn.call(dxEl, pusherSelector)) {
				fun = _pushers[i][1];
				fun.call(dxEl, value);
				break;
			}
		}
	});
}

function pull(el, selector) {
	var obj = {};

	selector = (selector) ? selector : ".dx";

	var dxEls = dom.all(el, selector);

	utils.asArray(dxEls).forEach(function (dxEl) {
		var propPath = getPropPath(dxEl);
		var i = 0, pullerSelector, fun, l = _pullers.length;
		for (; i < l; i++) {
			pullerSelector = _pullers[i][0];
			if (dom._matchesFn.call(dxEl, pullerSelector)) {
				fun = _pullers[i][1];
				var existingValue = utils.val(obj, propPath);
				var value = fun.call(dxEl, existingValue);
				if (typeof value !== "undefined") {
					utils.val(obj, propPath, value);
				}
				break;
			}
		}
	});

	return obj;
}

/** 
 * Return the variable path of the first dx-. "-" is changed to "."
 * 
 * @param classAttr: like "row dx dx-contact.name"
 * @returns: will return "contact.name"
 **/
function getPropPath(dxEl) {
	var path = null;
	var i = 0, classes = dxEl.classList, l = dxEl.classList.length, name;
	for (; i < l; i++) {
		name = classes[i];
		if (name.indexOf("dx-") === 0) {
			path = name.split("-").slice(1).join(".");
			break;
		}
	}
	// if we do not have a path in the css, try the data-dx attribute
	if (!path) {
		path = dxEl.getAttribute("data-dx");
	}
	if (!path) {
		path = dxEl.getAttribute("name"); // last fall back, assume input field
	}
	return path;
}



