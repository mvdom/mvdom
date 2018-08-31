
module.exports = {
	// Object Utils
	isNull: isNull,
	isEmpty: isEmpty,
	val: val, // public
	ensureMap: ensureMap,
	ensureSet: ensureSet,
	ensureArray: ensureArray,
	ensureObject: ensureObject,

	// asType
	asArray: asArray, // public

	// string utils
	splitAndTrim: splitAndTrim
};

// --------- Object Utils --------- //
var UD = "undefined";
var STR = "string";
var OBJ = "object";

// return true if value is null or undefined
function isNull(v) {
	return (typeof v === UD || v === null);
}

// return true if the value is null, undefined, empty array, empty string, or empty object
function isEmpty(v) {
	var tof = typeof v;
	if (isNull(v)) {
		return true;
	}

	if (v instanceof Array || tof === STR) {
		return (v.length === 0) ? true : false;
	}

	if (tof === OBJ) {
		// apparently 10x faster than Object.keys
		for (var x in v) { return false; }
		return true;
	}

	return false;
}

// TODO: need to document
function val(rootObj, pathToValue, value) {
	var setMode = (typeof value !== "undefined");

	if (!rootObj) {
		return rootObj;
	}
	// for now, return the rootObj if the pathToValue is empty or null or undefined
	if (!pathToValue) {
		return rootObj;
	}
	// if the pathToValue is already an array, do not parse it (this allow to support '.' in prop names)
	var names = (pathToValue instanceof Array) ? pathToValue : pathToValue.split(".");

	var name, currentNode = rootObj, currentIsMap, nextNode;

	var i = 0, l = names.length, lIdx = l - 1;
	for (i; i < l; i++) {
		name = names[i];

		currentIsMap = (currentNode instanceof Map);
		nextNode = currentIsMap ? currentNode.get(name) : currentNode[name];

		if (setMode) {
			// if last index, set the value
			if (i === lIdx) {
				if (currentIsMap) {
					currentNode.set(name, value);
				} else {
					currentNode[name] = value;
				}
				currentNode = value;
			} else {
				if (typeof nextNode === "undefined") {
					nextNode = {};
				}
				currentNode[name] = nextNode;
				currentNode = nextNode;
			}
		} else {
			currentNode = nextNode;
			if (typeof currentNode === "undefined") {
				currentNode = undefined;
				break;
			}
		}

		// if (node == null) {
		// 	return undefined;
		// }
		// // get the next node
		// node = (node instanceof Map)?node.get(name):node[name];
		// if (typeof node === "undefined") {
		// 	return node;
		// }
	}
	if (setMode) {
		return rootObj;
	} else {
		return currentNode;
	}
}

// --------- /Object Utils --------- //

// --------- ensureType --------- //
function ensureObject(obj, propName) {
	return _ensure(obj, propName);
}
// Make sure that this obj[propName] is a js Map and returns it. 
// Otherwise, create a new one, set it, and return it.
function ensureMap(obj, propName) {
	return _ensure(obj, propName, Map);
}

// Make sure that this obj[propName] is a js Set and returns it. 
// Otherwise, create a new one, set it, and return it.
function ensureSet(obj, propName) {
	return _ensure(obj, propName, Set);
}

// same as ensureMap but for array
function ensureArray(obj, propName) {
	return _ensure(obj, propName, Array);
}

function _ensure(obj, propName, type) {
	var isMap = (obj instanceof Map);
	var v = (isMap) ? obj.get(propName) : obj[propName];
	if (isNull(v)) {
		v = (type == null) ? {} : (type === Array) ? [] : (new type);
		if (isMap) {
			obj.set(propName, v);
		} else {
			obj[propName] = v;
		}
	}
	return v;
}

// --------- /ensureType --------- //

// --------- asType --------- //
// Return an array from a value object. If value is null/undefined, return empty array. 
// If value is null or undefined, return empty array
// If the value is an array it is returned as is
// If the value is a object with forEach/length will return a new array for these values
// Otherwise return single value array
function asArray(value) {
	if (!isNull(value)) {
		if (value instanceof Array) {
			return value;
		}
		// If it is a nodeList, copy the elements into a real array
		else if (value.constructor && value.constructor.name === "NodeList") {
			return Array.prototype.slice.call(value);
		}
		// if it is a function arguments
		else if (value.toString() === "[object Arguments]") {
			return Array.prototype.slice.call(value);
		}
		// otherwise we add value
		else {
			return [value];
		}
	}
	// otherwise, return an empty array
	return [];
}
// --------- /asType --------- //

// --------- String Utils --------- //
function splitAndTrim(str, sep) {
	if (str == null) {
		return [];
	}
	if (str.indexOf(sep) === -1) {
		return [str.trim()];
	}
	return str.split(sep).map(trim);
}

function trim(str) {
	return str.trim();
}
// --------- /String Utils --------- //
